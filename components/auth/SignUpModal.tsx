// components/auth/SignUpModal.tsx
"use client"

import { CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form } from "@/components/ui/form"
import { useSignUpForm } from "@/hooks/useSignUpForm"
import { BasicInfoStep } from "@/components/auth/signup-steps/BasicInfoStep"
import { SecurityStep } from "@/components/auth/signup-steps/SecurityStep"
import { TermsStep } from "@/components/auth/signup-steps/TermsStep"

interface SignUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
  onSuccess: () => void
}

export function SignUpModal({ open, onOpenChange, onSwitchToSignIn, onSuccess }: SignUpModalProps) {
  const { form, currentStep, stepAttempted, goNext, goBack, onSubmit, submitError, loading, resetForm } = useSignUpForm({
    onOpenChange,
    onSuccess,
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md bg-white text-gray-900 border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900">Create Your Account</DialogTitle>
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? "bg-[#B95D38] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && <div className={`w-8 h-1 mx-2 ${step < currentStep ? "bg-[#B95D38]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {currentStep === 1 && "Let's start with your basic information"}
            {currentStep === 2 && "Set up your account security"}
            {currentStep === 3 && "Review and accept our terms"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            {currentStep === 1 && <BasicInfoStep showErrors={stepAttempted} />}
            {currentStep === 2 && <SecurityStep showErrors={stepAttempted} />}
            {currentStep === 3 && <TermsStep showErrors={stepAttempted} />}

            {submitError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="border-gray-300 text-gray-700 hover:bg-[#B95D38]/10 bg-transparent"
                >
                  Back
                </Button>
              )}

              <div className="flex-1" />

              {currentStep < 3 ? (
                <Button
                  key="next"
                  type="button"
                  onClick={goNext}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6"
                >
                  Next
                </Button>
              ) : (
                <Button
                  key="submit"
                  type="submit"
                  disabled={loading}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
