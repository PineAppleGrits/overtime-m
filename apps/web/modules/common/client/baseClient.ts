import axios from "axios";
import { getSession } from "@/lib/supabase/getSessionSsr";

export const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

client.interceptors.request.use(async (config) => {
    // Get session from Supabase
    try {
        const session = await getSession();
        // Set Authorization header with Supabase access token
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (error) {
        console.error('Error getting session:', error);
    }

    return config;
});

// Response interceptor for error handling
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Redirect to login if unauthorized
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);