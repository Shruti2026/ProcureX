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

/* ---------------- Validation Schema ---------------- */

const schema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),

  password: yup
    .string()
    .min(6, 'Password must contain at least 6 characters')
    .required('Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()

  const { setUser } = useAuth()

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /* ---------------- Role Redirect ---------------- */

  const redirectUser = (user) => {
    if (!user?.roles?.length) {
      navigate('/login')
      return
    }

    const role = user.roles[0]

    switch (role) {
      case ROLES.ADMIN:
        navigate('/admin/dashboard')
        break

      case ROLES.PROCUREMENT_MANAGER:
        navigate('/procurement/dashboard')
        break

      case ROLES.INVENTORY_MANAGER:
        navigate('/inventory/dashboard')
        break

      case ROLES.FINANCE_MANAGER:
        navigate('/finance/dashboard')
        break

      case ROLES.VENDOR:
        navigate('/vendor/dashboard')
        break

      default:
        navigate('/unauthorized')
    }
  }

  /* ---------------- Login Mutation ---------------- */

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: (data) => {
      /**
       * Expected backend response:
       *
       * {
       *   accessToken,
       *   user
       * }
       */

      setUser(data.user)

      toast.success('Login successful')

      redirectUser(data.user)
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          'Invalid email or password'
      )
    },
  })

  /* ---------------- Submit ---------------- */

  const onSubmit = (formData) => {
    loginMutation.mutate(formData)
  }
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <LogIn className="h-8 w-8 text-primary-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to ProcureX
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              error={errors.password?.message}
              className="pr-12"
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            loading={loginMutation.isPending}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t pt-5 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Register
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}
