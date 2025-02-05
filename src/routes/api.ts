import { Hono } from "hono"
import { createAttempt, getTest, getTestResults, getTests } from "../handlers/test"
import { getUser, getUsers } from "../handlers/user"

const api = new Hono()

api.get("/users", ...getUsers)
api.get("/user/:id", ...getUser)

api.get("/tests", ...getTests)
api.get("/test/:id", ...getTest)
api.get("/tests/results", ...getTestResults)

api.post("/test/attempt", ...createAttempt)

export default api
