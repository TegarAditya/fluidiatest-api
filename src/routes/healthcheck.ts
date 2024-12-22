import { Hono } from "hono"
import prisma from "../libs/prisma"

const healthcheck = new Hono()

healthcheck.get("/", async (c) => {
  try {
    const dbStatus = await prisma.$queryRaw`SELECT 1`
    if (!dbStatus) {
      return c.json({ message: "Database is not connected" }, 500)
    } else {
      return c.json({ message: "OK" })
    }
  } catch (error) {
    console.error(error)
    return c.json({ message: error }, 500)
  }
})

export default healthcheck