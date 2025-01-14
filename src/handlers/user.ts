import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"

const factory = createFactory()

// GET /api/users
export const getUsers = factory.createHandlers(async (c) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        public_id: true,
        name: true,
        email: true,
        schools: {
          select: {
            name: true,
          },
        },
      },
    })

    const result = users.map((user) => {
      return {
        public_id: user.public_id,
        name: user.name,
        email: user.email,
        school: user.schools?.name ?? "",
      }
    })

    return c.json(result, 200)
  } catch (error) {
    console.error(error)
    return c.json({ message: error }, 500)
  }
})

// GET /api/user/:id
export const getUser = factory.createHandlers(
  zValidator(
    "param",
    z.object({
      id: z.string(),
    })
  ),
  async (c) => {
    try {
      const user = await prisma.users.findFirst({
        where: {
          public_id: c.req.param("id"),
        },
        select: {
          public_id: true,
          name: true,
          email: true,
          schools: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!user) return c.json({ message: "User not found" }, 404)

      const result = {
        public_id: user.public_id,
        name: user.name,
        email: user.email,
        school: user.schools?.name ?? "",
      }

      return c.json(result, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: error }, 500)
    }
  }
)
