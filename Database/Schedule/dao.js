import model from "./model.js";
export const findPreferencesByUser = (userId) => model.findOne({user_id: userId});
export const setScheduleById = (userId, schedule) => model.updateOne({user_id: userId}, { $set: {schedule: schedule}})
export const setPortionById = (userId, portion) => model.updateOne({user_id: userId}, { $set: {portion: portion}})
export const setScheduleAndPortion = (userId, schedule, portion) => model.updateOne({user_id: userId}, { $set: {portion: portion, schedule: schedule}})
export const createSchedule = (schedule) => {
    return model.create(schedule);
}