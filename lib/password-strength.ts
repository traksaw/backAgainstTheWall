export function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++
  return strength
}

export function getPasswordStrengthLabel(strength: number): { label: string; color: string } {
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
