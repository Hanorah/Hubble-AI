import Image from "next/image";
import Link from "next/link";
import styles from "../hubble-design-landing.module.css";

const socialLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "GitHub", href: "https://github.com" },
];

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <Image src="/logo.png" alt="Hubble logo" width={150} height={52} className={styles.logo} />
      </div>
      <nav className={styles.footerSocial} aria-label="Hubble links">
        {socialLinks.map((social) => (
          <Link
            key={social.label}
            href={social.href}
            {...(social.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {social.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
