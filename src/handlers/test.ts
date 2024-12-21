import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { createFactory } from "hono/factory"
import prisma from "../libs/prisma"

const factory = createFactory()

export const getTests = factory.createHandlers(async (c) => {
  const tests = await prisma.question_packs.findMany({
    select: {
      id: true,
      code: true,
      description: true,
      is_active: true,
      type: true,
      duration: true,
    },
  })

  if (!tests) {
    return c.json({ message: "No tests found" }, 404)
  }

  const result = tests.map((test) => {
    return {
      id: Number(test.id),
      code: test.code,
      description: test.description,
      isActive: test.is_active,
      type: test.type,
      duration: test.duration,
    }
  })

  return c.json(result, 200)
})

export const getTest = factory.createHandlers(async (c) => {
  const id = c.req.param("id")
  const test = await prisma.question_packs.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      code: true,
      description: true,
      is_active: true,
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
    id: Number(test.id),
    code: test.code,
    description: test.description,
    isActive: test.is_active,
    type: test.type,
    duration: test.duration,
    questions: test.question_pack_question_banks.map((question) => {
      return {
        id: Number(question.question_banks.id),
        question: question.question_banks.question,
        options: question.question_banks.question_options.map((option) => {
          return {
            id: Number(option.id),
            label: option.label,
            option: option.option,
          }
        }),
        reasons: question.question_banks.reasons.map((reason) => {
          return {
            id: Number(reason.id),
            label: reason.label,
            reason: reason.reason,
          }
        }),
      }
    }),
  }

  return c.json(result, 200)
})
