import Link from "next/link";
import styles from "../hubble-design-landing.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroGlowOne} />
      <div className={styles.heroGlowTwo} />
      <div className={styles.heroText}>
        <p className={styles.eyebrow}>Hubble Workspace</p>
        <h1>
          Work in sync
          <br />
          with Hubble
        </h1>
        <p className={styles.heroLead}>
          Plan projects, align teams, and move delivery forward from one workspace built for modern
          collaboration.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.btnGreen} href="/dashboard">
            Open dashboard
          </Link>
          <Link className={styles.btnWhite} href="/signup">
            Create workspace
          </Link>
        </div>
      </div>
      <div className={styles.heroVisual}>
        <video
          className={styles.imageMedia}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Hubble meeting collaboration video"
        >
          <source src="/meeting.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroBadge}>
          <span />
          Live team collaboration in Hubble
        </div>
      </div>
    </section>
  );
}
