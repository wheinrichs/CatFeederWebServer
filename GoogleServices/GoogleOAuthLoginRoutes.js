import queryString from "query-string";
import "dotenv/config";
import axios from "axios";
import jwt from "jsonwebtoken";
import * as dao from "../Database/Account/dao.js";
import { createSchedule } from "../Database/Schedule/dao.js";

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

export default function GoogleOAuthRoutes(app) {
  // Set the auth parameters for the google access
  const authParams = queryString.stringify({
    // Set the client ID and redirect URI for the google login
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    response_type: "code",
    // Define what the app should have access to from the google services
    scope:
      "openid profile email https://www.googleapis.com/auth/drive.readonly",
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
      if (!id_token || !access_token)
        return res.status(400).json({ message: "Auth error" });
      // Get user info from id token
      const { email, name, picture, sub } = jwt.decode(id_token);
      // Sub is the user ID stored in google
      let user = { name, email, picture, sub };
      // Write the user information and the login method (google in this case) to the database
      const updatedUser = { ...user, loginMethod: "google" };
      // Look for a user with this unique google ID to see if the user has logged in on this site before
      const userFound = await dao.findUserBySub(updatedUser.sub);
      // If the user is not found then this google account has not accesses this site before
      if (userFound === null) {
        console.log("Creating a new user in the database");
        // Create a new user in the database with the user information
        user = await dao.createUser(updatedUser);
        // Create a new schedule that is blank for the new user and store it in the database
        const newSchedule = { user_id: user._id, portion: 0, schedule: {} };
        const scheduleResponse = await createSchedule(newSchedule);
      }
      // If the user is already in the database (this google account has accessed this site before)
      else {
        console.log("Found a user: ", userFound);
        user = userFound;
      }
      // Create a new token and send the user back to the front end, whether it is a new user or a found user
      console.log("Sending this user back after logging in: ", user);
      // Sign a new token
      const token = jwt.sign({ user }, config.tokenSecret, {
        expiresIn: config.tokenExpiration,
      });
      // Set cookies for user and send the user back to the front end
      res.json({
        user,
        sessionToken: token,
        accessToken: access_token,
      });
    } catch (err) {
      console.error("Error: ", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  });
}
