import styles from "../hubble-design-landing.module.css";

const outputs = [
  {
    title: "Shared project context",
    description: "Keep conversations, decisions, and docs organized in one source of truth.",
  },
  {
    title: "Clear plans and ownership",
    description: "Break work into actionable tasks with clear accountability across teams.",
  },
  {
    title: "Faster team delivery",
    description: "Reduce misalignment and ship with confidence using one collaboration space.",
  },
];

export function OutputsSection() {
  return (
    <section id="outputs" className={styles.outputsSection}>
      <div className={styles.sectionTitle}>
        <p className={styles.eyebrow}>What You Get</p>
        <h2>Hubble keeps your team focused and moving</h2>
      </div>
      <div className={styles.outputsGrid}>
        {outputs.map((output) => (
          <article key={output.title} className={styles.outputCard}>
            <h3>{output.title}</h3>
            <p>{output.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
