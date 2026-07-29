import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Eye, EyeOff, KeyRound, X } from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import { changePassword } from '../../services/authService'

/* ───────── Validation Schema ───────── */
const schema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'New password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
})

/**
 * Modal overlay for changing the logged-in user's password.
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen    – controls visibility
 * @param {Function} props.onClose   – callback to close the modal
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const [showCurrent, setShowCurrent]     = useState(false)
  const [showNew, setShowNew]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      changePassword({ currentPassword, newPassword }),

    onSuccess: () => {
      toast.success('Password changed successfully!')
      reset()
      onClose()
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || 'Failed to change password. Please try again.'
      )
    },
  })

  const onSubmit = (formData) => {
    mutation.mutate(formData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Change Password</h2>
                <p className="text-xs text-primary-100">Keep your account secure</p>
              </div>
            </div>
            <button
              id="close-change-password-modal"
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-4">

          {/* Current Password */}
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter your current password"
              error={errors.currentPassword?.message}
              className="pr-12"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              placeholder="Enter your new password (min. 8 chars)"
              error={errors.newPassword?.message}
              className="pr-12"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm New Password */}
          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter your new password"
              error={errors.confirmPassword?.message}
              className="pr-12"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={mutation.isPending}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
