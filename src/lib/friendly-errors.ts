// Turns technical errors (database, login, network) into short, kind sentences.
// Rule: people never see raw error text. Anything we do not recognise becomes the
// fallback sentence that the calling page supplies.

type ErrorLike = { message?: unknown; code?: unknown; status?: unknown };

const NETWORK_MESSAGE =
  "We couldn't reach the server. Please check your internet connection and try again.";

function readMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as ErrorLike).message;
    if (typeof message === "string") return message;
  }
  return "";
}

export function friendlyError(error: unknown, fallback: string): string {
  const message = readMessage(error).toLowerCase();
  const code = error && typeof error === "object" ? String((error as ErrorLike).code ?? "") : "";
  const status = error && typeof error === "object" ? Number((error as ErrorLike).status) : 0;

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch failed") ||
    (typeof navigator !== "undefined" && navigator.onLine === false)
  ) {
    return NETWORK_MESSAGE;
  }

  // Sign-in and password problems
  if (message.includes("invalid login credentials")) {
    return "That email or password isn't right. Please check them and try again, or use 'Forgot password?'.";
  }
  if (message.includes("email not confirmed")) {
    return "Your email address hasn't been confirmed yet. Please ask the ESWA office for help.";
  }
  if (message.includes("email rate limit") || message.includes("over_email_send_rate_limit")) {
    return "We've sent several emails recently. Please wait a few minutes before asking for another.";
  }
  if (message.includes("email address not authorized")) {
    return "We can't send email to this address yet. Please contact the ESWA office.";
  }
  if (message.includes("rate limit") || message.includes("too many") || status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (message.includes("same password") || message.includes("different from the old")) {
    return "Please choose a password you haven't used before.";
  }
  if (message.includes("password should") || message.includes("weak password")) {
    return "That password is too easy to guess. Please use a longer one with a mix of letters and numbers.";
  }
  if (
    message.includes("jwt") ||
    message.includes("session") ||
    message.includes("not authenticated") ||
    status === 401
  ) {
    return "Your session has ended. Please sign in again.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    code === "42501" ||
    status === 403
  ) {
    return "Your account doesn't have permission to do that.";
  }

  // Data problems
  if (code === "23505" || message.includes("duplicate key")) {
    return "That entry already exists.";
  }
  if (code === "23503" || message.includes("foreign key")) {
    return "That can't be removed because other records depend on it.";
  }
  if (message.includes("workshop_full")) return "Sorry, this workshop has just filled up.";
  if (message.includes("workshop_unavailable")) {
    return "This workshop is no longer open for registration.";
  }
  if (message.includes("workshop_closed")) return "This workshop has already taken place.";
  if (message.includes("invalid_email")) return "Please enter a valid email address.";
  if (message.includes("invalid_name")) return "Please enter your full name.";
  if (message.includes("field_too_long")) {
    return "One of your answers is too long. Please shorten it and try again.";
  }

  return fallback;
}

export const GENERIC_SAVE_ERROR =
  "Something went wrong on our side and your details were not saved. Please try again in a moment.";
