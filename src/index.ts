import { Hono } from "hono"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { secureHeaders } from "hono/secure-headers"
import { trimTrailingSlash } from "hono/trailing-slash"
import { serveStatic } from "hono/bun"
import api from "./routes/api"
import healthcheck from "./routes/healthcheck"
import docs from "./routes/docs"

const port = process.env.PORT || 3000

const app = new Hono()

app.use(logger()).use(cors()).use(secureHeaders()).use(trimTrailingSlash())

app.use("/*", serveStatic({ root: "./static/" }))

app.route("/api", api)
app.route("/docs", docs)
app.route("/healthcheck", healthcheck)

console.log(`Server running on port ${port}`)

export default {
  port: port,
  fetch: app.fetch,
}
