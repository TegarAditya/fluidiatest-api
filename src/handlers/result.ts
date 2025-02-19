import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { countPoints } from "../utils/result"
import { parseMarkdown } from "../utils/string"

const factory = createFactory()

interface Response {
  questionCode: string
  question: string | Promise<string> | null
  optionLabel: string | Promise<string> | null
  optionText: string | Promise<string> | null
  optionCorrect: boolean
  reasonLabel: string | Promise<string> | null
  reasonText: string | Promise<string> | null
  reasonCorrect: boolean
  points: number
  feedback: string | Promise<string> | null
}

//GET /api/results
export const getResults = factory.createHandlers(async (c) => {
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

//GET /api/result
export const getResult = factory.createHandlers(
  zValidator(
    "query",
    z
      .object({
        user_id: z.string().optional(),
        exam_id: z.string().optional(),
        attempt_id: z.string().optional(),
      })
      .refine(
        (data) => {
          if (data.attempt_id) {
            return true
          } else {
            return data.user_id !== undefined && data.exam_id !== undefined
          }
        },
        {
          message: "If attempt_id is not provided, both user_id and exam_id must be provided.",
        }
      )
  ),
  async (c) => {
    const userId = c.req.query("user_id")
    const examId = c.req.query("exam_id")
    const attemptId = c.req.query("attempt_id")

    try {
      const attempt = await prisma.exam_attempts.findFirst({
        where: {
          attempt_id: attemptId,
        },
        select: {
          users: {
            select: {
              public_id: true,
            },
          },
          question_packs: {
            select: {
              public_id: true,
            },
          },
        },
      })

      const userPublicId = userId ? userId : attempt?.users.public_id
      const examPublicId = examId ? examId : attempt?.question_packs.public_id

      const user = await prisma.users.findFirst({
        where: {
          public_id: userPublicId,
        },
      })

      if (!user) {
        return c.json({ message: "User not found" }, 404)
      }

      const exam = await prisma.question_packs.findFirst({
        where: {
          public_id: examPublicId,
        },
        select: {
          question_pack_question_banks: {
            select: {
              question_banks: {
                select: {
                  id: true,
                  code: true,
                  question: true,
                  question_feedback: {
                    select: {
                      score: true,
                      feedback: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!exam) {
        return c.json({ message: "Exam not found" }, 404)
      }

      const questionList = exam.question_pack_question_banks.map((question, index) => {
        return {
          index: index + 1,
          id: Number(question.question_banks.id),
          code: question.question_banks.code,
          question: question.question_banks.question,
          feedback: question.question_banks.question_feedback,
        }
      })

      const result = await prisma.exam_attempts.findFirst({
        where: {
          users: {
            public_id: userPublicId,
          },
          question_packs: {
            public_id: examPublicId,
          },
        },
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
                  code: true,
                  question: true,
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
                  label: true,
                  option: true,
                  is_correct: true,
                },
              },
              reason: {
                select: {
                  label: true,
                  reason: true,
                  is_correct: true,
                },
              },
            },
          },
        },
      })

      if (!result) {
        return c.json({ message: "No result found" }, 404)
      }

      const resultData = {
        id: result.attempt_id,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        user: {
          id: result.users.public_id,
          name: result.users.name,
          schools: result.users.schools?.name,
        },
        responses: result.exam_responses.map((response): Response => {
          return {
            questionCode: response.question_bank.code ?? null,
            question: parseMarkdown(response.question_bank.question) ?? null,
            optionLabel: response.question_option?.label ?? null,
            optionText:
              parseMarkdown(response.question_option?.option || "").toString().length > 0
                ? parseMarkdown(response.question_option?.option || "")
                : null,
            optionCorrect: response.question_option?.is_correct ?? false,
            reasonLabel: response.reason?.label ?? null,
            reasonText:
              parseMarkdown(response.reason?.reason || "").toString().length > 0
                ? parseMarkdown(response.reason?.reason || "")
                : null,
            reasonCorrect: response.reason?.is_correct ?? false,
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

      // Create a mapping from questionCode to index
      const questionIndexMap = new Map(questionList.map((q) => [q.code, q.index]))

      // Create a Set of existing question codes in responses
      const existingQuestionCodes = new Set(resultData.responses.map((r) => r.questionCode))

      // Ensure all questions from questionList are included in responses
      questionList.forEach((question) => {
        if (!existingQuestionCodes.has(question.code)) {
          resultData.responses.push({
            questionCode: question.code,
            question: parseMarkdown(question.question),
            optionLabel: null,
            optionText: null,
            optionCorrect: false,
            reasonLabel: null,
            reasonText: null,
            reasonCorrect: false,
            points: 0,
            feedback:
              question.feedback.filter((feedback) => {
                return feedback.score === 1
              })[0]?.feedback || "",
          })
        }
      })

      // Sort the responses based on the index from questionList
      resultData.responses.sort((a, b) => {
        return (
          (questionIndexMap.get(a.questionCode) ?? 0) - (questionIndexMap.get(b.questionCode) ?? 0)
        )
      })

      // Filter out the questionCode from the responses based on the questionList
      resultData.responses = resultData.responses.filter((response) => {
        return questionIndexMap.has(response.questionCode)
      })

      return c.json(resultData, 200)
    } catch (error: any) {
      return c.json({ message: error.message }, 500)
    }
  }
)
