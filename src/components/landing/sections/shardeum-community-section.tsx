import Link from "next/link";
import styles from "../shardeum-landing.module.css";

export function ShardeumCommunitySection() {
  return (
    <section id="home-community" className={styles.section}>
      <h2>Community Drives Hubble</h2>
      <p>Hubble is supported, operated, and built by a global community.</p>
      <div className={styles.footerLinks}>
        <Link href="https://shardeum.org/community/" target="_blank" rel="noreferrer">
          Find your tribe
        </Link>
        <Link href="https://discord.com/invite/shardeum" target="_blank" rel="noreferrer">
          Join Discord
        </Link>
      </div>
    </section>
  );
}
