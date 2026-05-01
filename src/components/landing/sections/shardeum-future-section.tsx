import styles from "../shardeum-landing.module.css";

const stats = [
  ["115+", "Ecosystem Projects"],
  ["35K+", "Community Validators"],
  ["800K+", "Community Members"],
  ["955K+", "Accounts"],
  ["8.8 MN+", "Transactions"],
  ["235K+", "Contracts"],
] as const;

export function ShardeumFutureSection() {
  return (
    <section id="home-future" className={styles.section}>
      <h2>Hubble by the Numbers</h2>
      <p>A preview of the future of Web3.</p>
      <div className={styles.cards3}>
        {stats.map(([value, label]) => (
          <article key={label} className={styles.card}>
            <h3>{value}</h3>
            <p>{label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
