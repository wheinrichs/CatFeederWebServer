import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import queryString from "query-string";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import UserRoutes from "./Database/Account/routes.js";
import ScheduleRoutes from "./Database/Schedule/routes.js";
import * as dao from "./Database/Account/dao.js";
import { createUser, findUserById } from "./Database/Account/dao.js";
import { createSchedule } from "./Database/Schedule/dao.js";


const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/petfeeder"
mongoose.connect(CONNECTION_STRING);

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  redirectUrl: process.env.REDIRECT_URL,
  clientUrl: process.env.CLIENT_URL,
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
  postUrl: "https://jsonplaceholder.typicode.com/posts",
};

const authParams = queryString.stringify({
  client_id: config.clientId,
  redirect_uri: config.redirectUrl,
  response_type: "code",
  scope: "openid profile email https://www.googleapis.com/auth/drive.readonly",
  access_type: "offline",
  state: "standard_oauth",
  prompt: "consent",
});

const getTokenParams = (code) =>
  queryString.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUrl,
  });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve CORS
app.use(
  cors({
    origin: [config.clientUrl],
    credentials: true,
  })
);

// Parse Cookie


app.get("/auth/url", (_, res) => {
  res.json({
    url: `${config.authUrl}?${authParams}`,
  });
});

app.get("/auth/token", async (req, res) => {
  const { code } = req.query;
  if (!code)
    return res
      .status(400)
      .json({ message: "Authorization code must be provided" });
  try {
    // Get all parameters needed to hit authorization server
    const tokenParam = getTokenParams(code);
    // Exchange authorization code for access token (id token is returned here too)
    const {
      data: { id_token, access_token },
    } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
    if (!id_token || !access_token) return res.status(400).json({ message: "Auth error" });
    // Get user info from id token
    const { email, name, picture, sub } = jwt.decode(id_token);
    // THIS SUB IS THE UNIQUE USER ID TO STORE THE USER DATA
    let user = { name, email, picture, sub };
    // You can choose to store user in a DB instead
    const updatedUser = { ...user, loginMethod: 'google' };
    console.log("sub is: ", sub);
    const userFound = await dao.findUserBySub(updatedUser.sub)
    if(userFound === null) {
      console.log("Creating a new user in the database")

      user = await dao.createUser(updatedUser);
      const newSchedule = {user_id: user._id, portion: 0, schedule: {}};
      const scheduleResponse = await createSchedule(newSchedule);
      console.log("Creating new schedule: ", scheduleResponse)
    }
    else {
      console.log("Found a user: ", userFound)
      user = userFound
    }
    console.log("Sending this user back after logging in: ", user)
    // Sign a new token
    const token = jwt.sign({ user }, config.tokenSecret, {
      expiresIn: config.tokenExpiration,
    });
    // Set cookies for user
    res.json({
      user,
      sessionToken: token,
      accessToken: access_token
    });
  } catch (err) {
    console.error("Error: ", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

app.get("/auth/logged_in", (req, res) => {
  try {
    console.log("Made it in the loggind in")

    // Get token from cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log("Token is: ", token)
    if (!token) return res.json({ loggedIn: false });
    console.log(token)
    const { user } = jwt.verify(token, config.tokenSecret);
    console.log(user)
    const newToken = jwt.sign({ user }, config.tokenSecret, {
      expiresIn: config.tokenExpiration,
    });

    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

app.post("/auth/logout", (_, res) => {
  // clear cookie
  res.json({ message: "Logged out" });});

app.get("/user/posts", async (_, res) => {
  try {
    const { data } = await axios.get(config.postUrl);
    res.json({ posts: data?.slice(0, 5) });
  } catch (err) {
    console.error("Error: ", err);
  }
});

app.post("/api/getFolderID", async(req, res) => {
  const {folderName, accessToken} = req.body
  try {
    console.log("folder name is ", folderName)
    console.log("Token is: ", accessToken)
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const folders = response.data.files;

    if (folders.length === 0) {
      return res.status(404).json({ message: `Folder with name ${folderName} not found` });
    }

    // Return the folder ID
    res.json({ folderId: folders[0].id });
  } catch (error) {
    console.error("Error fetching folder ID:", error);
    res.status(500).json({ message: "Error fetching folder ID" });
  }
})

app.get("/api/video/:id", async (req, res) => {
  const { id } = req.params;
  const accessToken = req.query.accessToken;

  if (!accessToken) {
    return res.status(400).send("Missing access token");
  }

  try {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "stream", // Stream the video to the client
      }
    );

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res); // Pipe the video stream to the client
  } catch (error) {
    console.error("Error fetching video:", error.response?.data || error);
    res.status(500).send("Error fetching video");
  }
});

const PORT = process.env.PORT || 4000;


app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

UserRoutes(app);
ScheduleRoutes(app);