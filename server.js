/*
This file defines the functions for running the Node.js server. 
*/

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
import { createSchedule } from "./Database/Schedule/dao.js";

// Use the mongo connection string from the environment file - if it isn't available use the local implementation for development
const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/petfeeder"
mongoose.connect(CONNECTION_STRING);

// Setup the configuration for the server 
const config = {
  // Set the clientID and secret key for the google login
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,

  // Set the authURL and the token URL for the google login
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",

  // Set the redirect URL and client URL for use with the google login
  redirectUrl: process.env.REDIRECT_URL,
  clientUrl: process.env.CLIENT_URL,

  // Set the token secret and the token expiration
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
};

// Set the auth parameters for the google access
const authParams = queryString.stringify({
  // Set the client ID and redirect URI for the google login
  client_id: config.clientId,
  redirect_uri: config.redirectUrl,
  response_type: "code",
  // Define what the app should have access to from the google services
  scope: "openid profile email https://www.googleapis.com/auth/drive.readonly",
  access_type: "offline",
  state: "standard_oauth",
  prompt: "consent",
});

// Set the token parameters after google login
const getTokenParams = (code) =>
  queryString.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUrl,
  });

// Setup express for the server app
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

// Set the auth url endpoint for use with the google login
app.get("/auth/url", (_, res) => {
  res.json({
    url: `${config.authUrl}?${authParams}`,
  });
});

/*
Endpoint: /auth/token
  This enpoint implements a function that handles the google oauth 2.0 login. It extracts the token
  parameters from the request query, finds the user in googles database, and then returns that user 
  to the server. The server then checks the database for the web application to see if the user has
  logged in before. If the user has, then that user is pulled up and returned to the front end. 
Output: 
  A JSON with the access token, session token, and user from the database. 
*/
app.get("/auth/token", async (req, res) => {
  // Retrieve the code parameter from the request
  const { code } = req.query;
  // If the code is missing, return an error status with a code
  if (!code)
    return res
      .status(400)
      .json({ message: "Authorization code must be provided" });
  try {
    // Get all parameters from the code that are necessary for authorization
    const tokenParam = getTokenParams(code);
    // Exchange authorization code for access token (id token is returned here too)
    const {
      data: { id_token, access_token },
    } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
    // If the id token or access token are not returned then there was an authorization error
    if (!id_token || !access_token) return res.status(400).json({ message: "Auth error" });
    // Get user info from id token
    const { email, name, picture, sub } = jwt.decode(id_token);
    // Sub is the user ID stored in google 
    let user = { name, email, picture, sub };
    // Write the user information and the login method (google in this case) to the database
    const updatedUser = { ...user, loginMethod: 'google' };
    // Look for a user with this unique google ID to see if the user has logged in on this site before
    const userFound = await dao.findUserBySub(updatedUser.sub)
    // If the user is not found then this google account has not accesses this site before
    if(userFound === null) {
      console.log("Creating a new user in the database")
      // Create a new user in the database with the user information
      user = await dao.createUser(updatedUser);
      // Create a new schedule that is blank for the new user and store it in the database
      const newSchedule = {user_id: user._id, portion: 0, schedule: {}};
      const scheduleResponse = await createSchedule(newSchedule);
    }
    // If the user is already in the database (this google account has accessed this site before)
    else {
      console.log("Found a user: ", userFound)
      user = userFound
    }
    // Create a new token and send the user back to the front end, whether it is a new user or a found user
    console.log("Sending this user back after logging in: ", user)
    // Sign a new token
    const token = jwt.sign({ user }, config.tokenSecret, {
      expiresIn: config.tokenExpiration,
    });
    // Set cookies for user and send the user back to the front end
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

/*
Endpoint: /auth/logged_in
  This endpoint checks if a user is already logged in by examining the token that is passed.
  If there is no token passed or there is an error it returns false. Otherwise, true and the user
  is passed back to the front end.
Output: 
  False if there is no user logged in, true and the user object otherwise. 
*/
app.get("/auth/logged_in", (req, res) => {
  try {
    // Get token from the cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // If there is no token then return loggedIn: false
    if (!token) return res.json({ loggedIn: false });
    // Check if the token is valid and, if so, return the user
    const { user } = jwt.verify(token, config.tokenSecret);
    // Return the user and the logged in flag
    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

/*
Endpoint: /auth/logout
  This endpoint can contain any logic for the backend server to log out a user. Most of this logic
  is handled by the front end, so does not currently do anything but is here a framework if necessary.
Output: 
  None.
*/
app.post("/auth/logout", (_, res) => {
  res.json({ message: "Logged out" });});

/*
Endpoint: /api/getFolderID
  This endpoint recieves a folder name and an accessToken (assigned when the user logs in via google) and
  searches the google drive for the user to find a folder that matches in name to the one provided. It 
  returns the folder ID to assist in searching or accessing a particular folder.
Output: 
  The folder ID of the folder with the passed in name in the google drive of the user.
*/
app.post("/api/getFolderID", async(req, res) => {
  // Retrieve the folder name and the access token from the request
  const {folderName, accessToken} = req.body
  try {
    // Search specifically for a folder in the google drive with the given folder name. 
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    // Retrieve the folder name from the response
    const folders = response.data.files;
    
    // If there are no items in the response, then there isn't a folder with that folder name
    if (folders.length === 0) {
      return res.status(404).json({ message: `Folder with name ${folderName} not found` });
    }

    // Otherwise, there is a folder with that name and return the folder ID of the first folder found with that name
    res.json({ folderId: folders[0].id });
  } catch (error) {
    console.error("Error fetching folder ID:", error);
    res.status(500).json({ message: "Error fetching folder ID" });
  }
})

/*
Endpoint: /api/video/:id
  This endpoint facilitates streaming videos from the users google drive to the front end application. This is
  necessary for permissions on web browsers like safari that require a complete range header to handle video streaming.
Output: 
  The video is streamed using this endpoint. 
*/
app.get("/api/video/:id", async (req, res) => {
  // Retrieve the video ID, the access token, and the range of the video
  const { id } = req.params;
  const accessToken = req.query.accessToken;
  const range = req.headers.range;

  if (!accessToken) {
    return res.status(400).send("Missing access token");
  }

  if (!range) {
    return res.status(416).send("Requires Range header");
  }

  try {
    // Fetch video metadata
    const metadataResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=size,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Retrieve the video size of the fetches video
    const videoSize = parseInt(metadataResponse.data.size, 10);
    const mimeType = metadataResponse.data.mimeType;

    // Parse the Range header using 512kb chunks
    const CHUNK_SIZE = 512 * 1024; 
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

    // While there is content in the video stream the content 
    if (start >= videoSize) {
      res.status(416).set({
        "Content-Range": `bytes */${videoSize}`,
      });
      return;
    }

    const contentLength = end - start + 1;

    // Set headers for partial content
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": mimeType,
    };

    res.writeHead(206, headers);

    // Stream the requested chunk
    const videoStreamResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Range: `bytes=${start}-${end}`,
        },
        responseType: "stream",
      }
    );
    
    // Pipe the response from the server to the client 
    videoStreamResponse.data.pipe(res);
  } catch (error) {
    console.error("Error fetching video:", error.response?.data || error);
    res.status(500).send("Error fetching video");
  }
});

// Set the port using the environment file or port 4000 for development environments
const PORT = process.env.PORT || 4000;

// Print that the server is running
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

// Include routes for the user and schedule in the database, the google login, and the google drive access
UserRoutes(app);
ScheduleRoutes(app);