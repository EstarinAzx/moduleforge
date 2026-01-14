import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../lib/api'

interface User {
    id: string
    email: string
    displayName: string
    createdAt: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, displayName: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    // Check token validity on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const response = await authApi.getMe()
                setUser(response.data)
            } catch {
                // Token invalid, clear it
                localStorage.removeItem('token')
                setToken(null)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [token])

    const login = async (email: string, password: string) => {
        const response = await authApi.login({ email, password })
        const { token: newToken, user: userData } = response.data
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
    }

    const register = async (email: string, password: string, displayName: string) => {
        const response = await authApi.register({ email, password, displayName })
        const { token: newToken, user: userData } = response.data
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
