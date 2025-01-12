import mdParser from "../plugins/marked"

/**
 * Parses a given markdown string and converts it to HTML using the marked and markedKatex libraries.
 *
 * @param markdown - The markdown string to be parsed.
 * @returns The parsed HTML string.
 */
export const parseMarkdown = (markdown: string) => {
  return mdParser(markdown)
}
