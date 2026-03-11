import { headers } from "next/headers";

export async function getIp() {
    const rawHeaders = await headers();

    const forwardedFor = rawHeaders.get("x-forwarded-for");
    const realIp = rawHeaders.get("x-real-ip");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    if (realIp) {
        return realIp.trim();
    }

    return null;
}