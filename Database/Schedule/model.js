import mongoose from "mongoose";
import schema from "./schema.js";
const model = mongoose.model("scheduleModel", schema);
export default model;