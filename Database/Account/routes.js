import * as dao from "./dao.js";
import { createSchedule } from "../Schedule/dao.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Set the token expiration and the token secret parameters
const config = {
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
};

export default function UserRoutes(app) {

  /*
  Function: findUserByID
    This function finds a user the user id passed in through the request parameter
  Output:
    Reutrns the user found as a JSON object
  */
  const findUserById = async (req, res) => {
    const user = await dao.findUserById(req.params.userId);
    res.json(user);
  };
  app.get("/api/users/:userId", findUserById);

  /*
  Function: findUsers
    This function finds all users
  Output:
    Reutrns the users as a JSON object
  */
  const findUsers = async (req, res) => {
    const users = await dao.findAllUsers();
    res.json(users);
  };
  app.get("/api/users", findUsers);

  /*
  Function: createUser
    This function creates a new user from the passed in object. This is primarily used to create
    users int he database from a google login. 
  Output:
    Reutrns the user that was created as a JSON object
  */
  const createUser = async (req, res) => {
    const user = await dao.createUser(req.body);
    res.json(user);
  };
  app.post("/api/users", createUser);

  /*
  Function: createCustomUser
    This function creates a unique user when a user is registered using the website registration flow
    (not using google sign in). It creates an empty schdule, hashes the password, and saves the user.
    If a user is already registered using this username, then it returns an error. 
  Output:
    Reutrns the user created as a JSON object
  */
  const createCustomUser = async (req, res) => {
    // Retrieve the user from the request and then see if the user already exists in the database
    const user = req.body;
    const existingUser = await dao.findUserByUsername(user.username);

    // If the user is null (i.e. the username does not exist already)
    if (existingUser == null) {
      // Encrypt the password using bcrypt
      const hash = await bcrypt.hash(user.password, 12);
      // Create a new user with the password replaced with the hashed password and the loginMethod as website
      const updatedUser = { ...user, password: hash, loginMethod: "website" };
      // Create the user using the updatedUser
      const createdUser = await dao.createUser(updatedUser);
      // Create a schedule with the user id that is created
      const newSchedule = {user_id: createdUser._id, portion: 0, schedule: {}};
      const scheduleResponse = await createSchedule(newSchedule);

      // Return the created user as a JSON
      res.json(createdUser);
    } else {
      // Send an error status 400 if the user couldn't be created
      res.status(400).send("Unable to create user")
    }
  };
  app.post("/api/customUsers", createCustomUser);

  /*
  Function: findUsernames
    This function find all the usernames in the database
  Output:
    Reutrns the all the usernames as a JSON object
  */
  const findUsernames = async (req, res) => {
    const users = await dao.findAllUsernames();
    res.json(users);
  };
  app.get("/api/getAllUsernames", findUsernames);

  /*
  Function: attemptLogin
    This function attempts to log in a user from the website login screen. It uses bcrypt
    to compare the passed in password to the hashed password. If the user is logged in 
    successfully, then the user is passed back as a JSON object
  Output:
    Reutrns the user as a JSON object
  */
  const attemptLogin = async (req, res) => {
    // Get the username and password passed in from the parameters
    const userParam = req.body;
    const passedUsername = userParam.username;
    const passedPassword = userParam.password;

    // See if there is a user with the username that is passed in
    const existingUser = await dao.findUserByUsername(passedUsername);

    // If the user is not found, then the username used to log in is incorrect
    if (existingUser == null) {
      return res.status(400).send("User Doesn't Exist");
    } 
    // If the user is found, then compare the password
    else {
      // Retrieve the password for the user and the other user information from the database
      const { password, ...userNoPassword } = existingUser._doc;
      // Compare the password passed in to the correct password from the user using bcrypt
      const isValid = await bcrypt.compare(
        passedPassword,
        existingUser.password
      );
      // If the login is invlaid (i.e. the passwords do not match)
      if (!isValid) {
        // send invalid password if the password is right
        return res.status(401).send("Invalid password");
      } 
      // If the user was able to successfully login
      else {
        // Write the user without the password information to a new object
        const user = {...userNoPassword}
        // create a new token with the user information
        const token = jwt.sign({ user }, config.tokenSecret, {
          expiresIn: config.tokenExpiration,
        });
        // Return the user and the accessToken
        res.json({
          user,
          sessionToken: token,
        });
      }
    }
  };
  app.post("/api/login", attemptLogin);
}
