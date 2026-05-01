import Link from "next/link";
import styles from "../shardeum-landing.module.css";

const navItems = [
  { label: "Developers", href: "https://shardeum.org/developer/" },
  { label: "Community", href: "https://shardeum.org/community/" },
  { label: "Resources", href: "https://shardeum.org/explore/faqs/general/" },
];

export function ShardeumHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        Hubble / Shardeum
      </Link>
      <nav className={styles.nav} aria-label="Shardeum navigation">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} target="_blank" rel="noreferrer">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
