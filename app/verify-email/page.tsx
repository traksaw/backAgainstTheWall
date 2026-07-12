import { Suspense } from "react"
import { VerifyEmailStatus } from "./VerifyEmailStatus"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  )
}
