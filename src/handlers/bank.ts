import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const factory = createFactory()

//GET /api/bank
export const getBanks = factory.createHandlers(
  zValidator(
    "query",
    z.object({
      exam_id: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const examId = c.req.query("exam_id")

      const whereClause: Prisma.question_pack_question_banksWhereInput = {}

      const exam = await prisma.question_packs.findFirst({
        where: {
          public_id: examId,
        },
        select: {
          id: true,
        },
      })

      if (!exam) {
        return c.json({ message: "Exam not found" }, 404)
      }

      if (examId) {
        whereClause.question_pack_id = exam.id
      }

      const bank = await prisma.question_pack_question_banks.findMany({
        where: {
          ...whereClause,
        },
        select: {
          question_banks: {
            select: {
              id: true,
              code: true,
            },
          },
        },
        distinct: "question_bank_id",
      })

      if (bank.length <= 0) {
        return c.json({ message: "No bank found" }, 404)
      }

      const result = bank.map((b) => {
        return {
          id: Number(b.question_banks.id),
          code: b.question_banks.code,
        }
      })

      return c.json(result)
    } catch (error: any) {
      return c.json({ message: error.message }, 500)
    }
  }
)
