import { marked } from "marked"
import markedKatex from "marked-katex-extension"

/**
 * Parses a given markdown string and converts it to HTML using the marked and markedKatex libraries.
 *
 * @param markdown - The markdown string to be parsed.
 * @returns The parsed HTML string.
 */
export const parseMarkdown = (markdown: string) => {
  const parser = marked.use(markedKatex())

  return parser.parse(markdown)
}
