import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--empyr-bg)] text-[var(--empyr-text)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-10rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-rose-500/10 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/empyr-logo.png"
            alt="Empyr"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">Empyr</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-full px-4 py-2 text-sm font-medium text-stone-200 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-orange-400"
          >
            Open dashboard
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-32 text-center">
        <span className="mb-6 rounded-full border border-stone-700/80 bg-stone-900/60 px-4 py-1 text-xs font-medium uppercase tracking-widest text-orange-400">
          AI-generated sites
        </span>

        <h1 className="text-4xl font-extrabold tracking-tight text-stone-50 sm:text-6xl">
          Describe your business.
          <br />
          Get a site in seconds.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-stone-400">
          Empyr turns a short prompt into a brand-ready layout — hero,
          features, and footer — so you can go from idea to live site without
          touching a design tool.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-orange-500 px-8 py-3 text-base font-semibold text-stone-950 shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
          >
            Start generating
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-stone-700 px-8 py-3 text-base font-semibold text-stone-200 transition hover:border-stone-500 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 py-8 text-center text-sm text-stone-500">
        &copy; {new Date().getFullYear()} Empyr. All rights reserved.
      </footer>
    </main>
  );
}
