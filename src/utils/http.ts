import type { AxiosRequestConfig } from 'axios'
import axios, { AxiosInstance, AxiosResponse } from 'axios'

import dotenv from 'dotenv'

dotenv.config()
const { TIAN_API_KEY } = process.env

const instance = axios.create({
  withCredentials: true,
  timeout: 30000,
})

instance.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200)
      return res.result
    return undefined
  },
)

const request = <T = any>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  if (typeof config === 'string') {
    if (!options) {
      return instance.request<T, T>({
        url: config,
      })
    }
    else {
      return instance.request<T, T>({
        url: config,
        ...options,
      })
    }
  }
  else {
    return instance.request<T, T>(config)
  }
}

export function get<T = any>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return request({ ...config, method: 'GET' }, options)
}

export function getTian<T = any>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return request(
    { ...config, params: {  key: TIAN_API_KEY,...(config.params || {}), }, method: 'GET' },
    options,
  )
}

export function post<T = any>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return request({ ...config, method: 'POST' }, options)
}

export default request
export { AxiosInstance, AxiosResponse }
