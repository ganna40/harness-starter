import { z } from "zod";
import { AppError } from "../../types/errors.ts";

export type HttpErrorResponse = {
  readonly status: number;
  readonly body: {
    readonly error: string;
    readonly message?: string;
    readonly issues?: readonly unknown[];
  };
};

export function mapError(err: unknown): HttpErrorResponse {
  if (err instanceof z.ZodError) {
    return {
      status: 400,
      body: { error: "VALIDATION", issues: err.issues },
    };
  }
  if (err instanceof AppError) {
    const status =
      err.code === "VALIDATION"
        ? 400
        : err.code === "UNAUTHORIZED"
          ? 403
          : err.code === "NOT_FOUND"
            ? 404
            : 500;
    return {
      status,
      body: { error: err.code, message: err.message },
    };
  }
  return {
    status: 500,
    body: { error: "INTERNAL", message: (err as Error)?.message ?? "unknown error" },
  };
}
