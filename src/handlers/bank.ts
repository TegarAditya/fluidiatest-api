import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"

const factory = createFactory()

//GET /api/bank
export const getBanks = factory.createHandlers(async (c) => {
  try {
    const bank = await prisma.question_banks.findMany({
      select: {
        id: true,
        code: true,
      },
    })

    if (bank.length <= 0) {
      return c.json({ message: "No bank found" }, 404)
    }

    const result = bank.map((b) => {
      return {
        id: Number(b.id),
        code: b.code,
      }
    })

    return c.json(result)
  } catch (error: any) {
    return c.json({ message: error.message }, 500)
  }
})
