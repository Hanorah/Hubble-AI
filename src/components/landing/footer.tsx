import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-base py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="size-4 text-white" aria-hidden />
            </span>
            Hubble
          </Link>
          <p className="mt-4 max-w-xs text-sm text-text-secondary">
            From idea to blueprint—structured scopes, realistic estimates, and stakeholder-ready
            exports.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/#features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">
                  Sign up
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-border/40 px-4 pt-8 text-center text-xs text-muted sm:px-6 sm:text-left">
        © {new Date().getFullYear()} Hubble. Built for founders and teams who ship.
      </div>
    </footer>
  );
}
