import { getProfile } from "@/lib/auth/session";
import { rateLimitByKey } from "@/utils/limiter";
import { createServerActionProcedure } from "zsa";
import { AuthenticationError, PublicError } from "./errors";


const IS_DEV = process.env.NODE_ENV === "development";

function shapeErrors({ err }: { err: unknown }) {
    const isAllowedError = err instanceof PublicError;
    // let's all errors pass through to the UI so debugging locally is easier
    if (isAllowedError || IS_DEV) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        const code = err instanceof Error && "code" in err
            ? (err as Error & { code?: string }).code ?? "ERROR"
            : "ERROR";
        return {
            code,
            message: `${!isAllowedError && IS_DEV ? "DEV ONLY ENABLED - " : ""}${message}`,
        };
    } else {
        return {
            code: "ERROR",
            message: "Something went wrong",
        };
    }
}

export const authenticatedAction = createServerActionProcedure()
    .experimental_shapeError(shapeErrors)
    .handler(async () => {
        const user = await getProfile();
        if (!user) throw new AuthenticationError();
        await rateLimitByKey({
            key: `${user.id}-global`,
            limit: 10,
            window: 10000,
        });
        return { user };
    });

export const unauthenticatedAction = createServerActionProcedure()
    .experimental_shapeError(shapeErrors)
    .handler(async () => {
        await rateLimitByKey({
            key: `unauthenticated-global`,
            limit: 10,
            window: 10000,
        });
    });