import * as dao from "./dao.js";
export default function ScheduleRoutes(app) {
    /*
    Function: findPreferencesByUser
        Find the preferences (schedule and portion) for the userID passed in the request parameters.
    Output:
        Returns the preferences for the userID
    */
    const findPreferencesByUser = async (req, res) => {
        const preferences = await dao.findPreferencesByUser(req.params.userId)
        res.json(preferences)
    }
    app.get("/api/schedule/:userId", findPreferencesByUser)

    /*
    Function: updateScheduleByUser
        Update the schedule for the userID
    Output:
        Returns the status for schedule being set
    */
    const updateScheduleByUser = async (req, res) => {
        const status = await dao.setScheduleById(req.params.userId, req.body)
        res.json(status)
    }
    app.put("/api/schedule/:userId", updateScheduleByUser)

    /*
    Function: updatePortionByUser
        Update the portion for the userID
    Output:
        Returns the status for portion being set
    */
    const updatePortionByUser = async (req, res) => {
        const status = await dao.setPortionById(req.params.userId, req.body)
        res.json(status)
    }
    app.put("/api/portion/:userId", updatePortionByUser)

    /*
    Function: updatePortionScheduleByUser
        Update the portion and schedule for the userID
    Output:
        Returns the status for preferences being set
    */
    const updatePortionScheduleByUser = async (req, res) => {
        const {schedule, portion} = req.body
        const status = await dao.setScheduleAndPortion(req.params.userId, schedule, portion)
        res.json(status)
    }
    app.put("/api/PortionSchedule/:userId", updatePortionScheduleByUser)
}