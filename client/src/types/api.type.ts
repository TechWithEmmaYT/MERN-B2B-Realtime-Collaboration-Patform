export type ApiSuccessResponse<T> = {
  success: true
  message?: string
  data: T
}

export type ApiErrorResponse = {
  success: false
  errorCode: string
  message: string
  errors?: { field: string; message: string }[]
}
