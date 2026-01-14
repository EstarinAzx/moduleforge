import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    displayName: z.string().min(1, 'Display name is required').max(50, 'Display name must be 50 characters or less'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register: registerUser } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await registerUser(data.email, data.password, data.displayName)
            navigate('/dashboard')
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } }
            setError(axiosError.response?.data?.error || 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Create Account</h1>
                    <p className="mt-2 text-slate-400">Join ModuleForge and start building</p>
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
                        <label className="mb-2 block text-sm font-medium text-slate-300">Display Name</label>
                        <input
                            {...register('displayName')}
                            type="text"
                            placeholder="Your name"
                            className="input-field"
                            autoFocus
                        />
                        {errors.displayName && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.displayName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="you@example.com"
                            className="input-field"
                        />
                        {errors.email && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="••••••••"
                            className="input-field"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword.message}</p>
                        )}
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
                                Creating account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
