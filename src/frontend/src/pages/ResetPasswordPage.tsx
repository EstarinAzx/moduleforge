import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'

const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    })

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError('Invalid reset link. Please request a new one.')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            await authApi.resetPassword({ token, newPassword: data.newPassword })
            setIsSuccess(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } }
            setError(axiosError.response?.data?.error || 'Failed to reset password. The link may have expired.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="card w-full max-w-md text-center">
                    <div className="mb-4 text-5xl">❌</div>
                    <h1 className="mb-2 text-2xl font-bold text-white">Invalid Link</h1>
                    <p className="mb-6 text-slate-400">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link to="/forgot-password" className="btn-primary inline-block">
                        Request New Link
                    </Link>
                </div>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="card w-full max-w-md text-center">
                    <div className="mb-4 text-5xl">✅</div>
                    <h1 className="mb-2 text-2xl font-bold text-white">Password Reset!</h1>
                    <p className="mb-6 text-slate-400">
                        Your password has been successfully reset. Redirecting to login...
                    </p>
                    <Link to="/login" className="btn-primary inline-block">
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Reset Password</h1>
                    <p className="mt-2 text-slate-400">Enter your new password</p>
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
                        <label className="mb-2 block text-sm font-medium text-slate-300">New Password</label>
                        <input
                            {...register('newPassword')}
                            type="password"
                            placeholder="••••••••"
                            className="input-field"
                            autoFocus
                        />
                        {errors.newPassword && (
                            <p className="mt-1.5 text-sm text-red-400">{errors.newPassword.message}</p>
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
                                Resetting...
                            </span>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
