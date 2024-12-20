import { Hono } from "hono"
import { getTests } from "../handlers/test"

const api = new Hono()

api.get("/tests", ...getTests)

export default api