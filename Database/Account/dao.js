import model from "./model.js";
export const findUserById = (userId) => model.findById(userId);
export const findUserByUsername = (username) => model.findOne({username: username});
export const findUserBySub = (sub) => model.findOne({sub: sub});
export const findAllUsers = () => model.find();
export const findUserByEmail = (email) => model.findOne({email: email});
export const createUser = (user) => {
    return model.create(user);
}
export const findAllUsernames = () => model.distinct("username")