import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { secureHeaders } from "hono/secure-headers"
import { trimTrailingSlash } from "hono/trailing-slash"
import { serveStatic } from "hono/bun"
import api from "./routes/api"

const app = new Hono()

app.use(logger()).use(cors()).use(secureHeaders()).use(trimTrailingSlash())

app.use("/*", serveStatic({ root: "./static/" }))

app.route("/api", api)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}