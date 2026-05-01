import Link from "next/link";
import styles from "../shardeum-landing.module.css";

export function ShardeumBucketCtasSection() {
  return (
    <section id="home-bucket-ctas" className={styles.section}>
      <h2>Bucket CTAs</h2>
      <div className={styles.cards2}>
        <article className={styles.card}>
          <h3>For Developers</h3>
          <p>Build linearly scalable dApps on Hubble.</p>
          <div className={styles.footerLinks}>
            <Link href="https://shardeum.org/developer/" target="_blank" rel="noreferrer">
              Developer Hub
            </Link>
          </div>
        </article>
        <article className={styles.card}>
          <h3>Sphinx Betanet</h3>
          <p>Hubble Sphinx (Betanet) is live.</p>
          <div className={styles.footerLinks}>
            <Link href="https://shardeum.org/betanet/" target="_blank" rel="noreferrer">
              Join Betanet
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
