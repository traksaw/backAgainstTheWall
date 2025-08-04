"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, MapPin, Briefcase, Lock } from "lucide-react"

interface SignUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
  onSuccess: () => void
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  passwordConfirmation?: string
  zip_code?: string
  occupationStatus?: string
  terms?: string
}

export function SignUpModal({ open, onOpenChange, onSwitchToSignIn, onSuccess }: SignUpModalProps) {
  const { signUp } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirmation: "",
    firstName: "",
    lastName: "",
    zip_code: "",
    occupationStatus: "",
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const occupationOptions = [
    "Working Professional",
    "Dedicated Student",
    "Retired",
    "Transitioning Between Opportunities",
    "Entrepreneur",
  ]

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one letter and one number"
    }

    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Please confirm your password"
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match"
    }

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = "Zip code is required"
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code.trim())) {
      newErrors.zip_code = "Please enter a valid zip code (e.g., 12345 or 12345-6789)"
    }

    if (!formData.occupationStatus) {
      newErrors.occupationStatus = "Please select your current status"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.acceptTerms) {
      newErrors.terms = "You must accept the terms and conditions to continue"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateStep3()) return

  setError("")
  setLoading(true)

  try {
    console.log("=== STARTING SIGNUP ===")
    console.log("Starting signup process with data:", {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      zip_code: formData.zip_code,
      occupationStatus: formData.occupationStatus,
    })

    console.log("Calling signUp function...")
    await signUp(formData)
    console.log("signUp function completed successfully!")

    console.log("Signup completed successfully, closing modal and starting quiz...")

    // Reset form first
    setFormData({
      email: "",
      password: "",
      passwordConfirmation: "",
      firstName: "",
      lastName: "",
      zip_code: "",
      occupationStatus: "",
      acceptTerms: false,
    })
    setCurrentStep(1)
    setErrors({})
    setError("")

    // Close modal
    onOpenChange(false)

    console.log("About to call onSuccess()...")
    // Call success callback
    onSuccess()
    console.log("onSuccess() called successfully!")

  } catch (error) {
    console.error("=== SIGNUP FAILED ===")
    console.error("Signup failed in component:", error)

    let errorMessage = "An unexpected error occurred during signup"

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as any).message
    }

    // Handle specific errors
    const errorMsg = errorMessage.toLowerCase()
    if (errorMsg.includes("already registered") || errorMsg.includes("already exists")) {
      errorMessage = "An account with this email already exists"
    } else if (errorMsg.includes("invalid email")) {
      errorMessage = "Please enter a valid email address"
    } else if (errorMsg.includes("password")) {
      errorMessage = "Password requirements not met"
    }

    setError(errorMessage)
  } finally {
    console.log("Setting loading to false")
    setLoading(false)
  }
}

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: "Weak", color: "text-red-500" }
      case 2:
        return { label: "Fair", color: "text-orange-500" }
      case 3:
        return { label: "Good", color: "text-yellow-500" }
      case 4:
      case 5:
        return { label: "Strong", color: "text-green-500" }
      default:
        return { label: "Weak", color: "text-red-500" }
    }
  }

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        email: "",
        password: "",
        passwordConfirmation: "",
        firstName: "",
        lastName: "",
        zip_code: "",
        occupationStatus: "",
        acceptTerms: false,
      })
      setCurrentStep(1)
      setErrors({})
      setError("")
    }
    onOpenChange(newOpen)
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordStrengthInfo = getPasswordStrengthLabel(passwordStrength)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">Create Your Account</DialogTitle>
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
          <p className="text-center text-gray-600 mt-2">
            {currentStep === 1 && "Let's start with your basic information"}
            {currentStep === 2 && "Set up your account security"}
            {currentStep === 3 && "Review and accept our terms"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                      errors.firstName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                      errors.lastName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Security & Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
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
                {errors.password && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="passwordConfirmation"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.passwordConfirmation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, passwordConfirmation: e.target.value }))}
                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                      errors.passwordConfirmation ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.passwordConfirmation && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.passwordConfirmation}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Zip Code
                </Label>
                <Input
                  id="zip_code"
                  type="text"
                  placeholder="12345"
                  value={formData.zip_code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))}
                  maxLength={10}
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    errors.zip_code ? "border-red-500" : ""
                  }`}
                />
                {errors.zip_code && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.zip_code}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupationStatus" className="text-sm font-medium text-gray-700 flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Current Status
                </Label>
                <select
                  id="occupationStatus"
                  value={formData.occupationStatus}
                  onChange={(e) => setFormData((prev) => ({ ...prev, occupationStatus: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B95D38] focus:ring-[#B95D38] bg-white ${
                    errors.occupationStatus ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Select your current status</option>
                  {occupationOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.occupationStatus && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.occupationStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Terms & Conditions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Terms and Conditions</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    <strong>1. Acceptance of Terms</strong>
                  </p>
                  <p>By creating an account, you agree to these terms and conditions.</p>

                  <p>
                    <strong>2. Data Collection and Use</strong>
                  </p>
                  <p>
                    We collect your personal information to provide personalized quiz results and film recommendations.
                    Your data will not be shared with third parties without your consent.
                  </p>

                  <p>
                    <strong>3. Quiz Results</strong>
                  </p>
                  <p>
                    The financial archetype quiz is for educational and entertainment purposes. Results should not be
                    considered professional financial advice.
                  </p>

                  <p>
                    <strong>4. Account Security</strong>
                  </p>
                  <p>You are responsible for maintaining the security of your account credentials.</p>

                  <p>
                    <strong>5. Content Usage</strong>
                  </p>
                  <p>All film content and quiz materials are protected by copyright. Personal use only.</p>

                  <p>
                    <strong>6. Privacy Policy</strong>
                  </p>
                  <p>We respect your privacy. See our full Privacy Policy for details on data handling.</p>

                  <p>
                    <strong>7. Changes to Terms</strong>
                  </p>
                  <p>We may update these terms periodically. Continued use constitutes acceptance of changes.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
                    className="mt-1"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed">
                    I have read and agree to the{" "}
                    <span className="text-[#B95D38] font-medium">Terms and Conditions</span> and{" "}
                    <span className="text-[#B95D38] font-medium">Privacy Policy</span>
                  </Label>
                </div>
                {errors.terms && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.terms}
                  </p>
                )}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Almost there!</strong> Once you create your account, you'll immediately take our financial
                  personality quiz to discover your archetype.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="border-gray-300 text-gray-700 hover:bg-[#B95D38]/10 bg-transparent"
              >
                Back
              </Button>
            )}

            <div className="flex-1" />

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6"
              >
                Next
              </Button>
            ) : (
              <Button
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
      </DialogContent>
    </Dialog>
  )
}
