import { z } from "zod";

export class RateLimitError extends Error {
    constructor() {
        super("Rate limit exceeded");
        this.name = "RateLimitError";
    }
}

export class PublicError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class AuthenticationError extends PublicError {
    constructor() {
        super("You must be logged in to view this content or perform this action");
        this.name = "AuthenticationError";
    }
}

export class UnauthorizedError extends PublicError {
    constructor() {
        super("You are not authorized to view this content or perform this action");
        this.name = "UnauthorizedError";
    }
}

export const zodErrorMap: z.ZodErrorMap = (issue) => {
    switch (issue.code) {
        case "invalid_type":
            if (issue.received === "undefined") return { message: "Este campo es requerido" };
            return { message: `Tipo invalido. Se esperaba ${issue.expected}, pero se recibio ${issue.received}` };
        case "invalid_value":
            return { message: `Valor invalido` };
        case "unrecognized_keys":
            return { message: `Llaves no reconocidas en el objeto: ${issue.keys.join(", ")}` };
        case "invalid_union":
            return { message: `Valor invalido` };
        case "invalid_key":
            return { message: `Llave invalida en el objeto` };
        case "invalid_element":
            return { message: `Elemento invalido` };
        case "invalid_format":
            if (issue.format === "email") return { message: "Email invalido" };
            if (issue.format === "url") return { message: "URL invalida" };
            if (issue.format === "uuid") return { message: "UUID invalido" };
            if (issue.format === "date") return { message: "Fecha invalida" };
            return { message: `Formato invalido` };
        case "too_small":
            if (issue.type === "string") {
                if (issue.minimum === 1) return { message: "Este campo es requerido" };
                return { message: `Debe tener al menos ${issue.minimum} caracteres` };
            }
            if (issue.type === "number") return { message: `El valor debe ser al menos ${issue.minimum}` };
            if (issue.type === "array") return { message: `Debe tener al menos ${issue.minimum} elementos` };
            return { message: `Valor demasiado pequeno` };
        case "too_big":
            if (issue.type === "string") return { message: `Debe tener como maximo ${issue.maximum} caracteres` };
            if (issue.type === "number") return { message: `El valor debe ser como maximo ${issue.maximum}` };
            if (issue.type === "array") return { message: `Debe tener como maximo ${issue.maximum} elementos` };
            return { message: `Valor demasiado grande` };
        case "not_multiple_of":
            return { message: `El numero debe ser multiplo de ${issue.multipleOf}` };
        case "custom":
            return { message: issue.message ?? "Error de validacion" };
        default:
            return { message: `Error no especificado` };
    }
}