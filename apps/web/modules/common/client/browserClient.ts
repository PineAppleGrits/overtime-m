import axios from "axios"
import { createClient } from "@/lib/supabase/client"

/**
 * Browser-side axios client for use in 'use client' components.
 * Attaches the Supabase session Bearer token on every request.
 */
export const browserClient = axios.create({
  baseURL: "/api",
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
  } catch {
    // session unavailable — request proceeds without auth header
  }
  return config
})