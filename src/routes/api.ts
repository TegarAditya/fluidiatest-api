import { Hono } from "hono"
import { getTest, getTests } from "../handlers/test"
import { getUser, getUsers } from "../handlers/user"

const api = new Hono()

api.get("/users", ...getUsers)
api.get("/user/:id", ...getUser)

api.get("/tests", ...getTests)
api.get("/test/:id", ...getTest)

export default api
