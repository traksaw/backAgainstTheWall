// components/auth/signup-steps/BasicInfoStep.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { User, Mail, AlertCircle } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { SignUpFormValues } from "@/lib/validation"

interface BasicInfoStepProps {
  // Only render field errors once the user has actually attempted this
  // step (Next clicked and failed) — see useSignUpForm's stepAttempted
  // comment. Without this gate, react-hook-form's background revalidation
  // on field (re)registration can surface stale/premature errors.
  showErrors: boolean
}

export function BasicInfoStep({ showErrors }: BasicInfoStepProps) {
  const { control } = useFormContext<SignUpFormValues>()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-1" />
                First Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="John"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    showErrors && fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              {showErrors && fieldState.error && (
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
          name="lastName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Last Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Doe"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    showErrors && fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              {showErrors && fieldState.error && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              Email Address
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                placeholder="john.doe@example.com"
                className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                  showErrors && fieldState.error ? "border-red-500" : ""
                }`}
              />
            </FormControl>
            {showErrors && fieldState.error && (
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
