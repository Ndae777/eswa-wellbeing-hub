// Shared form rules. The browser uses these to show friendly messages next to
// each field, and the server runs the SAME rules again, because anything coming
// from a browser can be faked. The database has a third layer (migration 0002).

import { provinces } from "@/lib/workshops";

export const LIMITS = {
  name: 120,
  email: 254,
  phone: 30,
  school: 160,
  role: 120,
  needs: 500,
  feedbackText: 1000,
} as const;

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Removes invisible control characters and zero-width characters. Keeps new lines
// only when asked to (for longer text boxes).
function isHiddenCharacter(code: number, keepNewLines: boolean): boolean {
  if (code === 10 || code === 13) return !keepNewLines;
  if (code < 32 || code === 127) return true;
  if (code >= 0x200b && code <= 0x200f) return true;
  return code === 0x2028 || code === 0x2029 || code === 0xfeff;
}

export function cleanText(value: unknown, keepNewLines = false): string {
  if (typeof value !== "string") return "";
  return Array.from(value)
    .filter((character) => !isHiddenCharacter(character.charCodeAt(0), keepNewLines))
    .join("")
    .trim();
}

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL_PATTERN.test(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export type RegistrationField =
  | "full_name"
  | "email"
  | "phone"
  | "school"
  | "role_at_school"
  | "province"
  | "dietary_or_access_needs";

export type RegistrationValues = {
  full_name: string;
  email: string;
  phone: string;
  school: string;
  role_at_school: string;
  province: string;
  dietary_or_access_needs: string;
};

export type RegistrationErrors = { [K in RegistrationField]?: string };

export function validateRegistration(input: unknown): {
  values: RegistrationValues;
  errors: RegistrationErrors;
} {
  const raw = (input ?? {}) as { [key: string]: unknown };
  const values: RegistrationValues = {
    full_name: cleanText(raw["full_name"]).replace(/\s+/g, " "),
    email: cleanText(raw["email"]).toLowerCase(),
    phone: cleanText(raw["phone"]),
    school: cleanText(raw["school"]),
    role_at_school: cleanText(raw["role_at_school"]),
    province: cleanText(raw["province"]),
    dietary_or_access_needs: cleanText(raw["dietary_or_access_needs"], true),
  };
  const errors: RegistrationErrors = {};

  if (!values.full_name) {
    errors.full_name = "Please tell us your full name.";
  } else if (values.full_name.length < 2 || !/\p{L}/u.test(values.full_name)) {
    errors.full_name = "Please enter your real name (at least 2 letters).";
  } else if (values.full_name.length > LIMITS.name) {
    errors.full_name = `Please keep your name under ${LIMITS.name} characters.`;
  }

  if (!values.email) {
    errors.email = "Please enter your email address so we can send your confirmation.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "That email address doesn't look right. It should look like name@example.com.";
  }

  if (values.phone) {
    const digits = values.phone.replace(/\D/g, "");
    if (!/^[+()\d\s-]+$/.test(values.phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = "Please enter a valid phone number, for example 082 123 4567.";
    }
  }

  if (values.school.length > LIMITS.school) {
    errors.school = `Please keep this under ${LIMITS.school} characters.`;
  }
  if (values.role_at_school.length > LIMITS.role) {
    errors.role_at_school = `Please keep this under ${LIMITS.role} characters.`;
  }
  if (values.province && !provinces.includes(values.province)) {
    errors.province = "Please choose a province from the list.";
  }
  if (values.dietary_or_access_needs.length > LIMITS.needs) {
    errors.dietary_or_access_needs = `Please keep this under ${LIMITS.needs} characters.`;
  }

  return { values, errors };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export type FeedbackField =
  | "overall_rating"
  | "wellbeing"
  | "stress_level"
  | "email"
  | "full_name"
  | "school"
  | "role_at_school"
  | "workshop_id"
  | "most_valuable"
  | "improvements"
  | "future_topics";

export type FeedbackValues = {
  full_name: string;
  email: string;
  school: string;
  role_at_school: string;
  workshop_id: string;
  overall_rating: number | null;
  stress_level: number | null;
  wellbeing_before: number | null;
  wellbeing_after: number | null;
  would_recommend: boolean | null;
  most_valuable: string;
  improvements: string;
  future_topics: string;
};

export type FeedbackErrors = { [K in FeedbackField]?: string };

function ratingOrNull(value: unknown, max: number): number | null | "bad" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) {
    return "bad";
  }
  return value;
}

export function validateFeedback(input: unknown): {
  values: FeedbackValues;
  errors: FeedbackErrors;
} {
  const raw = (input ?? {}) as { [key: string]: unknown };
  const errors: FeedbackErrors = {};

  const overall = ratingOrNull(raw["overall_rating"], 5);
  const stress = ratingOrNull(raw["stress_level"], 10);
  const before = ratingOrNull(raw["wellbeing_before"], 10);
  const after = ratingOrNull(raw["wellbeing_after"], 10);

  const values: FeedbackValues = {
    full_name: cleanText(raw["full_name"]).replace(/\s+/g, " "),
    email: cleanText(raw["email"]).toLowerCase(),
    school: cleanText(raw["school"]),
    role_at_school: cleanText(raw["role_at_school"]),
    workshop_id: cleanText(raw["workshop_id"]),
    overall_rating: overall === "bad" ? null : overall,
    stress_level: stress === "bad" ? null : stress,
    wellbeing_before: before === "bad" ? null : before,
    wellbeing_after: after === "bad" ? null : after,
    would_recommend: typeof raw["would_recommend"] === "boolean" ? raw["would_recommend"] : null,
    most_valuable: cleanText(raw["most_valuable"], true),
    improvements: cleanText(raw["improvements"], true),
    future_topics: cleanText(raw["future_topics"], true),
  };

  if (overall === null || overall === "bad") {
    errors.overall_rating = "Please choose a rating from 1 to 5. This is the one question we need.";
  }
  if (stress === "bad") errors.stress_level = "Please choose a number from 1 to 10.";
  if (before === "bad" || after === "bad") {
    errors.wellbeing = "Please choose numbers from 1 to 10.";
  } else if ((before === null) !== (after === null)) {
    errors.wellbeing =
      "Please answer both wellbeing questions (before and after), or leave both blank.";
  }

  if (values.email && !isValidEmail(values.email)) {
    errors.email = "That email address doesn't look right. You can also leave it blank.";
  }
  if (values.full_name.length > LIMITS.name) {
    errors.full_name = `Please keep your name under ${LIMITS.name} characters.`;
  }
  if (values.school.length > LIMITS.school) {
    errors.school = `Please keep this under ${LIMITS.school} characters.`;
  }
  if (values.role_at_school.length > LIMITS.role) {
    errors.role_at_school = `Please keep this under ${LIMITS.role} characters.`;
  }
  if (values.workshop_id && !isUuid(values.workshop_id)) {
    errors.workshop_id = "Please choose a workshop from the list.";
  }
  const textFields = ["most_valuable", "improvements", "future_topics"] as const;
  for (const key of textFields) {
    if (values[key].length > LIMITS.feedbackText) {
      errors[key] = `Please keep this under ${LIMITS.feedbackText} characters.`;
    }
  }

  return { values, errors };
}
