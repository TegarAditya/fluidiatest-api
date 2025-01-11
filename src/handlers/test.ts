import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"
import { parseMarkdown } from "../utils/string"

const factory = createFactory()

//GET /api/tests
export const getTests = factory.createHandlers(async (c) => {
  try {
    const tests = await prisma.question_packs.findMany({
      select: {
        public_id: true,
        code: true,
        description: true,
        is_active: true,
        is_multi_tier: true,
        type: true,
        duration: true,
      },
    })

    if (!tests) {
      return c.json({ message: "No tests found" }, 404)
    }

    const result = tests.map((test) => {
      return {
        id: test.public_id,
        code: test.code,
        description: parseMarkdown(test.description),
        isActive: test.is_active,
        isMultiTier: test.is_multi_tier,
        type: test.type,
        duration: test.duration?.getTime(),
      }
    })

    return c.json(result, 200)
  } catch (error) {
    console.error(error)
    return c.json({ message: "Something went wrong" }, 500)
  }
})

//GET /api/test/:id
export const getTest = factory.createHandlers(
  zValidator(
    "param",
    z.object({
      id: z.string(),
    })
  ),
  async (c) => {
    try {
      const id = c.req.param("id")
      const test = await prisma.question_packs.findFirst({
        where: {
          OR: [
            {
              public_id: id,
            },
          ],
        },
        select: {
          public_id: true,
          code: true,
          description: true,
          is_active: true,
          is_multi_tier: true,
          type: true,
          duration: true,
          question_pack_question_banks: {
            select: {
              question_banks: {
                select: {
                  id: true,
                  code: true,
                  question: true,
                  question_options: {
                    select: {
                      id: true,
                      label: true,
                      option: true,
                    },
                  },
                  reasons: {
                    select: {
                      id: true,
                      label: true,
                      reason: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!test) {
        return c.json({ message: "Test not found" }, 404)
      }

      const result = {
        id: test.public_id,
        code: test.code,
        description: parseMarkdown(test.description),
        isActive: test.is_active,
        isMultiTier: test.is_multi_tier,
        type: test.type,
        duration: test.duration?.getTime(),
        questions: test.question_pack_question_banks.map((question) => {
          return {
            id: Number(question.question_banks.id),
            question: parseMarkdown(question.question_banks.question),
            options: question.question_banks.question_options.map((option) => {
              return {
                id: Number(option.id),
                label: option.label,
                option: parseMarkdown(option.option),
              }
            }),
            reasons: question.question_banks.reasons.map((reason) => {
              return {
                id: Number(reason.id),
                label: reason.label,
                reason: parseMarkdown(reason.reason),
              }
            }),
          }
        }),
      }

      return c.json(result, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: "Something went wrong" }, 500)
    }
  }
)
