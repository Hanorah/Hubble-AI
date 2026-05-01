import Link from "next/link";
import styles from "../shardeum-landing.module.css";

export function ShardeumCalloutSection() {
  return (
    <section id="home-callout" className={styles.section}>
      <h2>Partner with us</h2>
      <p>Looking to collaborate, integrate, or educate? We would love to hear from you.</p>
      <div className={styles.footerLinks}>
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLScaqOXPiKTfVc7lyIh25_CFEfnqRZS19QBU0a59kxml6yEMLw/viewform"
          target="_blank"
          rel="noreferrer"
        >
          Become a partner
        </Link>
      </div>
    </section>
  );
}
