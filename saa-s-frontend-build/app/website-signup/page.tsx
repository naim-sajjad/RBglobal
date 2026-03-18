import type { Metadata } from "next"
import SignupForm from "@/components/signup/signup-form"

export const metadata: Metadata = {
  title: "Register Account | GenNextGlobalTech",
  description:
    "Create your GenNextGlobalTech account as a Candidate or Employer. Join our platform to find your next career opportunity.",
}

export default function SignupPage() {
  return <SignupForm />
}
