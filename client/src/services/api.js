import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - but don't auto-reload to prevent loops
      console.warn('Authentication expired, user needs to login again')
      // You could dispatch a logout action here instead of reloading
    }
    return Promise.reject(error)
  }
)

export default api