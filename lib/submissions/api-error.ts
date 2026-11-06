import type { ApiErrorBody } from "../../types/submissions";

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<{ message: string; fieldErrors?: Record<string, string> }> {
  try {
    const result = (await response.json()) as ApiErrorBody;
    return {
      message:
        typeof result.message === "string" && result.message.trim()
          ? result.message
          : fallback,
      fieldErrors: result.fieldErrors,
    };
  } catch {
    return { message: fallback };
  }
}
