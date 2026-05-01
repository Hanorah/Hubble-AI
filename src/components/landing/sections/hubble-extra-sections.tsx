"use client";

import { useState } from "react";

const HOW_IT_WORKS_STEPS = [
  {
    id: "01",
    title: "Describe your idea",
    description:
      "Drop in a one-liner or a messy brain dump. Hubble asks the right follow-up questions to fill in the blanks.",
  },
  {
    id: "02",
    title: "Pick a template",
    description:
      "Choose from purpose-built templates — SaaS MVP, mobile app, marketplace, AI product — or let Hubble pick for you.",
  },
  {
    id: "03",
    title: "Get a ship-ready scope",
    description:
      "Hubble drafts a structured spec with goals, user stories, features, and acceptance criteria you can hand to your team.",
  },
];

const FEATURES = [
  {
    title: "AI-powered drafts",
    description:
      "Stop staring at the blank page. Hubble writes the first 80% so you can focus on the parts that matter.",
  },
  {
    title: "Real templates",
    description: "Battle-tested templates for the products people actually build — not generic checklists.",
  },
  {
    title: "Export anywhere",
    description:
      "Export to PRD, user stories, JSON, or paste straight into Notion, Jira, Linear, or your favorite tool.",
  },
  {
    title: "Built for clarity",
    description: "Every scope is structured, scannable, and unambiguous. No more 'wait, what does that mean?' meetings.",
  },
  {
    title: "Iterate in seconds",
    description: "Tweak goals, swap features, or change scope and Hubble re-syncs the rest of your spec for you.",
  },
  {
    title: "Smart defaults",
    description: "Hubble suggests sensible defaults for tech stack, UX patterns, and architecture you can keep or override.",
  },
];

const FAQS = [
  {
    q: "What is Hubble exactly?",
    a: "Hubble is an AI scoping assistant. You describe what you're building, pick a template, and Hubble writes a clear, structured product scope for you — the kind your team or agency can actually ship from.",
  },
  {
    q: "Who is Hubble for?",
    a: "Founders, product managers, and agencies who need to turn a fuzzy idea into a real spec — fast. If you've ever procrastinated writing a PRD, Hubble is for you.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "ChatGPT gives you a wall of text. Hubble gives you a structured product scope with the right sections, the right level of detail, and exports that drop straight into your workflow.",
  },
  {
    q: "Can I customize the templates?",
    a: "Yes. You can edit any template, save your own variants, and (soon) share team-wide templates with custom sections, prompts, and defaults.",
  },
  {
    q: "How long does it take to get a scope?",
    a: "Most scopes are ready in 2–5 minutes. You answer a few questions, review the draft, and either ship it or iterate.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — you can generate scopes for free to see if Hubble fits. Paid plans unlock more templates, exports, and team workspaces.",
  },
];

export function HubbleHowItWorksSection() {
  return (
    <section className="hubble-extra-section hubble-how-section">
      <div className="hubble-section-inner">
        <div className="hubble-section-head">
          <span className="hubble-section-eyebrow">How it works</span>
          <h2>Three steps to a scope you can actually ship</h2>
          <p>
            From rough idea to structured spec — Hubble handles the heavy lifting so you can move on to the building part.
          </p>
        </div>

        <div className="hubble-steps-grid">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <article key={step.id} className="hubble-step-card">
              <span className="hubble-step-num">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HubbleFeaturesSection() {
  return (
    <section className="hubble-extra-section hubble-features-section">
      <div className="hubble-section-inner">
        <div className="hubble-section-head">
          <span className="hubble-section-eyebrow">Why Hubble</span>
          <h2>Everything you need to scope a product, nothing you don't</h2>
          <p>
            A focused toolkit built around one job — getting your product idea out of your head and into a real, shippable plan.
          </p>
        </div>

        <div className="hubble-features-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="hubble-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HubbleTestimonialSection() {
  return (
    <section className="hubble-extra-section hubble-testimonial-section">
      <div className="hubble-section-inner">
        <blockquote className="hubble-quote">
          <span className="hubble-quote-mark" aria-hidden="true">
            “
          </span>
          <p>
            Hubble turned a 3-week scoping doc into a 20-minute conversation. Our team shipped the MVP a month earlier than planned.
          </p>
          <footer>
            <strong>Maya Chen</strong>
            <span>Founder, Linkjet</span>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

export function HubbleFaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="hubble-extra-section hubble-faq-section">
      <div className="hubble-section-inner">
        <div className="hubble-section-head">
          <span className="hubble-section-eyebrow">FAQ</span>
          <h2>Questions, answered</h2>
          <p>Everything else you might want to know before getting started.</p>
        </div>

        <div className="hubble-faq-list">
          {FAQS.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <button
                key={item.q}
                type="button"
                className={`hubble-faq-item ${open ? "is-open" : ""}`}
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
              >
                <span className="hubble-faq-q">
                  <span>{item.q}</span>
                  <span className="hubble-faq-toggle" aria-hidden="true">
                    {open ? "–" : "+"}
                  </span>
                </span>
                <span className="hubble-faq-a">{item.a}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HubbleFinalCtaSection() {
  return (
    <section className="hubble-extra-section hubble-final-cta-section">
      <div className="hubble-section-inner">
        <div className="hubble-final-cta-card">
          <span className="hubble-section-eyebrow inverted">Ready to scope it?</span>
          <h2>Stop staring at the blank page. Get a real scope in minutes.</h2>
          <p>Drop in your idea and let Hubble handle the rest.</p>
          <div className="hubble-final-cta-actions">
            <a href="/scope/new" className="hubble-cta-primary">
              Start scoping for free
            </a>
            <a href="/templates" className="hubble-cta-secondary">
              Browse templates
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
