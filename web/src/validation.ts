export const projectCoverageLevels = [
  "District",
  "Province",
  "National",
  "East Africa",
  "Africa",
  "International",
] as const;

export const countWords = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

export const fullNameIsValid = (value: string) =>
  /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(value.trim()) &&
  value.trim().length >= 2 &&
  value.trim().length <= 120;

export function identificationNumberError(type: string, value: string) {
  const number = value.trim();
  if (type === "NATIONAL_ID" && !/^\d{16}$/.test(number))
    return "Rwanda National ID must contain exactly 16 digits.";
  if (
    type === "PASSPORT" &&
    !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(number)
  )
    return "Passport number must contain both letters and numbers (6 to 20 characters).";
  if (
    type === "OTHER_GOVERNMENT_ID" &&
    !/^[A-Za-z\d][A-Za-z\d /-]{4,29}$/.test(number)
  )
    return "Government ID number must contain 5 to 30 letters or numbers.";
  return "";
}
