"use client"

import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Eye, EyeOff, AlertCircle, Lock, MapPin, Briefcase } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getPasswordStrength, getPasswordStrengthLabel } from "@/lib/password-strength"
import type { SignUpFormValues } from "@/lib/validation"

const OCCUPATION_OPTIONS = [
  "Working Professional",
  "Dedicated Student",
  "Retired",
  "Transitioning Between Opportunities",
  "Entrepreneur",
]

export function SecurityStep() {
  const { control } = useFormContext<SignUpFormValues>()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const password = useWatch({ control, name: "password" })
  const passwordStrength = getPasswordStrength(password || "")
  const passwordStrengthInfo = getPasswordStrengthLabel(passwordStrength)

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Password
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength <= 1
                        ? "bg-red-500 w-1/5"
                        : passwordStrength === 2
                          ? "bg-orange-500 w-2/5"
                          : passwordStrength === 3
                            ? "bg-yellow-500 w-3/5"
                            : "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                  {passwordStrengthInfo.label}
                </span>
              </div>
            )}
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="passwordConfirmation"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Confirm Password
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="zip_code"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Zip Code
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder="12345"
                maxLength={10}
                className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              />
            </FormControl>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="occupationStatus"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              Current Status
            </FormLabel>
            <FormControl>
              {/* Native <select>, NOT components/ui/select.tsx — see design
                  doc gap #2. Swapping this changes the rendered markup and
                  will fail the SecurityStep test in Task 8. */}
              <select
                {...field}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B95D38] focus:ring-[#B95D38] bg-white ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              >
                <option value="">Select your current status</option>
                {OCCUPATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormControl>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}
