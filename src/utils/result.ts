/**
 * Calculates the points based on the provided option and reason values.
 *
 * @param optionValue - A boolean or undefined value representing the option.
 * @param reasonValue - A boolean or undefined value representing the reason.
 * @returns The calculated points as a number:
 * - 4 if both optionValue and reasonValue are true.
 * - 3 if optionValue is true and reasonValue is false or undefined.
 * - 2 if optionValue is false or undefined and reasonValue is true.
 * - 1 if both optionValue and reasonValue are false or undefined.
 */
export const countPoints = (optionValue: boolean | undefined, reasonValue: boolean | undefined) => {
  const resultCode = String(Number(optionValue || false)) + String(Number(reasonValue || false))

  switch (resultCode) {
    case "11":
      return 4
    case "10":
      return 3
    case "01":
      return 2
    default:
      return 1
  }

  return 0
}
