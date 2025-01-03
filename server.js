/*
This file defines the functions for running the Node.js server. 
*/

import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import UserRoutes from "./Database/Account/routes.js";
import ScheduleRoutes from "./Database/Schedule/routes.js";
import GoogleOAuthRoutes from "./GoogleServices/GoogleOAuthLoginRoutes.js";
import GoogleDriveRoutes from "./GoogleServices/GoogleDriveAccessRoutes.js";

// Use the mongo connection string from the environment file - if it isn't available use the local implementation for development
const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/petfeeder"
mongoose.connect(CONNECTION_STRING);

// Setup the configuration for the server 
const config = {
  // Set the clientURL for use with CORS
  clientUrl: process.env.CLIENT_URL,

  // Set the token secret and the token expiration
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
};

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

// Set the port using the environment file or port 4000 for development environments
const PORT = process.env.PORT || 4000;

// Print that the server is running
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

// Include routes for the user and schedule in the database, the google login, and the google drive access
UserRoutes(app);
ScheduleRoutes(app);
GoogleOAuthRoutes(app);
GoogleDriveRoutes(app);