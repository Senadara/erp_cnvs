import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const secret = process.env.AUTH_SECRET;
  const authReady = Boolean(secret && secret.length >= 16);
  return <LoginForm authReady={authReady} />;
}
