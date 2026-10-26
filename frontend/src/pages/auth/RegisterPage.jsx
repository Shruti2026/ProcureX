import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Building,
  Phone,
  CheckCircle2,
} from 'lucide-react'

import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { register as registerUser } from '../../services/authService'
import AuthDecoration from '../../assets/auth-decoration.svg'

const schema = yup.object({
  companyName: yup
    .string()
    .required('Company name is required')
    .min(3, 'Company name should contain at least 3 characters'),
  contactPerson: yup
    .string()
    .required('Contact person is required')
    .min(3, 'Contact person should contain at least 3 characters'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[+]?[0-9]{8,15}$/, 'Enter a valid phone number'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password should be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setIsRegistered(true)
      toast.success('Registration submitted successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Registration failed')
    },
  })

  const onSubmit = (data) => {
    const { confirmPassword, ...registerPayload } = data
    registerMutation.mutate(registerPayload)
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4 dark:bg-[#0F0A1E]">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-primary-100 p-8 text-center animate-fade-slide-up dark:bg-white/5 dark:border-white/10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Registration Successful
          </h1>
          <p className="mt-4 text-sm text-gray-600 dark:text-white/70">
            Your account is pending administrator approval.
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
            You will receive an email once your account has been approved.
          </p>
          <Button onClick={() => navigate('/login')} className="mt-6 w-full">
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:to-[#1E1B4B]">
      {/* Left hero panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col items-center justify-center relative overflow-hidden p-12"
        style={{background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 60%, #7C3AED 100%)'}}
      >
        <img
          src={AuthDecoration}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
        />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            ProcureX
          </h1>
          <p className="text-white/70 text-base max-w-xs leading-relaxed">
            Join ProcureX as a verified vendor.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 dark:bg-[#1A1035]/80 dark:border-l dark:border-white/10">
        <div className="w-full max-w-md animate-fade-slide-up">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-white/10">
              <UserPlus size={28} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vendor Registration
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
              Register to start using ProcureX
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <Input
                label="Company Name"
                placeholder="Enter company name"
                error={errors.companyName?.message}
                className="pl-10"
                {...register('companyName')}
              />
              <Building size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
            </div>
            <div className="relative">
              <Input
                label="Contact Person"
                placeholder="Enter contact person's name"
                error={errors.contactPerson?.message}
                className="pl-10"
                {...register('contactPerson')}
              />
              <User size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
            </div>
            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="Enter email address"
                error={errors.email?.message}
                className="pl-10"
                {...register('email')}
              />
              <Mail size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
            </div>
            <div className="relative">
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                error={errors.phone?.message}
                className="pl-10"
                {...register('phone')}
              />
              <Phone size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
            </div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                error={errors.password?.message}
                className="pl-10 pr-12"
                {...register('password')}
              />
              <Lock size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[39px] text-gray-500 hover:text-gray-700 transition-colors dark:text-white/60 dark:hover:text-white/80"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                className="pl-10 pr-12"
                {...register('confirmPassword')}
              />
              <Lock size={18} className="absolute left-3 top-[39px] text-gray-400 dark:text-white/40" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-[39px] text-gray-500 hover:text-gray-700 transition-colors dark:text-white/60 dark:hover:text-white/80"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Button
              type="submit"
              loading={registerMutation.isPending}
              className="w-full"
            >
              Register
            </Button>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-5 text-center dark:border-white/10">
            <p className="text-sm text-gray-600 dark:text-white/60">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
