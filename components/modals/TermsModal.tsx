"use client"

import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl bg-white text-gray-900 border-0 p-0 rounded-2xl shadow-2xl">
        <DialogDescription className="sr-only">
          Terms and Conditions for Back Against The Wall quiz application
        </DialogDescription>
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4 sm:mb-6 md:mb-8">
              Terms and Conditions
            </h1>
            
            <div className="prose max-w-none text-gray-700 space-y-4 sm:space-y-6">
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Welcome to &ldquo;Back Against the Wall.&rdquo; These terms govern your use of our application and services.</p>
              <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Acceptance of Terms</h2>
                <p className="text-sm sm:text-base text-gray-600">By accessing or using &ldquo;Back Against the Wall&rdquo; (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service.</p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. Description of Service</h2>
                <p>
                  Back Against The Wall is an interactive quiz application that provides personality assessments and entertainment content related to the film "Back Against The Wall". The service includes quiz functionality, user accounts, and result sharing capabilities.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">3. User Accounts</h2>
                <p>
                  To access certain features of our Service, you may be required to create an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-6 sm:mb-8">
                <p className="text-sm sm:text-base text-gray-600">You may not use our service for any unlawful purpose or in any way that could damage, disable, overburden, or impair our service. You agree not to access our service using automated means (&ldquo;bots&rdquo;).</p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Impersonate any person or entity</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Upload or transmit malicious code</li>
                  <li>Harass, abuse, or harm other users</li>
                </ul>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Back Against The Wall and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">6. Privacy Policy</h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">7. Disclaimers</h2>
                <p>
                  The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law, this Company:
                </p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Excludes all representations and warranties relating to this Service</li>
                  <li>Excludes all liability for damages arising out of or in connection with your use of this Service</li>
                </ul>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">8. Limitation of Liability</h2>
                <p>
                  In no event shall Back Against The Wall, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">9. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">10. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">11. Contact Information</h2>
                <p>
                  If you have any questions about these Terms and Conditions, please contact us through our application or website.
                </p>
              </section>
            </div>

            <div className="flex justify-center pt-4 sm:pt-6 border-t border-gray-200">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-2xl transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
