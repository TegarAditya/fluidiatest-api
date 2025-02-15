import { Hono } from "hono"
import { createAttempt, getTestQuestionList, getTest, getTests } from "../handlers/test"
import { getUser, getUsers } from "../handlers/user"
import { getBanks } from "../handlers/bank"
import { getResult, getResults } from "../handlers/result"

const api = new Hono()

api.get("/users", ...getUsers)
api.get("/user/:id", ...getUser)

api.get("/bank", ...getBanks)

api.get("/tests", ...getTests)
api.get("/test/:id", ...getTest)
api.get("/test/:id/questions", ...getTestQuestionList)
api.post("/test/attempt", ...createAttempt)

api.get("/result", ...getResult)
api.get("/results", ...getResults)

export default api
