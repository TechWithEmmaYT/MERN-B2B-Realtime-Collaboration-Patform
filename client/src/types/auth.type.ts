export type User = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type AuthResponse = {
  user: User
}

export type CurrentUserResponse = {
  user: User
}
