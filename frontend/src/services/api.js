import axios from 'axios'

// In-memory token store — never localStorage (XSS risk)
let accessToken = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token) => { accessToken = token }
export const clearAccessToken = () => { accessToken = null }

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // required for HttpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach in-memory access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — silent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        )
        setAccessToken(data.data.accessToken)
        original.headers['Authorization'] = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        clearAccessToken()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
