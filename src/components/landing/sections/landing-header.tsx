import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import styles from "../hubble-design-landing.module.css";

export function LandingHeader() {
  return (
    <header className={styles.nav}>
      <Link href="/" className={styles.brand}>
        <Image src="/logo.png" alt="Hubble logo" width={150} height={52} className={styles.logo} priority />
      </Link>
      <nav className={styles.navLinks}>
        <a href="#how-it-works">How it works</a>
        <a href="#why-hubble">Why Hubble</a>
        <a href="#outputs">Outputs</a>
        <a href="#get-started">Get started</a>
      </nav>
      <div className={styles.navActions}>
        <Link className={styles.btnGreen} href="/dashboard" aria-label="Start now">
          <ArrowRight className={styles.mobileIcon} aria-hidden="true" />
          <span className={styles.navActionText}>Start now</span>
        </Link>
        <Link className={styles.btnGhost} href="/login" aria-label="Sign in">
          <LogIn className={styles.mobileIcon} aria-hidden="true" />
          <span className={styles.navActionText}>Sign in</span>
        </Link>
      </div>
    </header>
  );
}
