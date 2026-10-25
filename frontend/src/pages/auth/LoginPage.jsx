import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { login } from '../../services/authService'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import AuthDecoration from '../../assets/auth-decoration.svg'

const schema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .required('Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: contextLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const redirectUser = (user) => {
    if (!user?.role) { navigate('/login'); return }
    const role = user.role
    switch (role) {
      case ROLES.ADMIN:               navigate('/admin/dashboard'); break
      case ROLES.PROCUREMENT_MANAGER: navigate('/procurement/dashboard'); break
      case ROLES.INVENTORY_MANAGER:   navigate('/inventory/dashboard'); break
      case ROLES.FINANCE_MANAGER:     navigate('/finance/dashboard'); break
      case ROLES.VENDOR:              navigate('/vendor/dashboard'); break
      default:                        navigate('/unauthorized')
    }
  }

  const loginMutation = useMutation({
    mutationFn: (formData) => contextLogin(formData),
    onSuccess: (data) => {
      toast.success('Login successful')
      redirectUser(data)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Invalid email or password')
    },
  })

  const onSubmit = (formData) => {
    loginMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen flex dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:to-[#1E1B4B]">
      {/* Left hero panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col items-center justify-center relative overflow-hidden p-12"
        style={{background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 60%, #7C3AED 100%)'}}
      >
        {/* Decoration */}
        <img
          src={AuthDecoration}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
        />
        {/* Brand content */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            ProcureX
          </h1>
          <p className="text-white/70 text-base max-w-xs leading-relaxed">
            Streamline procurement, empower decisions.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 dark:bg-[#1A1035]/80 dark:border-l dark:border-white/10">
        <div className="w-full max-w-md animate-fade-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-white/10">
              <LogIn size={28} className="text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
              Sign in to continue to ProcureX
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                className="pr-10"
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password')}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot Password?
              </button>
            </div>
            <Button type="submit" loading={loginMutation.isPending} className="w-full">
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-100 pt-5 text-center dark:border-white/10">
            <p className="text-sm text-gray-600 dark:text-white/60">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
