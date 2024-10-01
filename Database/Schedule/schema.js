import mongoose from "mongoose"
const scheduleSchema = new mongoose.Schema({
    user_id: String,
    portion: Number, 
    schedule: {} ,
    unqiueDateTimes: [String]
},
{collection: "schedule"});
export default scheduleSchema;