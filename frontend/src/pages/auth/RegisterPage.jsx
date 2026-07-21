import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { register as registerUser } from "../../services/authService";

/* ---------------- Validation ---------------- */

const schema = yup.object({
  fullName: yup
    .string()
    .required("Full name is required")
    .min(3, "Name should contain at least 3 characters"),

  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),

  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password should be at least 6 characters"),

  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

export default function RegisterPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  /* ---------------- Register Mutation ---------------- */

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: () => {
      toast.success("Registration successful");

      navigate("/login");
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Registration failed"
      );
    },
  });

  /* ---------------- Submit ---------------- */

  const onSubmit = (data) => {
    registerMutation.mutate(data);
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <UserPlus className="h-8 w-8 text-primary-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Register to start using ProcureX
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Full Name */}
          <div className="relative">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              error={errors.fullName?.message}
              className="pl-10"
              {...register("fullName")}
            />
            <User
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              className="pl-10"
              {...register("email")}
            />
            <Mail
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              error={errors.password?.message}
              className="pl-10 pr-12"
              {...register("password")}
            />

            <Lock
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[39px] text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
              className="pl-10 pr-12"
              {...register("confirmPassword")}
            />

            <Lock
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              className="absolute right-3 top-[39px] text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            loading={registerMutation.isPending}
            className="w-full"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t pt-5 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}