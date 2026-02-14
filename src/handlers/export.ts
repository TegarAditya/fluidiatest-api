import { createFactory } from "hono/factory"
import { Bank, createOutputFolder, generateCSV, getBanks, getResults } from "../utils/exporter";

const factory = createFactory()

export const exportResult = factory.createHandlers(async (c) => {
  try {
    const banks: Bank[] = await getBanks()
    const results = await getResults()

    createOutputFolder()

    generateCSV(banks, results)
  } catch (error) {}
})
