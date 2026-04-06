import { z } from "zod";

const normalizeEmptyString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
};

export const optionalDateStringSchema = z.preprocess(
  normalizeEmptyString,
  z.string().datetime("La fecha es invalida").optional(),
);
