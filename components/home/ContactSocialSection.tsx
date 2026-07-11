import ContactForm from "@/components/ContactForm"
import SocialAndEvent from "@/components/SocialAndEvents"
import Footer from "@/components/Footer"

export default function ContactSocialSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <ContactForm />
            <SocialAndEvent />
          </div>
        </div>
        <Footer />
      </div>
    </section>
  )
}
