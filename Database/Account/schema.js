import mongoose from "mongoose"
const usersSchema = new mongoose.Schema({
    name: {type: String},
    email: String,
    picture: String,
    loginMethod: String,
    password: String,
    username: String,
    sub: String
},
{collection: "users"});
export default usersSchema;