import axios from "axios"

/**
 * Browser-side axios client for use in 'use client' components.
 * Gets the auth token from the Supabase browser client.
 */
export const browserClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})