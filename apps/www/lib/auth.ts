export type AuthErrorKey = "connection" | "error" | "exists" | "invalid";

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
