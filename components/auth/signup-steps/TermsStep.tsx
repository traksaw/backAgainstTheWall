"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { AlertCircle } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsModal } from "@/components/modals/TermsModal"
import { PrivacyModal } from "@/components/modals/PrivacyModal"
import type { SignUpFormValues } from "@/lib/validation"

export function TermsStep() {
  const { control } = useFormContext<SignUpFormValues>()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-3">Terms and Conditions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Acceptance of Terms</strong></p>
          <p>By creating an account, you agree to these terms and conditions.</p>

          <p><strong>2. Data Collection and Use</strong></p>
          <p>
            We collect your personal information to provide personalized quiz results and film recommendations.
            Your data will not be shared with third parties without your consent.
          </p>

          <p><strong>3. Quiz Results</strong></p>
          <p>
            The financial archetype quiz is for educational and entertainment purposes. Results should not be
            considered professional financial advice.
          </p>

          <p><strong>4. Account Security</strong></p>
          <p>You are responsible for maintaining the security of your account credentials.</p>

          <p><strong>5. Content Usage</strong></p>
          <p>All film content and quiz materials are protected by copyright. Personal use only.</p>

          <p><strong>6. Privacy Policy</strong></p>
          <p>We respect your privacy. See our full Privacy Policy for details on data handling.</p>

          <p><strong>7. Changes to Terms</strong></p>
          <p>We may update these terms periodically. Continued use constitutes acceptance of changes.</p>
        </div>
      </div>

      <FormField
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <FormItem>
            <div className="flex items-start space-x-3">
              <FormControl>
                <Checkbox
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-1"
                />
              </FormControl>
              <FormLabel className="text-sm text-gray-700 leading-relaxed">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#B95D38] font-medium hover:underline"
                >
                  Terms and Conditions
                </button> and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[#B95D38] font-medium hover:underline"
                >
                  Privacy Policy
                </button>
              </FormLabel>
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

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Almost there!</strong> Once you create your account, you'll immediately take our financial
          personality quiz to discover your archetype.
        </AlertDescription>
      </Alert>

      <TermsModal open={showTermsModal} onOpenChange={setShowTermsModal} />
      <PrivacyModal open={showPrivacyModal} onOpenChange={setShowPrivacyModal} />
    </div>
  )
}
