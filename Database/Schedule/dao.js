import model from "./model.js";

// Find the schedule and portion (collectively preferences) by the userID 
export const findPreferencesByUser = (userId) => model.findOne({user_id: userId});

// Update the schedule assosciated with the passed in userID
export const setScheduleById = (userId, schedule) => model.updateOne({user_id: userId}, { $set: {schedule: schedule}})

// Update the portion assosciated with the userID
export const setPortionById = (userId, portion) => model.updateOne({user_id: userId}, { $set: {portion: portion}})

// Set the schedule and the portion (collectively preferences) for the user ID
export const setScheduleAndPortion = (userId, schedule, portion) => model.updateOne({user_id: userId}, { $set: {portion: portion, schedule: schedule}})

// Create a new schedule
export const createSchedule = (schedule) => {
    return model.create(schedule);
}