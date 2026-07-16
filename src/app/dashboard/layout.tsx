import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[var(--empyr-bg)] text-[var(--empyr-text)]">
      <header className="border-b border-stone-800/80 bg-stone-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/empyr-logo.png"
              alt="Empyr"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-base font-semibold tracking-tight">
              Empyr
            </span>
          </Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
