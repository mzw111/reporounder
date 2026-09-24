export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
}

export interface RegisterPayload {
  email: string
  password: string
  display_name: string
}

export interface LoginPayload {
  email: string
  password: string
}