import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await login(data.email, data.password)
            navigate('/dashboard')
        } catch {
            setError('Invalid email or password.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="mt-2 text-slate-400">Sign in to your ModuleForge account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="you@example.com"
                            className="input-field"
                            autoFocus
                        />
                        {errors.email && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-sm font-medium text-slate-300">Password</label>
                            <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            className="input-field"
                        />
                        {errors.password && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-slate-400">
                            Remember me
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
