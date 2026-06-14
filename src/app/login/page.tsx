import Link from "next/link";
import Card from "@/components/ui/Card";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-center">
        Welcome back to <span className="text-gradient">Ragebait</span>
      </h1>
      <p className="mt-2 text-center text-sm text-white/50">
        Log in with your username or email
      </p>

      <Card className="mt-8">
        <LoginForm />
      </Card>

      <p className="mt-6 text-center text-sm text-white/50">
        New to Ragebait?{" "}
        <Link href="/signup" className="text-aura-blue hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
