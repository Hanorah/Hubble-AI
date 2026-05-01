import styles from "../shardeum-landing.module.css";

export function ShardeumHeroSection() {
  return (
    <section id="home-hero" className={`${styles.section} ${styles.hero}`}>
      <div>
        <h2>Work in sync with Hubble</h2>
        <p>
          Hubble brings chat, planning, and execution into one workspace so your team can ship with
          less friction.
        </p>
      </div>
      <div>
        <video autoPlay muted loop playsInline controls>
          <source src="/meeting.mp4" type="video/mp4" />
        </video>
      </div>
    </section>
  );
}
