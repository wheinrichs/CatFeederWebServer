import * as dao from "./dao.js";
import { createSchedule } from "../Schedule/dao.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const config = {
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000,
};

export default function UserRoutes(app) {
  const findUserById = async (req, res) => {
    const user = await dao.findUserById(req.params.userId);
    res.json(user);
  };
  app.get("/api/users/:userId", findUserById);

  const findUsers = async (req, res) => {
    const users = await dao.findAllUsers();
    console.log(users);
    res.json(users);
  };
  app.get("/api/users", findUsers);

  const createUser = async (req, res) => {
    const user = await dao.createUser(req.body);
    res.json(user);
  };
  app.post("/api/users", createUser);

  const createCustomUser = async (req, res) => {
    const user = req.body;
    const existingUser = await dao.findUserByUsername(user.username);

    if (existingUser == null) {
      const hash = await bcrypt.hash(user.password, 12);
      const updatedUser = { ...user, password: hash, loginMethod: "website" };
      console.log("user sent to DB is: ", updatedUser);

      const createdUser = await dao.createUser(updatedUser);
      const newSchedule = {user_id: createdUser._id, portion: 0, schedule: {}};
      const scheduleResponse = await createSchedule(newSchedule);
      console.log("created user is: ", createdUser);
      console.log("Created schedule is: ", scheduleResponse)
      res.json(createdUser);
    } else {
      res.status(400).send("Unable to create user")
    }
  };
  app.post("/api/customUsers", createCustomUser);

  const findUsernames = async (req, res) => {
    const users = await dao.findAllUsernames();
    console.log(users);
    res.json(users);
  };
  app.get("/api/getAllUsernames", findUsernames);

  const attemptLogin = async (req, res) => {
    const userParam = req.body;
    const passedUsername = userParam.username;
    const passedPassword = userParam.password;

    const existingUser = await dao.findUserByUsername(passedUsername);

    if (existingUser == null) {
      return res.status(400).send("User Doesn't Exist");
    } else {
      const { password, ...userNoPassword } = existingUser._doc;
      const isValid = await bcrypt.compare(
        passedPassword,
        existingUser.password
      );
      if (!isValid) {
        return res.status(401).send("Invalid password");
      } else {
        const user = {...userNoPassword}
        const token = jwt.sign({ user }, config.tokenSecret, {
          expiresIn: config.tokenExpiration,
        });
        console.log("Token created in routes is: ", token)
        // Set cookies for user
        res.cookie("token", token, {
            maxAge: config.tokenExpiration,
            httpOnly: true,
            });
        
        res.json({
          user,
          accessToken: token,
        });
      }
    }
  };
  app.post("/api/login", attemptLogin);
}
