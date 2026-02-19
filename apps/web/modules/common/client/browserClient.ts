import axios from "axios"
import { createClient } from "@/lib/supabase/client"

/**
 * Browser-side axios client for use in 'use client' components.
 * Gets the auth token from the Supabase browser client.
 */
export const browserClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

browserClient.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.error("Error getting session:", error)
  }
  return config
})

browserClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login"
      }
    }
    return Promise.reject(error)
  }
)
