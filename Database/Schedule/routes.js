import * as dao from "./dao.js";
export default function ScheduleRoutes(app) {
    const findPreferencesByUser = async (req, res) => {
        console.log("The user id searched for is: ", req.params.userId)
        const preferences = await dao.findPreferencesByUser(req.params.userId)
        console.log("The fetched schedule in the routes is: ", preferences)
        res.json(preferences)
    }
    app.get("/api/schedule/:userId", findPreferencesByUser)

    const updateScheduleByUser = async (req, res) => {
        console.log(req.body)
        const status = await dao.setScheduleById(req.params.userId, req.body)
        console.log(status)
        res.json(status)
    }
    app.put("/api/schedule/:userId", updateScheduleByUser)

    const updatePortionByUser = async (req, res) => {
        console.log(req.body)
        const status = await dao.setPortionById(req.params.userId, req.body)
        console.log(status)
        res.json(status)
    }
    app.put("/api/portion/:userId", updatePortionByUser)

    const updatePortionScheduleByUser = async (req, res) => {
        console.log(req.body)
        const {schedule, portion} = req.body
        const status = await dao.setScheduleAndPortion(req.params.userId, schedule, portion)
        console.log(status)
        res.json(status)
    }
    app.put("/api/PortionSchedule/:userId", updatePortionScheduleByUser)
}