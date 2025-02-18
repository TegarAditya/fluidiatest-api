import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"
import { parseMarkdown } from "../utils/string"
import cuid2 = require("@paralleldrive/cuid2")
import { Prisma } from "@prisma/client"
import { countPoints } from "../utils/result"

interface Answer {
  questionId: number
  optionId: number
  reasonId: number
}

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

//GET /api/test/:id/questions
export const getTestQuestionList = factory.createHandlers(
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
          question_pack_question_banks: {
            select: {
              question_banks: {
                select: {
                  id: true,
                  code: true,
                },
              },
            },
          },
        },
      })

      if (!test) {
        return c.json({ message: "Test not found" }, 404)
      }

      const result = test.question_pack_question_banks.map((question, index) => {
        return {
          id: Number(question.question_banks.id),
          code: question.question_banks.code,
          index: index + 1,
        }
      })

      return c.json(result, 200)
    } catch (error) {
      console.error(error)
      return c.json({ message: "Something went wrong" }, 500)
    }
  }
)

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

      if (!test.is_active) {
        return c.json({ message: "Test is not active" }, 403)
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
            code: question.question_banks.code,
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

//GET /api/test/results
export const getTestResults = factory.createHandlers(async (c) => {
  try {
    const results = await prisma.exam_attempts.findMany({
      select: {
        attempt_id: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            public_id: true,
            name: true,
            schools: {
              select: {
                name: true,
              },
            },
          },
        },
        exam_responses: {
          select: {
            question_bank: {
              select: {
                id: true,
                code: true,
                question_feedback: {
                  select: {
                    score: true,
                    feedback: true,
                  },
                },
              },
            },
            question_option: {
              select: {
                id: true,
                label: true,
                is_correct: true,
              },
            },
            reason: {
              select: {
                id: true,
                label: true,
                is_correct: true,
              },
            },
          },
        },
      },
    })

    if (results.length <= 0) {
      return c.json({ message: "No results found" }, 404)
    }

    const data = results.map((result) => {
      return {
        id: Number(result.attempt_id),
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        user: {
          id: Number(result.users.public_id),
          name: result.users.name,
          schools: result.users.schools?.name,
        },
        responses: result.exam_responses.map((response) => {
          return {
            questionId: Number(response.question_bank.id),
            questionCode: response.question_bank.code,
            optionId: Number(response.question_option?.id),
            optionLabel: response.question_option?.label,
            optionCorrect: response.question_option?.is_correct,
            reasonId: Number(response.reason?.id),
            reasonLabel: response.reason?.label,
            reasonCorrect: response.reason?.is_correct,
            points: countPoints(response.question_option?.is_correct, response.reason?.is_correct),
            feedback:
              response.question_bank.question_feedback.filter((feedback) => {
                return (
                  feedback.score ===
                  countPoints(response.question_option?.is_correct, response.reason?.is_correct)
                )
              })[0]?.feedback || "",
          }
        }),
      }
    })

    return c.json(data, 200)
  } catch (error) {
    console.error(error)
    return c.json({ message: "Something went wrong" }, 500)
  }
})

//POST /api/test/attempt
export const createAttempt = factory.createHandlers(
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      testId: z.string(),
      createdAt: z.coerce.date(),
      answers: z.array(
        z.object({
          questionId: z.number().nullable().optional(),
          optionId: z.number().nullable().optional(),
          reasonId: z.number().nullable().optional(),
        })
      ),
    })
  ),
  async (c) => {
    try {
      const { userId, testId, createdAt, answers } = await c.req.json()

      const user = await prisma.users.findFirst({
        where: {
          public_id: userId,
        },
        select: {
          id: true,
        },
      })

      if (!user) {
        return c.json({ message: "User not found" }, 404)
      }

      const test = await prisma.question_packs.findFirst({
        where: {
          public_id: testId,
        },
        select: {
          id: true,
        },
      })

      if (!test) {
        return c.json({ message: "Test not found" }, 404)
      }

      const existingAttempt = await prisma.exam_attempts.findFirst({
        where: {
          user_id: user.id,
          question_pack_id: test.id,
        },
      })

      if (existingAttempt) {
        return c.json({ message: "Attempt already exists" }, 409)
      }

      const attempt_id = `${userId}-${testId}-${cuid2.createId()}`

      let storeAttempt

      try {
        storeAttempt = await prisma.exam_attempts.create({
          data: {
            attempt_id,
            user_id: user.id,
            question_pack_id: test.id,
            created_at: createdAt || new Date(),
            updated_at: new Date(),
            exam_responses: {
              createMany: {
                data: answers.map((answer: Answer) => {
                  return {
                    question_bank_id: answer.questionId,
                    question_option_id: answer.optionId,
                    reason_id: answer.reasonId,
                    created_at: createdAt || new Date(),
                    updated_at: new Date(),
                  }
                }) as Prisma.exam_responsesCreateManyInput,
                skipDuplicates: true,
              },
            },
          },
        })
      } catch (error) {
        console.log(error)
        throw error
      }

      return c.json({ message: "Attempt created" }, 201)
    } catch (error) {
      console.error(error)
      return c.json({ message: "Something went wrong" }, 500)
    }
  }
)
