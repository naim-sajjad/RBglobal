import LoginForm from "@/components/login/login-form"

export const metadata = {
  title: "Login - GenNextGlobalTech",
  description: "Login to your GenNextGlobalTech account to access job listings, manage applications, and connect with employers.",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <LoginForm />
    </main>
  )
}
