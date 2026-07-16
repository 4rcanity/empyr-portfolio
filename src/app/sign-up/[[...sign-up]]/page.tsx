import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--empyr-bg)] px-6 py-16">
      <SignUp
        forceRedirectUrl="/dashboard"
        signInUrl="/sign-in"
        appearance={{
          variables: {
            colorPrimary: "#f97316",
            colorBackground: "#1c1917",
            colorText: "#f5f5f4",
            colorTextSecondary: "#a8a29e",
          },
        }}
      />
    </main>
  );
}
