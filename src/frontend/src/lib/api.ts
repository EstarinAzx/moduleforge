import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API functions
export const authApi = {
    register: (data: { email: string; password: string; displayName: string }) =>
        api.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (data: { token: string; newPassword: string }) =>
        api.post('/auth/reset-password', data),

    getMe: () => api.get('/auth/me'),

    updateProfile: (displayName: string) =>
        api.patch('/auth/profile', { displayName }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.post('/auth/change-password', data),
}

export default api
