import { Hono } from "hono"
import { apiReference } from "@scalar/hono-api-reference"

const docs = new Hono()

docs.get(
  "/",
  apiReference({
    theme: "kepler",
    spec: {
      url: "/openapi.json",
    },
  })
)

export default docs
