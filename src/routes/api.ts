import { Hono } from "hono"
import { getTest, getTests } from "../handlers/test"

const api = new Hono()

api.get("/tests", ...getTests)
api.get("/test/:id", ...getTest)

export default api