import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client"

type DatabaseDetails = {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function parseDatabaseUrl(connectionString: string): DatabaseDetails {
  const url = new URL(connectionString)

  return {
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  }
}

const dbDetails = parseDatabaseUrl(process.env.DATABASE_URL!)

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: dbDetails.host,
    port: dbDetails.port,
    user: dbDetails.user,
    password: dbDetails.password,
    database: dbDetails.database,
  }),
})

export default prisma
