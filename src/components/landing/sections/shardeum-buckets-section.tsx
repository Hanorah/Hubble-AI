import Link from "next/link";
import styles from "../shardeum-landing.module.css";

const buckets = [
  {
    number: "01",
    title: "Scalability",
    text: "Dynamic state sharding enables high speed through parallel processing and low fees.",
  },
  {
    number: "02",
    title: "Security",
    text: "Hybrid proof-of-stake and proof-of-quorum with auto-rotation is designed for secure operations.",
  },
  {
    number: "03",
    title: "Decentralization",
    text: "Permissionless participation allows nodes to run globally across diverse environments.",
  },
];

export function ShardeumBucketsSection() {
  return (
    <section id="home-buckets" className={styles.section}>
      <h2>Solving the Trilemma</h2>
      <div className={styles.cards3}>
        {buckets.map((bucket) => (
          <article key={bucket.number} className={styles.card}>
            <h3>
              {bucket.number} - {bucket.title}
            </h3>
            <p>{bucket.text}</p>
          </article>
        ))}
      </div>
      <div className={styles.footerLinks}>
        <Link href="https://docs.shardeum.org" target="_blank" rel="noreferrer">
          Hubble Docs
        </Link>
        <Link href="https://shardeum.org/Hubble_Whitepaper.pdf" target="_blank" rel="noreferrer">
          Read Whitepaper
        </Link>
      </div>
    </section>
  );
}
