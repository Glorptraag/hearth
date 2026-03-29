import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-md">
      <div className="flex flex-col items-center gap-xl text-center">
        <h1 className="font-serif text-5xl font-bold text-text-primary tracking-[-0.02em]">
          Hearth
        </h1>
        <p className="font-serif text-lg text-text-secondary max-w-[320px] leading-relaxed">
          Learning made visible for homeschool families
        </p>
        <div className="flex flex-col items-center gap-md">
          <Link
            href="/sign-up"
            className="rounded-[6px] bg-ember px-lg py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="font-sans text-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
