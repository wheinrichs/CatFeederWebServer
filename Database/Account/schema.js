import mongoose from "mongoose"
const usersSchema = new mongoose.Schema({
    name: {type: String},
    email: String,
    picture: String,
    loginMethod: String,
    password: String,
    username: String,
    sub: String,
    liveFeedAccess: Boolean,
},
{collection: "users"});
export default usersSchema;