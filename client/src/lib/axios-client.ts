import axios, { AxiosError } from 'axios'

import type { ApiErrorResponse } from '@/types'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export const API = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/status']

API.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const { data, status, config } = error.response ?? {}

    if (status === 401 && !PUBLIC_PATHS.includes(config?.url ?? '')) {
      window.location.href = '/sign-in'
    }

    return Promise.reject({
      errorCode: data?.errorCode ?? 'ERR_NETWORK',
      message: data?.message ?? error.message ?? 'Something went wrong',
      errors: data?.errors,
      status,
    })
  },
)
