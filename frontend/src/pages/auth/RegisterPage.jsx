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
  Building,
  Phone,
  CheckCircle2,
} from "lucide-react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { register as registerUser } from "../../services/authService";

/* ---------------- Validation ---------------- */

const schema = yup.object({
  companyName: yup
    .string()
    .required("Company name is required")
    .min(3, "Company name should contain at least 3 characters"),

  contactPerson: yup
    .string()
    .required("Contact person is required")
    .min(3, "Contact person should contain at least 3 characters"),

  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[+]?[0-9]{8,15}$/, "Enter a valid phone number"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password should be at least 8 characters"),

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
  const [isRegistered, setIsRegistered] = useState(false);

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
      setIsRegistered(true);
      toast.success("Registration submitted successfully");
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
    // Exclude confirmPassword from request DTO
    const { confirmPassword, ...registerPayload } = data;
    registerMutation.mutate(registerPayload);
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl shadow-gray-200/60 ring-1 ring-gray-200 p-8 text-center animate-fade-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Registration Successful
          </h1>

          <p className="mt-4 text-sm text-gray-600">
            Your account is pending administrator approval.
          </p>

          <p className="mt-2 text-sm text-gray-600">
            You will receive an email once your account has been approved.
          </p>

          <Button
            onClick={() => navigate("/login")}
            className="mt-6 w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl shadow-gray-200/60 ring-1 ring-gray-200 p-8 animate-fade-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <UserPlus size={32} className="text-primary-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Registration
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Register to start using ProcureX
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Company Name */}
          <div className="relative">
            <Input
              label="Company Name"
              placeholder="Enter company name"
              error={errors.companyName?.message}
              className="pl-10"
              {...register("companyName")}
            />
            <Building
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />
          </div>

          {/* Contact Person */}
          <div className="relative">
            <Input
              label="Contact Person"
              placeholder="Enter contact person's name"
              error={errors.contactPerson?.message}
              className="pl-10"
              {...register("contactPerson")}
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
              placeholder="Enter email address"
              error={errors.email?.message}
              className="pl-10"
              {...register("email")}
            />
            <Mail
              size={18}
              className="absolute left-3 top-[39px] text-gray-400"
            />
          </div>

          {/* Phone Number */}
          <div className="relative">
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              error={errors.phone?.message}
              className="pl-10"
              {...register("phone")}
            />
            <Phone
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
            Register
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
