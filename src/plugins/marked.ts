import { marked } from "marked"
import markedKatex from "marked-katex-extension"

const mdParser = marked

mdParser.use(markedKatex())

export default mdParser