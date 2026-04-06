import { z } from "zod";

const normalizeEmptyString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
};

export const optionalUrlSchema = z.preprocess(
  normalizeEmptyString,
  z.string().url("URL invalida").optional(),
);

export const optionalUuidSchema = z.preprocess(
  normalizeEmptyString,
  z.string().uuid("UUID invalido").optional(),
);
