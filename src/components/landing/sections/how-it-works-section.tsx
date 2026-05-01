import styles from "../hubble-design-landing.module.css";

const steps = [
  {
    id: "01",
    title: "Capture the plan",
    description:
      "Collect requirements, notes, and decisions in one place so the full team shares the same context.",
  },
  {
    id: "02",
    title: "Align execution",
    description:
      "Turn ideas into clear tasks, ownership, and timelines your team can actually deliver against.",
  },
  {
    id: "03",
    title: "Ship with clarity",
    description:
      "Keep updates, blockers, and outcomes visible so projects move faster with fewer status meetings.",
  },
];

export function HowItWorksSection() {
  return (
    <>
      <section id="how-it-works" className={styles.sectionTitle}>
        <p className={styles.eyebrow}>How It Works</p>
        <h2>Everything your team needs in one Hubble workflow</h2>
      </section>

      <section className={styles.stepsGrid}>
        {steps.map((step) => (
          <article key={step.id} className={styles.stepCard}>
            <p className={styles.stepNumber}>{step.id}</p>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </section>
    </>
  );
}
