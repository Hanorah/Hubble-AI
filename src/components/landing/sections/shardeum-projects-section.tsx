import Link from "next/link";
import styles from "../shardeum-landing.module.css";

const projects = [
  { name: "Axelar", summary: "Interoperability layer for Web3 applications." },
  { name: "OKX Wallet", summary: "Multi-platform wallet for tokens, NFTs, and dApps." },
  { name: "Swapped Finance", summary: "State-sharded AMM built for scalable trading." },
  { name: "Bandit Network", summary: "NFT infrastructure and distribution tooling." },
];

export function ShardeumProjectsSection() {
  return (
    <section id="home-projects" className={styles.section}>
      <h2>Projects and Ecosystem</h2>
      <p>Featured ecosystem projects from the Shardeum website section.</p>
      <div className={styles.cards2}>
        {projects.map((project) => (
          <article key={project.name} className={styles.card}>
            <h3>{project.name}</h3>
            <p>{project.summary}</p>
          </article>
        ))}
      </div>
      <div className={styles.footerLinks}>
        <Link href="https://shardeum.org/ecosystem/" target="_blank" rel="noreferrer">
          Explore the ecosystem
        </Link>
      </div>
    </section>
  );
}
