import styles from "../shardeum-landing.module.css";

const roadmap = [
  "2017-2021: consensus algorithm definition and scaling tests",
  "2022 Q1: initial prototype and foundation setup",
  "2022 Q2: Alphanet 1.0 launch",
  "2022 Q3: Alphanet 2.0 launch",
  "2022 Q4: Liberty 2.1 upgrade",
  "2023 Q1: Betanet launch",
  "2023 Q2: Betanet update and node reward policy",
  "2023 Q3/Q4: security, scalability, and feature completion",
  "2024 Q1: Mainnet and token generation event",
];

export function ShardeumRoadmapSection() {
  return (
    <section id="home-roadmap" className={styles.section}>
      <h2>Roadmap</h2>
      <ul className={styles.list}>
        {roadmap.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
