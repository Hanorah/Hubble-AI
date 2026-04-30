"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./hubble-design-landing.module.css";

export default function HubbleDesignLanding() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.nav}>
          <Link href="/" className={styles.brand}>
            <Image src="/logo.png" alt="Hubble logo" width={150} height={52} className={styles.logo} priority />
          </Link>
          <nav className={styles.navLinks}>
            <a href="#how-it-works">How it works</a>
            <a href="#outputs">Outputs</a>
            <Link href="/templates">Templates</Link>
          </nav>
          <div className={styles.navActions}>
            <Link className={styles.btnGreen} href="/dashboard">
              Start now
            </Link>
            <Link className={styles.btnGhost} href="/login">
              Sign in
            </Link>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroGlowOne} />
          <div className={styles.heroGlowTwo} />
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>AI Scoping Workspace</p>
            <h1>
              Turn complex client ideas
              into clear project scope.
            </h1>
            <p className={styles.heroLead}>
              Hubble helps teams run smarter discovery, shape delivery with
              templates, and generate scope documents clients approve faster.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.btnGreen} href="/dashboard">
                Open dashboard
              </Link>
              <Link className={styles.btnWhite} href="/templates">
                Browse templates
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
              aria-label="Huly style background video"
            >
              <source src="/meeting.mp4" type="video/mp4" />
            </video>
            <div className={styles.heroBadge}>
              <span />
              AI brief transformed into scope
            </div>
          </div>
        </section>

        <section className={styles.problemStrip}>
          <p>
            Most teams lose time between discovery notes, scattered documents, and
            unclear effort estimates. Hubble puts the full scoping workflow in one
            place.
          </p>
        </section>

        <section id="how-it-works" className={styles.sectionTitle}>
          <p className={styles.eyebrow}>How It Works</p>
          <h2>A creative scoping flow your team can run every time</h2>
        </section>

        <section className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <p className={styles.stepNumber}>01</p>
            <h3>Capture discovery context</h3>
            <p>
              Run guided AI interviews and turn rough ideas into structured project
              requirements with fewer blind spots.
            </p>
          </article>
          <article className={styles.stepCard}>
            <p className={styles.stepNumber}>02</p>
            <h3>Shape scope with templates</h3>
            <p>
              Start from proven templates, adjust modules, and align timeline and
              effort to the actual brief.
            </p>
          </article>
          <article className={styles.stepCard}>
            <p className={styles.stepNumber}>03</p>
            <h3>Deliver client-ready outputs</h3>
            <p>
              Produce clear scope documents your team can execute and your client
              can approve with confidence.
            </p>
          </article>
        </section>

        <section className={styles.featureRow}>
          <div className={styles.featureText}>
            <p className={styles.eyebrow}>Why Teams Pick Hubble</p>
            <h3>Less back-and-forth. More confident decisions.</h3>
            <p>
              Hubble connects discovery, planning, and documentation in one
              workflow. That means fewer clarification loops and a faster path from
              first call to approved scope.
            </p>
            <Link className={styles.btnGhost} href="/dashboard">
              See workspace
            </Link>
          </div>
          <div className={styles.imageCard}>
            <video
              className={styles.imageMedia}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Clock themed planning video"
            >
              <source src="/clock.mp4" type="video/mp4" />
            </video>
            <div className={styles.floatingBadge}>
              <div className={styles.dot} />
              <div>
                <strong>Clear scope, fewer revisions</strong>
                <p>Shared context keeps clients and teams aligned</p>
              </div>
            </div>
          </div>
        </section>

        <section id="outputs" className={styles.outputsSection}>
          <div className={styles.sectionTitle}>
            <p className={styles.eyebrow}>What You Get</p>
            <h2>Everything needed to move from brief to delivery</h2>
          </div>
          <div className={styles.outputsGrid}>
            <article className={styles.outputCard}>
              <h3>Structured requirements</h3>
              <p>Discovery notes transformed into clear, actionable project context.</p>
            </article>
            <article className={styles.outputCard}>
              <h3>Template-driven scope plans</h3>
              <p>Fast starting point for common project types with editable modules.</p>
            </article>
            <article className={styles.outputCard}>
              <h3>Delivery-ready documents</h3>
              <p>Professional scope output your team can execute and track.</p>
            </article>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.darkSectionText}>
            <p className={styles.eyebrow}>Ready to Scope Better?</p>
            <h3>Use Hubble to turn every new brief into a clear delivery plan.</h3>
            <p>
              Start with a template or begin from scratch. Either way, your team
              gets a repeatable scoping process from day one.
            </p>
            <div className={styles.navActions}>
              <Link className={styles.btnWhite} href="/dashboard">
                Go to dashboard
              </Link>
              <Link className={styles.btnGhost} href="/templates">
                View templates
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
