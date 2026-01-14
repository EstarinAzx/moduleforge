import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true)
        try {
            await authApi.forgotPassword(data.email)
            setIsSubmitted(true)
        } catch {
            // Still show success to prevent email enumeration
            setIsSubmitted(true)
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="card w-full max-w-md text-center">
                    <div className="mb-4 text-5xl">📧</div>
                    <h1 className="mb-2 text-2xl font-bold text-white">Check Your Email</h1>
                    <p className="mb-6 text-slate-400">
                        If that email exists in our system, we've sent a password reset link.
                    </p>
                    <p className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
                        <strong>MVP Note:</strong> Check your browser console for the reset link.
                    </p>
                    <Link to="/login" className="btn-secondary inline-block">
                        Back to Login
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
                    <h1 className="text-3xl font-bold text-white">Forgot Password?</h1>
                    <p className="mt-2 text-slate-400">Enter your email and we'll send a reset link</p>
                </div>

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
                                Sending...
                            </span>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-slate-400">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
