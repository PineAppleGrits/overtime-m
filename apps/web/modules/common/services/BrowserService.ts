import { AxiosInstance } from "axios"

/**
 * Base class for browser-side services (used in 'use client' components).
 */
export class BrowserService {
  protected client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }
}
