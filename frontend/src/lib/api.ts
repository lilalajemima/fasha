import { ApiClient } from './ApiClient'
import { TokenStore } from './TokenStore'

const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

export const tokenStore = new TokenStore('fasha.token')
export const api = new ApiClient(baseUrl, tokenStore)
