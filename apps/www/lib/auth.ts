export type AuthErrorKey =
  | "common"
  | "connection"
  | "error"
  | "exists"
  | "invalid"
  | "rate";
export type AuthResultError =
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "INVALID_INPUT"
  | "PASSWORD_TOO_COMMON"
  | "RATE_LIMITED"
  | "USER_NOT_FOUND";

/** Reads the client failure and its immediate vendor cause. */
function authErrorText(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const { cause } = error;
  if (cause instanceof Error) {
    return `${error.message} ${cause.message}`;
  }
  return cause === undefined
    ? error.message
    : `${error.message} ${String(cause)}`;
}

/** Selects concise localized copy for a known Convex Auth failure. */
export function authErrorKey(error: unknown): AuthErrorKey {
  const message = authErrorText(error);
  if (
    message.includes("Invalid credentials") ||
    message.includes("InvalidAccountId") ||
    message.includes("InvalidSecret")
  ) {
    return "invalid";
  }
  if (message.includes("already exists")) {
    return "exists";
  }
  if (message.includes("Connection lost")) {
    return "connection";
  }
  return "error";
}

/** Maps a typed Convex Auth v2 result to concise localized copy. */
export function authResultKey(error: AuthResultError): AuthErrorKey {
  if (error === "EMAIL_TAKEN") {
    return "exists";
  }
  if (error === "PASSWORD_TOO_COMMON") {
    return "common";
  }
  if (error === "RATE_LIMITED") {
    return "rate";
  }
  return "invalid";
}
