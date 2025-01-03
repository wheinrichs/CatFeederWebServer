import model from "./model.js";

// Find a user by the userID
export const findUserById = (userId) => model.findById(userId);

// Find a user by the username - returns the first user
export const findUserByUsername = (username) => model.findOne({username: username});

// Find a user by the sub ID which is assigned from the google login 
export const findUserBySub = (sub) => model.findOne({sub: sub});

// Find all the users and return them
export const findAllUsers = () => model.find();

// Find a user by the associated email
export const findUserByEmail = (email) => model.findOne({email: email});

// Create a new user and then return the created user
export const createUser = (user) => {
    return model.create(user);
}

// Find all the users with a unqiue username
export const findAllUsernames = () => model.distinct("username")