"use client"

import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PrivacyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl bg-white text-gray-900 border-0 p-0 rounded-2xl shadow-2xl">
        <DialogDescription className="sr-only">
          Privacy Policy for Back Against The Wall quiz application
        </DialogDescription>
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4 sm:mb-6 md:mb-8">
              Privacy Policy
            </h1>
            
            <div className="prose max-w-none text-gray-700 space-y-4 sm:space-y-6">
              <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Information We Collect</h2>
                
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p>When you create an account, we may collect:</p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Email address</li>
                  <li>Username or display name</li>
                  <li>Password (encrypted)</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-4">Quiz Data</h3>
                <p>When you take quizzes, we collect:</p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Your quiz responses and answers</li>
                  <li>Quiz results and personality assessments</li>
                  <li>Completion timestamps</li>
                  <li>Quiz preferences and settings</li>
                </ul>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 mt-4">Technical Information</h3>
                <p>We automatically collect:</p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage patterns and analytics</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              <section className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc list-inside ml-2 sm:ml-4 mt-2 text-sm sm:text-base">
                  <li>Provide and maintain our quiz service</li>
                  <li>Create and manage your user account</li>
                  <li>Generate personalized quiz results</li>
                  <li>Improve our application and user experience</li>
                  <li>Send important service-related communications</li>
                  <li>Analyze usage patterns and trends</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
                <p>We do not sell, trade, or rent your personal information. We may share information in these limited circumstances:</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
                <p>We may share data with trusted third-party services that help us operate our application:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Database hosting (MongoDB)</li>
                  <li>Content management (Sanity CMS)</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Authentication services</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Legal Requirements</h3>
                <p>We may disclose information when required by law or to:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Comply with legal processes</li>
                  <li>Protect our rights and property</li>
                  <li>Ensure user safety</li>
                  <li>Investigate potential violations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
                <p>We implement appropriate security measures to protect your information:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Secure authentication and password hashing</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and monitoring</li>
                  <li>Secure hosting infrastructure</li>
                </ul>
                <p className="mt-2">
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights and Choices</h2>
                <p>You have the following rights regarding your personal information:</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access and Portability</h3>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Request a copy of your personal data</li>
                  <li>Export your quiz results and account data</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Correction and Updates</h3>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Update your profile information</li>
                  <li>Correct inaccurate data</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Deletion</h3>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Delete your account and associated data</li>
                  <li>Request removal of specific information</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Opt-out</h3>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Disable cookies (may affect functionality)</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Remember your login status</li>
                  <li>Save your quiz progress</li>
                  <li>Analyze site usage and performance</li>
                  <li>Personalize your experience</li>
                </ul>
                <p className="mt-2">
                  You can control cookies through your browser settings, but disabling them may affect site functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
                <p>We retain your information for as long as:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Your account remains active</li>
                  <li>Needed to provide our services</li>
                  <li>Required by law or for legitimate business purposes</li>
                  <li>Necessary to resolve disputes or enforce agreements</li>
                </ul>
                <p className="mt-2">
                  When you delete your account, we will remove your personal information within 30 days, except where retention is required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
                <p>
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or how we handle your data, please contact us through our application or website. We will respond to your inquiry within a reasonable timeframe.
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
