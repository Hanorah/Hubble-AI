"use client";

import Link from "next/link";
import styles from "./hubble-design-landing.module.css";
import { LandingHeader } from "./sections/landing-header";
import { HeroSection } from "./sections/hero-section";
import { HowItWorksSection } from "./sections/how-it-works-section";
import { OutputsSection } from "./sections/outputs-section";
import { LandingFooter } from "./sections/landing-footer";

export default function HubbleDesignLanding() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LandingHeader />

        <HeroSection />

        <HowItWorksSection />

        <section id="why-hubble" className={styles.featureRow}>
          <div className={styles.featureText}>
            <p className={styles.eyebrow}>Why Hubble</p>
            <h3>One workspace for product, design, and engineering teams</h3>
            <p>
              Hubble helps teams move from idea to execution without context loss. Discussions, tasks,
              timelines, and deliverables stay connected so everyone sees the same priorities.
            </p>
            <Link className={styles.btnGreen} href="/signup">
              Start your Hubble workspace
            </Link>
          </div>
          <div className={styles.imageCard}>
            <video className={styles.imageMedia} autoPlay muted loop playsInline preload="metadata">
              <source src="/meeting.mp4" type="video/mp4" />
            </video>
            <div className={styles.floatingBadge}>
              <span className={styles.dot} />
              <div>
                <strong>Clear team visibility</strong>
                <p>Track scope, owners, and delivery in one place.</p>
              </div>
            </div>
          </div>
        </section>

        <OutputsSection />

        <section id="get-started" className={styles.ctaSection}>
          <div className={styles.darkSectionText}>
            <p className={styles.eyebrow}>Built for Hubble teams</p>
            <h3>Replace scattered tools with one clear workflow</h3>
            <p>
              Use Hubble to define requirements, align stakeholders, and deliver faster with less
              back-and-forth. Your entire project lifecycle lives in one red-branded workspace.
            </p>
            <Link className={styles.btnWhite} href="/dashboard">
              Open Hubble dashboard
            </Link>
          </div>
        </section>

        <LandingFooter />
      </div>
    </main>
  );
}
