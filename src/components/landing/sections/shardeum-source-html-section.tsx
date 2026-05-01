"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ShardeumSourceHtmlSectionProps = {
  selector: string;
  onReady?: (hasMarkup: boolean) => void;
};

const htmlCache = new Map<string, string>();
let htmlPromise: Promise<string> | null = null;
let shardeumAssetsInjected = false;

function mapToHubbleHref(rawHref: string): string {
  const href = rawHref.toLowerCase();

  if (
    href.includes("docs.shardeum.org") ||
    href.includes("/developer") ||
    href.includes("whitepaper") ||
    href.includes("tokenomics")
  ) {
    return "/templates";
  }

  if (href.includes("betanet") || href.includes("faucet") || href.includes("roadmap")) {
    return "/scope/new";
  }

  if (
    href.includes("discord") ||
    href.includes("twitter.com/shardeum") ||
    href.includes("telegram.me/shardeum") ||
    href.includes("reddit.com/r/shardeum") ||
    href.includes("github.com/shardeum") ||
    href.includes("gitlab.com/shardeum") ||
    href.includes("community")
  ) {
    return "/dashboard";
  }

  if (
    href.includes("shardeum.org") ||
    href.includes("shardeumfoundation") ||
    href.includes("careers.shardeum.org") ||
    href.includes("notion.so/shardeumfoundation")
  ) {
    return "/dashboard";
  }

  return rawHref;
}

function replaceBrandText(input: string): string {
  return input.replace(/Shardeum/g, "Hubble").replace(/shardeum/g, "hubble");
}

function buildCtaInnerHtml(text: string): string {
  return (
    `<span class="cta-txt">${text}</span>` +
    `<span class="cta-arr"><span class="arr"><div class="arr-img">` +
    `<img src="/html/img/global/chevron-blue.svg" alt="">` +
    `</div></span></span>`
  );
}

function ensureCtaButtonInner(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("a.cta-btn.split, button.cta-btn.split").forEach((cta) => {
    if (cta.querySelector(".cta-txt")) return;
    const text = cta.getAttribute("data-text") || cta.textContent?.trim() || "";
    cta.innerHTML = buildCtaInnerHtml(text);
  });
}

function normalizeSectionMarkup(section: Element, selector: string): string {
  const textWalker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    textNode.textContent = replaceBrandText(textNode.textContent ?? "");
    textNode = textWalker.nextNode();
  }

  section.querySelectorAll("[alt], [title], [aria-label], [data-text]").forEach((el) => {
    ["alt", "title", "aria-label", "data-text"].forEach((attr) => {
      const value = el.getAttribute(attr);
      if (value) {
        el.setAttribute(attr, replaceBrandText(value));
      }
    });
  });

  section.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href) return;

    const mappedHref = mapToHubbleHref(href);
    if (mappedHref !== href) {
      anchor.setAttribute("href", mappedHref);
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  });

  // Ensure lazy-loaded images always render in the imported static sections.
  section.querySelectorAll("img[data-src]").forEach((img) => {
    const dataSrc = img.getAttribute("data-src");
    if (!dataSrc) return;
    img.setAttribute("src", dataSrc);
    img.removeAttribute("data-src");
    img.classList.remove("lazy-load");
  });

  if (selector === "#globalHeader") {
    return "";
  }

  if (selector === "#globalMenu") {
    const logoImg = section.querySelector(".logo-main img");
    if (logoImg) {
      logoImg.setAttribute("src", "/logo.png");
      logoImg.setAttribute("alt", "Hubble logo");
      logoImg.setAttribute("style", "height: 100%; width: auto; object-fit: contain;");
    }

    // Keep logo/hamburger and replace menu with app links.
    const menuInner = section.querySelector(".menu-inner");
    if (menuInner) {
      menuInner.innerHTML = `
        <div>
          <nav class="main-menu hubble-main-menu">
            <ul class="top">
              <li class="anim"><a href="/dashboard">Dashboard</a></li>
              <li class="anim"><a href="/templates">Templates</a></li>
              <li class="anim"><a href="/scope/new">Start Scope</a></li>
              <li class="anim"><a href="/privacy">Privacy</a></li>
            </ul>
          </nav>
        </div>
      `;
    }

    const menuWrap = section.querySelector(".menu-wrap");
    if (menuWrap) {
      menuWrap.setAttribute("style", "transform: scale(1); opacity: 1;");
    }

    // Prevent logo clipping/reduction on sticky scroll state.
    const logoContainer = section.querySelector(".logo-main");
    if (logoContainer) {
      logoContainer.setAttribute("style", "height: 58px; background: transparent;");
    }
    const logoClip = section.querySelector(".logo-main .cp");
    if (logoClip) {
      logoClip.setAttribute("style", "clip-path: inset(0 0 0 0);");
    }
    const logoLink = section.querySelector(".logo-main a");
    if (logoLink) {
      logoLink.setAttribute("style", "width: 100%; pointer-events: all;");
    }

    const menuWrapEl = section.querySelector(".menu-wrap");
    if (menuWrapEl) {
      const overrideStyle = document.createElement("style");
      overrideStyle.textContent = `
        #globalMenu .logo-main:before { display: none !important; opacity: 0 !important; }
        #globalMenu {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        #globalMenu:after {
          content: "" !important;
          position: absolute !important;
          left: 156px !important;
          right: 156px !important;
          top: 40px !important;
          height: 76px !important;
          background: rgba(255, 255, 255, 0.72) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14) !important;
          backdrop-filter: blur(14px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(140%) !important;
          border-radius: 32px !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }
        #globalMenu .logo-main,
        #globalMenu .menu-wrap,
        #globalMenu .side-menu {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          z-index: 1 !important;
        }
        #globalMenu .logo-main {
          left: 166px !important;
          top: 49px !important;
          height: 58px !important;
        }
        #globalMenu .menu-wrap {
          right: 166px !important;
          top: 49px !important;
          width: 58px !important;
          height: 58px !important;
        }
        #globalMenu .menu-btn {
          width: 58px !important;
          height: 58px !important;
        }
        #globalMenu .menu-btn .inner { background-color: #c2383a !important; }
        #globalMenu .menu-btn .menu-line { background-color: #ffffff !important; }
        #globalMenu .hubble-main-menu a {
          color: #000 !important;
          text-decoration: none !important;
          font-weight: 600 !important;
        }
        #globalMenu .menu-inner {
          background: rgba(255, 255, 255, 0.96) !important;
          border: 1px solid rgba(0, 0, 0, 0.12) !important;
          border-radius: 18px !important;
          padding: 14px 16px !important;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.14) !important;
          backdrop-filter: blur(6px) !important;
          -webkit-backdrop-filter: blur(6px) !important;
        }
        #globalMenu .hubble-main-menu a:hover {
          color: #c2383a !important;
        }
        #globalMenu .side-menu .cta-btn.split .cta-txt,
        #globalMenu .side-menu .cta-btn.split .cta-arr,
        #globalMenu .side-menu .cta-btn:not(.off) { background-color: #c2383a !important; color: #fff !important; }
        @media screen and (max-width: 1200px) {
          #globalMenu:after {
            left: 86px !important;
            right: 86px !important;
            top: 34px !important;
            height: 72px !important;
            border-radius: 28px !important;
          }
          #globalMenu .logo-main {
            left: 96px !important;
            top: 40px !important;
            height: 54px !important;
          }
          #globalMenu .menu-wrap {
            right: 96px !important;
            top: 40px !important;
            width: 54px !important;
            height: 54px !important;
          }
          #globalMenu .menu-btn {
            width: 54px !important;
            height: 54px !important;
          }
        }
        @media screen and (max-width: 767px) {
          #globalMenu:after {
            left: 14px !important;
            right: 14px !important;
            top: 12px !important;
            height: 56px !important;
            border-radius: 22px !important;
          }
          #globalMenu .logo-main {
            left: 22px !important;
            top: 16px !important;
            height: 40px !important;
          }
          #globalMenu .menu-wrap {
            right: 22px !important;
            top: 16px !important;
            width: 40px !important;
            height: 40px !important;
          }
          #globalMenu .menu-btn {
            width: 40px !important;
            height: 40px !important;
            border-radius: 14px !important;
          }
          #globalMenu .menu-btn {
            padding: 7px !important;
            margin: 0 !important;
          }
        }
      `;
      menuWrapEl.appendChild(overrideStyle);
    }

    const menuButton = section.querySelector(".menu-btn");
    if (menuButton) {
      menuButton.setAttribute("aria-label", "Hubble menu");
      menuButton.setAttribute("title", "Hubble menu");
    }
  }

  if (selector === "#home-hero") {
    section.setAttribute("style", "padding-top: 0px; padding-bottom: 0px; background: #fff; position: relative;");

    if (!section.querySelector(".hubble-hero-grid-bg")) {
      const gridBg = document.createElement("div");
      gridBg.className = "hubble-hero-grid-bg";
      gridBg.setAttribute("aria-hidden", "true");
      section.insertBefore(gridBg, section.firstChild);
    }

    const heroWrap = section.querySelector(".max-wrap.pad-wrap");
    if (heroWrap) {
      heroWrap.setAttribute("style", " padding-bottom: 0px; padding-left: 10px; padding-right: 10px; position: relative; z-index: 2;");
    }

    const heroLayout = section.querySelector(".hero-layout");
    if (heroLayout) {
      heroLayout.setAttribute(
        "style",
        "display:flex;flex-direction:column;flex-wrap:nowrap;align-items:center;justify-content:center;gap:0;"
      );
    }

    const heroText = section.querySelector(".hero-text");
    if (heroText) {
      heroText.setAttribute("style", "order:1;flex:0 1 900px;width:100%;max-width:900px;margin:0 auto;text-align:center;");
    }

    const heroHeader = section.querySelector(".hero-text header");
    if (heroHeader) {
      heroHeader.setAttribute("style", "margin-top: 0;");
    }

    const heroHeading = section.querySelector(".hero-text h1.big");
    if (heroHeading) {
      heroHeading.textContent = "Hubble AI, your better product assistant";
      heroHeading.setAttribute("style", "font-size: clamp(54px, 7.6vw, 92px); line-height: 1.02; margin: 0 0 32px 0; color: #000;");
    }

    const heroParagraph = section.querySelector(".hero-text p");
    if (heroParagraph) {
      heroParagraph.textContent =
        "Hubble is your AI scoping assistant. Turn rough ideas into clear, structured product specs your team can actually ship.";
      heroParagraph.setAttribute("style", "font-size: 24px; line-height: 1.32; margin: 0 auto; color: #333; max-width: 680px;");

      if (!section.querySelector(".hero-text .hubble-hero-cta")) {
        const ctaWrap = document.createElement("div");
        ctaWrap.className = "hubble-hero-cta-wrap";
        ctaWrap.setAttribute("style", "display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:14px;margin-top:28px;");

        const cta = document.createElement("a");
        cta.className = "cta-btn split has-arr hubble-hero-cta";
        cta.setAttribute("href", "/scope/new");
        cta.setAttribute("data-text", "Start scoping");
        cta.textContent = "Start scoping";
        cta.setAttribute("style", "display:inline-flex;color:#fff;");
        ctaWrap.appendChild(cta);

        const secondary = document.createElement("a");
        secondary.className = "hubble-hero-secondary";
        secondary.setAttribute("href", "/templates");
        secondary.textContent = "Browse templates →";
        ctaWrap.appendChild(secondary);

        heroParagraph.insertAdjacentElement("afterend", ctaWrap);
      }

    }

    const heroVideo = section.querySelector(".hero-video");
    if (heroVideo) {
      heroVideo.remove();
    }

    if (!section.querySelector("style[data-hubble-hero-btn='true']")) {
      const heroStyle = document.createElement("style");
      heroStyle.setAttribute("data-hubble-hero-btn", "true");
      heroStyle.textContent = `
        #home-hero {
          overflow: hidden;
          position: relative;
          padding-top: 54px !important;
        }
        #home-hero .hubble-hero-grid-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-color: #fff;
          background-image:
            linear-gradient(rgba(15, 15, 15, 0.075) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 15, 15, 0.075) 1px, transparent 1px);
          background-size: 56px 56px;
          background-position: -1px -1px;
          mask-image: radial-gradient(ellipse 90% 70% at 50% 38%, #000 35%, transparent 78%);
          -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 38%, #000 35%, transparent 78%);
        }
        #home-hero .hubble-hero-grid-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 18% 22%, rgba(194, 56, 58, 0.18), transparent 42%),
            radial-gradient(circle at 84% 28%, rgba(194, 56, 58, 0.14), transparent 46%);
        }
        #home-hero .hubble-hero-secondary {
          color: #000;
          font-weight: 600;
          font-size: clamp(15px, 1.8vw, 17px);
          text-decoration: none;
          padding: 8px 14px;
          border-bottom: 2px solid #000;
        }
        #home-hero .hubble-hero-secondary:hover {
          color: #c2383a;
          border-color: #c2383a;
        }
        #home-hero .max-wrap.pad-wrap {
          padding-left: clamp(14px, 4vw, 28px) !important;
          padding-right: clamp(14px, 4vw, 28px) !important;
          padding-bottom: 0 !important;
        }
        #home-hero .hero-layout {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }
        #home-hero .hero-text h1.big {
          font-size: clamp(44px, 7vw, 88px) !important;
          line-height: 1.02 !important;
          margin: 0 0 32px 0 !important;
          word-break: break-word;
          letter-spacing: -0.025em;
        }
        #home-hero .hero-text {
          max-width: 900px !important;
          margin: 0 auto !important;
        }
        #home-hero .hero-text h1.big {
          max-width: 880px;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        #home-hero .hero-text h1.big .hl,
        #home-hero .hero-text h1.big .highlight,
        #home-hero .hero-text h1.big .blue,
        #home-hero .hero-text h1.big .green,
        #home-hero .hero-text h1.big [class*="blue"],
        #home-hero .hero-text h1.big [class*="green"],
        #home-hero .hero-text h1.big [class*="aqua"] {
          color: #c2383a !important;
        }
        #home-hero .hero-text p {
          font-size: clamp(16px, 2.2vw, 22px) !important;
          line-height: 1.35 !important;
          max-width: 680px !important;
          margin: 0 auto !important;
          color: #444 !important;
        }
        #home-hero .hubble-hero-cta {
          border-color: #000 !important;
          margin-top: 0 !important;
          min-height: 52px !important;
        }
        #home-hero .hubble-hero-cta .cta-txt {
          background-color: #c2383a !important;
          color: #fff !important;
          border-color: #000 !important;
          font-size: clamp(14px, 1.4vw, 17px) !important;
          font-weight: 600 !important;
          line-height: 1 !important;
          min-height: 52px !important;
          padding: 10px 14px 8px !important;
        }
        #home-hero .hubble-hero-cta.has-arr {
          padding-right: 56px !important;
        }
        #home-hero .hubble-hero-cta .cta-arr {
          background-color: #fff !important;
          color: #000 !important;
          border-color: #000 !important;
          padding: 8px !important;
        }
        #home-hero .hubble-hero-cta .arr {
          background-color: #000 !important;
          width: 28px !important;
          height: 28px !important;
          margin-top: -9px !important;
        }
        #home-hero .hubble-hero-cta .arr .arr-img .icon,
        #home-hero .hubble-hero-cta .arr .arr-img img {
          color: #000 !important;
        }
        #home-hero .hubble-hero-cta .arr .arr-img img {
          filter: brightness(0) invert(1) !important;
        }
        #home-hero .hubble-hero-cta:hover .cta-arr {
          border-left-color: #000 !important;
        }
        @media screen and (max-width: 1024px) {
          #home-hero {
            padding-bottom: 0 !important;
            padding-top: 64px !important;
          }
          #home-hero .hero-text {
            max-width: 100% !important;
          }
        }
        @media screen and (max-width: 767px) {
          #home-hero {
            padding-top: 110px !important;
            padding-bottom: 0 !important;
          }
          #home-hero .hubble-hero-grid-bg {
            background-size: 36px 36px;
          }
          #home-hero .hero-layout {
            flex-direction: column !important;
          }
          #home-hero .hero-text {
            flex: 1 1 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            text-align: center !important;
          }
          #home-hero .hero-text h1.big {
            font-size: clamp(40px, 12vw, 60px) !important;
            line-height: 0.98 !important;
            margin-bottom: 10px !important;
          }
          #home-hero .hero-text p {
            font-size: clamp(15px, 4.4vw, 18px) !important;
            line-height: 1.35 !important;
            max-width: 94% !important;
          }
          #home-hero .hubble-hero-cta-wrap {
            margin-top: 22px !important;
            gap: 10px !important;
          }
          #home-hero .hubble-hero-cta {
            width: auto !important;
            max-width: 100% !important;
            display: inline-flex !important;
            justify-content: center !important;
            margin-top: 16px !important;
          }
          #home-hero .hubble-hero-cta .cta-txt {
            min-height: 56px !important;
            font-size: clamp(16px, 4.4vw, 20px) !important;
            padding: 12px 18px 10px !important;
            border-top-left-radius: 18px !important;
            border-bottom-left-radius: 18px !important;
          }
          #home-hero .hubble-hero-cta .cta-arr {
            min-height: 56px !important;
            padding: 10px !important;
            border-top-right-radius: 18px !important;
            border-bottom-right-radius: 18px !important;
            border-left-color: #000 !important;
            border-left-width: 2px !important;
          }
          #home-hero .hubble-hero-cta .arr {
            width: 30px !important;
            height: 30px !important;
            margin-top: -9px !important;
            right: 10px !important;
            border-radius: 999px !important;
          }
        }
      `;
      section.appendChild(heroStyle);
    }
  }

  if (selector === "#home-buckets") {
    section.setAttribute("style", "background: #fff;");
    const header = section.querySelector("header");
    if (header) {
      header.setAttribute("style", "opacity:1; visibility:visible; transform:none;");
      const heading = header.querySelector("h2");
      if (heading) {
        heading.textContent = "Why Hubble";
      }
    }
    const buckets = section.querySelector(".buckets");
    if (buckets) {
      buckets.setAttribute("style", "opacity:1; visibility:visible; transform:none;");
    }
    section.querySelectorAll(".bucket, .bucket .card-wrap, .cta-group").forEach((el) => {
      (el as HTMLElement).setAttribute("style", "opacity:1; visibility:visible; transform:none;");
    });

    const bucketCards = section.querySelectorAll(".bucket .card-wrap");
    const bucketTitles = section.querySelectorAll(".bucket h3");
    const bucketParagraphs = section.querySelectorAll(".bucket p");

    if (bucketTitles[0]) bucketTitles[0].textContent = "Hubble Scalability";
    if (bucketTitles[1]) bucketTitles[1].textContent = "Hubble Security";
    if (bucketTitles[2]) bucketTitles[2].textContent = "Hubble Decentralization";

    if (bucketParagraphs[0]) {
      bucketParagraphs[0].textContent =
        "Thanks to dynamic state sharding, Hubble reaches consensus at the transaction level for parallel processing, high speed, and low fees.";
    }
    if (bucketParagraphs[1]) {
      bucketParagraphs[1].textContent =
        "Hubble combines proof-of-stake and proof-of-quorum consensus with auto-rotation, keeping security at every layer of the network.";
    }
    if (bucketParagraphs[2]) {
      bucketParagraphs[2].textContent =
        "Hubble is permissionless and community-run, allowing node operators from anywhere to contribute TPS and participate regardless of background.";
    }

    if (bucketCards[0]) {
      (bucketCards[0] as HTMLElement).setAttribute(
        "style",
        "opacity:1; visibility:visible; transform:none; background:#c2383a; border:2px solid #c2383a; color:#111;"
      );
    }
    if (bucketCards[1]) {
      (bucketCards[1] as HTMLElement).setAttribute(
        "style",
        "opacity:1; visibility:visible; transform:none; background:#fff; border:2px solid #c2383a; color:#111;"
      );
    }
    if (bucketCards[2]) {
      (bucketCards[2] as HTMLElement).setAttribute(
        "style",
        "opacity:1; visibility:visible; transform:none; background:#c2383a; border:2px solid #c2383a; color:#111;"
      );
    }

    section.querySelectorAll(".bucket .num").forEach((el, idx) => {
      const numberStyle =
        idx === 1
          ? "background:#fff; color:#c2383a; border:2px solid #c2383a;"
          : "background:#c2383a; color:#111; border:2px solid #fff;";
      (el as HTMLElement).setAttribute("style", numberStyle);
      el.classList.remove("pinkbg", "greenbg", "aquabg");
    });

    if (bucketCards[0]) {
      bucketCards[0].querySelectorAll("h3, p").forEach((el) => ((el as HTMLElement).style.color = "#111"));
    }
    if (bucketCards[1]) {
      bucketCards[1].querySelectorAll("h3, p").forEach((el) => ((el as HTMLElement).style.color = "#111"));
    }
    if (bucketCards[2]) {
      bucketCards[2].querySelectorAll("h3, p").forEach((el) => ((el as HTMLElement).style.color = "#111"));
    }
  }

  if (selector === "#home-projects") {
    section.setAttribute("style", "background:#c2383a; border-radius:28px;");
    const projectCount = section.querySelector(".project-count");
    if (projectCount) projectCount.remove();
    const projectsHeader = section.querySelector(".projects-header");
    if (projectsHeader) projectsHeader.remove();
    const globeIcon = section.querySelector(".globe");
    if (globeIcon) globeIcon.remove();

    const headerEl = section.querySelector("header");
    if (headerEl && !section.querySelector(".hubble-projects-title")) {
      const titleWrap = document.createElement("div");
      titleWrap.className = "hubble-projects-title";
      titleWrap.innerHTML = `
        <p class="hubble-projects-eyebrow">Templates</p>
        <h2>Start from a proven scope template</h2>
        <p class="hubble-projects-sub">Hand-crafted scoping templates for the products you'll actually build. Pick one and Hubble will fill in the details with you.</p>
      `;
      headerEl.insertBefore(titleWrap, headerEl.firstChild);
    }

    const exploreCta = section.querySelector('a.cta-btn[href*="ecosystem"], a.cta-btn[data-text*="Ecosystem" i], a.cta-btn[data-text*="ecosystem" i]');
    if (exploreCta) {
      exploreCta.setAttribute("href", "/templates");
      exploreCta.setAttribute("data-text", "Explore all templates");
      exploreCta.classList.add("hubble-explore-cta");
    }

    const projectMods = section.querySelector(".project-mods");
    if (projectMods) {
      projectMods.setAttribute("data-gaps", "24,14,10");
      projectMods.setAttribute("data-max", "1200");
      projectMods.setAttribute("data-swipe-max", "1200");
      projectMods.classList.add("hubble-project-scroller");
    }

    const projectCards = section.querySelectorAll(".project-mod");
    const hubbleCardContent = [
      {
        title: "SaaS MVP Scope",
        description:
          "From idea to a launch-ready spec — auth, billing, core flows, and a focused MVP feature set in one click.",
        tags: ["SaaS", "MVP", "Web app"],
      },
      {
        title: "Mobile App Scope",
        description:
          "Native iOS / Android scope with screens, user stories, and a build-ready feature breakdown your team can ship.",
        tags: ["iOS", "Android", "User stories"],
      },
      {
        title: "Marketplace Scope",
        description:
          "Two-sided marketplace blueprint — supply, demand, payments, and trust flows, mapped end-to-end.",
        tags: ["Marketplace", "Payments", "Trust"],
      },
      {
        title: "AI Product Scope",
        description:
          "Wrap an AI feature into a real product — model use cases, eval plan, UX, and a pragmatic go-to-market scope.",
        tags: ["AI", "LLM", "GTM"],
      },
    ];

    projectCards.forEach((card, idx) => {
      const logo = card.querySelector(".mod-logo");
      if (logo) logo.remove();

      const title = card.querySelector(".txt p strong");
      if (title) title.textContent = hubbleCardContent[idx]?.title ?? "Hubble Scope";

      const paragraphs = card.querySelectorAll(".txt p");
      if (paragraphs[1]) {
        paragraphs[1].textContent =
          hubbleCardContent[idx]?.description ?? "A reusable scoping template for your next product.";
      }

      const tagsContainer = card.querySelector(".tags");
      if (tagsContainer) {
        const tags = hubbleCardContent[idx]?.tags ?? [];
        tagsContainer.innerHTML = tags
          .map((t) => `<a href="/templates" class="tag">${t}</a>`)
          .join("");
      }

      const fullLink = card.querySelector("a.full");
      if (fullLink) {
        fullLink.setAttribute("href", "/templates");
        fullLink.removeAttribute("target");
        fullLink.removeAttribute("rel");
      }
    });

    const slideArrowsContainer = section.querySelector(".slide-arrows");
    if (slideArrowsContainer) {
      slideArrowsContainer.classList.remove("mob");
      slideArrowsContainer.classList.add("hubble-slide-arrows");
    }

    if (!section.querySelector("style[data-hubble-projects='true']")) {
      const projectStyle = document.createElement("style");
      projectStyle.setAttribute("data-hubble-projects", "true");
      projectStyle.textContent = `
        #home-projects {
          background: #c2383a !important;
          color: #111 !important;
        }
        #home-projects .hubble-projects-title {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 24px;
          padding: 0 16px;
          color: #fff;
        }
        #home-projects .hubble-projects-title h2 {
          font-size: clamp(34px, 5.4vw, 64px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 6px 0 14px;
          color: #fff !important;
        }
        #home-projects .hubble-projects-eyebrow {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }
        #home-projects .hubble-projects-sub {
          font-size: clamp(15px, 1.8vw, 18px);
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.88);
          margin: 0 auto;
          max-width: 620px;
        }
        #home-projects .project-mods.hubble-project-scroller {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-snap-type: x mandatory;
          scroll-padding-left: clamp(20px, 4vw, 56px);
          scroll-padding-right: clamp(20px, 4vw, 56px);
          gap: 24px;
          width: 100% !important;
          min-width: 0 !important;
          padding: 8px clamp(20px, 4vw, 56px) 28px;
          margin: 0 !important;
          transform: none !important;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        #home-projects .project-mods.hubble-project-scroller::-webkit-scrollbar {
          display: none;
        }
        #home-projects .project-mods.hubble-project-scroller {
          scrollbar-width: none;
        }
        #home-projects .project-mods.hubble-project-scroller .project-mod {
          flex: 0 0 auto !important;
          width: 360px !important;
          scroll-snap-align: start;
          background: #fff;
          border-radius: 22px;
          border: 2px solid #111;
          box-shadow: 6px 8px 0 0 rgba(0, 0, 0, 0.18);
          transform: none !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        #home-projects .project-mod .inner {
          min-height: 300px !important;
          padding: 26px 22px 18px !important;
          background: transparent !important;
          border-radius: 22px;
        }
        #home-projects .project-mod,
        #home-projects .project-mod * {
          color: #111 !important;
        }
        #home-projects .project-mod p strong {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        #home-projects .project-mod .tags {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        #home-projects .project-mod .tag {
          background: rgba(194, 56, 58, 0.1);
          border: 1px solid rgba(194, 56, 58, 0.3);
          color: #c2383a !important;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
        }
        #home-projects .project-mod .arrow {
          background: #c2383a !important;
        }
        #home-projects .project-mod .arrow img {
          filter: brightness(0) invert(1);
        }
        #home-projects .hubble-slide-arrows {
          display: block !important;
          margin-top: 8px;
        }
        #home-projects .hubble-slide-arrows .slide-arrow {
          background: #fff !important;
          border: 2px solid #111 !important;
          color: #111 !important;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 6px;
          transition: transform 0.18s ease, background 0.18s ease;
          box-shadow: 4px 6px 0 0 rgba(0, 0, 0, 0.18);
        }
        #home-projects .hubble-slide-arrows .slide-arrow:hover {
          transform: translateY(-2px);
          background: #f5f5f5 !important;
        }
        #home-projects .hubble-slide-arrows .slide-arrow img {
          width: 18px;
          filter: brightness(0);
        }
        #home-projects .hubble-slide-arrows .slide-arrow.back img {
          transform: rotate(180deg);
        }
        #home-projects .hubble-slide-arrows .slide-arrow.off {
          opacity: 0.35;
          pointer-events: none;
        }
        #home-projects header {
          text-align: center;
          padding: 70px 16px 8px;
        }
        #home-projects header > .hubble-explore-cta {
          margin-top: 20px;
        }
        #home-projects .hubble-explore-cta .cta-txt {
          background: #c2383a !important;
          border-color: #000 !important;
          color: #fff !important;
        }
        #home-projects .hubble-explore-cta .cta-arr {
          background: #fff !important;
          border-color: #000 !important;
          color: #000 !important;
        }
        #home-projects .hubble-explore-cta .arr {
          background: #000 !important;
        }
        #home-projects .hubble-explore-cta .arr img {
          filter: brightness(0) invert(1);
        }
        #home-projects .hubble-explore-cta:hover .cta-arr {
          border-left-color: #000 !important;
        }
        @media screen and (max-width: 900px) {
          #home-projects .project-mods.hubble-project-scroller {
            padding: 8px 18px 20px;
            gap: 14px;
          }
          #home-projects .project-mods.hubble-project-scroller .project-mod {
            width: 86vw !important;
            max-width: 380px !important;
          }
          #home-projects .project-mod .inner {
            min-height: 260px !important;
            padding: 22px 18px 16px !important;
          }
          #home-projects .hubble-slide-arrows .slide-arrow {
            width: 48px;
            height: 48px;
          }
        }
        @media screen and (max-width: 480px) {
          #home-projects .hubble-projects-title h2 {
            font-size: 32px;
          }
          #home-projects .project-mods.hubble-project-scroller .project-mod {
            width: 88vw !important;
            max-width: 360px !important;
          }
        }
      `;
      section.appendChild(projectStyle);
    }
  }

  if (selector === "#home-callout") {
    section.setAttribute("style", "padding-top:60px; padding-bottom:60px; background:#fff;");

    const calloutHeading = section.querySelector(".callout-text h3");
    if (calloutHeading) calloutHeading.textContent = "Stuck on scope?";

    const calloutPara = section.querySelector(".callout-text p");
    if (calloutPara) {
      calloutPara.textContent =
        "Tell Hubble what you're building and we'll have a structured, ship-ready scope back to you in minutes.";
    }

    const calloutCta = section.querySelector(".cta a.cta-btn");
    if (calloutCta) {
      calloutCta.setAttribute("href", "/scope/new");
      calloutCta.setAttribute("data-text", "Get my scope");
      calloutCta.classList.add("hubble-callout-cta");
    }

    const calloutImg = section.querySelector(".callout-img");
    if (calloutImg) {
      calloutImg.setAttribute(
        "style",
        "background:#c2383a !important; border-radius:18px !important; padding:14px;"
      );
      const innerImg = calloutImg.querySelector("img") as HTMLImageElement | null;
      if (innerImg) {
        innerImg.style.filter = "brightness(0) invert(1)";
      }
    }

    if (!section.querySelector("style[data-hubble-callout='true']")) {
      const calloutStyle = document.createElement("style");
      calloutStyle.setAttribute("data-hubble-callout", "true");
      calloutStyle.textContent = `
        #home-callout .callout-module {
          background: #fff;
          border: 2px solid #111 !important;
          border-radius: 24px !important;
          box-shadow: 8px 10px 0 0 rgba(0, 0, 0, 0.16);
        }
        #home-callout .callout-text h3 {
          font-size: clamp(28px, 4vw, 44px) !important;
          letter-spacing: -0.02em;
          color: #111 !important;
        }
        #home-callout .callout-text p {
          color: #444 !important;
          font-size: clamp(15px, 1.6vw, 17px) !important;
          line-height: 1.55 !important;
        }
        #home-callout .hubble-callout-cta .cta-txt {
          background: #c2383a !important;
          border-color: #000 !important;
          color: #fff !important;
        }
        #home-callout .hubble-callout-cta .cta-arr {
          background: #fff !important;
          border-color: #000 !important;
        }
        #home-callout .hubble-callout-cta .arr {
          background: #000 !important;
        }
        #home-callout .hubble-callout-cta .arr img {
          filter: brightness(0) invert(1);
        }
      `;
      section.appendChild(calloutStyle);
    }
  }

  if (selector === "#home-bucket-ctas") {
    section.setAttribute("style", "padding:0; background:#fff;");
    section.classList.remove("has-open", "ctablock");

    const bucketCtas = section.querySelectorAll(".bucket-cta");
    const bucketContent = [
      {
        eyebrow: "For founders",
        heading: "Go from idea<br>to scope",
        body: "Drop in your idea, pick a template, and Hubble drafts a full product scope you can use to brief your team or agency.",
        href: "/scope/new",
      },
      {
        eyebrow: "For product teams",
        heading: "Faster, sharper<br>specs",
        body: "Use Hubble to align stakeholders fast — generate PRDs, user stories, and acceptance criteria in one structured doc.",
        href: "/dashboard",
      },
    ];

    bucketCtas.forEach((cta, idx) => {
      const data = bucketContent[idx];
      if (!data) return;

      const heading = cta.querySelector(".top h2");
      if (heading) heading.innerHTML = `<span class="hubble-bucket-eyebrow">${data.eyebrow}</span><br>${data.heading}`;

      const para = cta.querySelector(".bot p.big");
      if (para) para.textContent = data.body;

      const fullLink = cta.querySelector("a.full");
      if (fullLink) {
        fullLink.setAttribute("href", data.href);
        fullLink.removeAttribute("target");
        fullLink.removeAttribute("rel");
      }

      const inner = cta.querySelector(".inner");
      if (inner) {
        inner.classList.remove("orangebg");
        inner.classList.add(idx === 0 ? "hubble-bucket-red" : "hubble-bucket-dark");
      }

      const bucketImgWrap = cta.querySelector(".bucket-img") as HTMLElement | null;
      if (bucketImgWrap) {
        bucketImgWrap.style.opacity = "0";
        bucketImgWrap.style.visibility = "hidden";
        bucketImgWrap.style.pointerEvents = "none";
      }
    });

    if (!section.querySelector("style[data-hubble-bucket-ctas='true']")) {
      const bucketCtasStyle = document.createElement("style");
      bucketCtasStyle.setAttribute("data-hubble-bucket-ctas", "true");
      bucketCtasStyle.textContent = `
        #home-bucket-ctas {
          padding: 80px 0 !important;
        }
        #home-bucket-ctas .bucket-ctas {
          gap: 24px !important;
          padding: 0 clamp(14px, 4vw, 56px) !important;
          display: grid !important;
          grid-template-columns: 1fr 1fr;
        }
        #home-bucket-ctas .bucket-ctas .bucket-cta {
          padding: 0 !important;
          background: transparent !important;
          border-radius: 0 !important;
          overflow: visible !important;
        }
        #home-bucket-ctas .bucket-cta .inner {
          border-radius: 28px !important;
          border: 2px solid #111 !important;
          overflow: hidden;
          min-height: 360px;
          box-shadow: 8px 10px 0 0 rgba(0, 0, 0, 0.18);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
        }
        #home-bucket-ctas .hubble-bucket-red {
          background: #c2383a !important;
        }
        #home-bucket-ctas .hubble-bucket-dark {
          background: #111 !important;
        }
        #home-bucket-ctas .bucket-cta h2 {
          color: #fff !important;
          font-size: clamp(34px, 4.5vw, 56px) !important;
          line-height: 1.05 !important;
          letter-spacing: -0.02em;
          opacity: 1 !important;
          transform: none !important;
        }
        #home-bucket-ctas .hubble-bucket-eyebrow {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        #home-bucket-ctas .bucket-cta p.big {
          color: rgba(255, 255, 255, 0.92) !important;
          font-size: clamp(16px, 1.7vw, 20px) !important;
          line-height: 1.45 !important;
        }
        #home-bucket-ctas .bucket-cta .bot {
          opacity: 1 !important;
          transform: none !important;
        }
        #home-bucket-ctas .bucket-cta .bucket-img {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        #home-bucket-ctas .bucket-cta .arrow {
          background: rgba(255, 255, 255, 0.16) !important;
          border-radius: 14px;
          padding: 6px;
        }
        #home-bucket-ctas .bucket-cta .arrow img {
          filter: brightness(0) invert(1);
        }
        #home-bucket-ctas .bucket-cta .bot.bdr {
          border-color: rgba(255, 255, 255, 0.22) !important;
        }
        @media screen and (max-width: 768px) {
          #home-bucket-ctas {
            padding: 50px 0 !important;
          }
          #home-bucket-ctas .bucket-ctas {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 0 16px !important;
          }
          #home-bucket-ctas .bucket-cta .inner {
            min-height: 280px;
          }
          #home-bucket-ctas .bucket-cta h2 {
            font-size: 36px !important;
          }
        }
      `;
      section.appendChild(bucketCtasStyle);
    }
  }

  if (selector === "#home-future") {
    const futureHeading = section.querySelector("header h2");
    if (futureHeading) futureHeading.textContent = "Hubble by the numbers";

    const futurePara = section.querySelector("header p");
    if (futurePara) futurePara.textContent = "Trusted by teams scoping their next big thing";

    const stats = [
      { num: "10K+", label: "Scopes generated" },
      { num: "200+", label: "Scoping templates" },
      { num: "95%", label: "Time saved per spec" },
      { num: "4.9★", label: "Founder rating" },
      { num: "50+", label: "Output formats" },
      { num: "1.2K+", label: "Teams onboarded" },
    ];

    section.querySelectorAll(".stat-item").forEach((item, idx) => {
      const stat = stats[idx];
      if (!stat) return;
      const heading = item.querySelector("h2");
      const para = item.querySelector("p");
      if (heading) heading.textContent = stat.num;
      if (para) para.textContent = stat.label;
    });

    if (!section.querySelector("style[data-hubble-future='true']")) {
      const futureStyle = document.createElement("style");
      futureStyle.setAttribute("data-hubble-future", "true");
      futureStyle.textContent = `
        #home-future {
          padding: 80px clamp(14px, 4vw, 56px) !important;
        }
        #home-future header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 40px;
        }
        #home-future header h2 {
          font-size: clamp(34px, 5vw, 60px) !important;
          line-height: 1.05 !important;
          letter-spacing: -0.025em;
          color: #111 !important;
          margin: 0 0 12px;
        }
        #home-future header p {
          font-size: clamp(15px, 1.7vw, 18px) !important;
          color: #555 !important;
          margin: 0;
        }
        #home-future .stats-grid {
          border: 2px solid #111 !important;
          border-radius: 28px !important;
          overflow: hidden;
          background: #fff;
          box-shadow: 8px 10px 0 0 rgba(0, 0, 0, 0.16);
        }
        #home-future .stat-item {
          padding: 32px 24px !important;
          border-color: #111 !important;
          background: #fff;
          transition: background 0.2s ease;
        }
        #home-future .stat-item:hover {
          background: #fff5f5;
        }
        #home-future .stat-item h2 {
          color: #c2383a !important;
          font-size: clamp(36px, 4.5vw, 56px) !important;
          font-weight: 700;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        #home-future .stat-item p {
          color: #444 !important;
          font-size: 15px !important;
          margin: 0;
          font-weight: 500;
        }
        @media screen and (max-width: 768px) {
          #home-future {
            padding: 50px 16px !important;
          }
          #home-future .stat-item {
            padding: 22px 16px !important;
          }
          #home-future .stat-item h2 {
            font-size: 32px !important;
          }
        }
      `;
      section.appendChild(futureStyle);
    }
  }

  if (selector === "#home-roadmap") {
    section.setAttribute("style", "background:#111; border-radius:28px; margin: 40px clamp(14px,4vw,56px); padding-bottom: 80px;");

    const roadmapHeading = section.querySelector("header h2");
    if (roadmapHeading) roadmapHeading.textContent = "Hubble's roadmap";

    if (!section.querySelector(".hubble-roadmap-sub")) {
      const sub = document.createElement("p");
      sub.className = "hubble-roadmap-sub";
      sub.textContent = "Where we're taking AI scoping next.";
      const headerEl = section.querySelector("header");
      if (headerEl) headerEl.appendChild(sub);
    }

    const roadmapContent = [
      {
        year: "Now",
        title: "AI scoping core",
        items: ["Conversational scoping flow", "10+ ready-to-use templates", "Export to PRD, user stories, JSON"],
      },
      {
        year: "Next",
        title: "Team workspaces",
        items: ["Shared scoping workspaces", "Comments and revisions", "Reusable team-wide templates"],
      },
      {
        year: "Soon",
        title: "Smart blueprints",
        items: ["Auto-detect product type", "Risk and effort estimation", "Component & API recommendations"],
      },
      {
        year: "Q3",
        title: "Integrations",
        items: ["Push to Jira, Linear, Notion", "Two-way sync with Figma", "Slack scoping companion"],
      },
      {
        year: "Q4",
        title: "Hubble for agencies",
        items: ["White-label scopes", "Branded client portals", "Proposal &amp; estimate generator"],
      },
      {
        year: "2027",
        title: "Hubble OS",
        items: ["Org-wide knowledge base", "Custom scoping models", "Live scoping copilot in your IDE"],
      },
    ];

    const yearsWrap = section.querySelector(".header-year .slide-wrap");
    if (yearsWrap) {
      yearsWrap.innerHTML = roadmapContent
        .map(
          (item, idx) =>
            `<div class="rm-year ${idx === 0 ? "first on" : idx === 1 || idx === 4 ? "first" : ""}" data-year="${item.year}" data-num="${idx}"><h2>${item.year}</h2></div>`
        )
        .join("");
    }

    const slidesWrap = section.querySelector(".module-contents .slide-wrap.rm");
    if (slidesWrap) {
      slidesWrap.setAttribute("data-total", String(roadmapContent.length));
      slidesWrap.innerHTML = roadmapContent
        .map(
          (item, idx) => `
            <div class="rm-slide inner module${idx === 0 ? " on" : ""}" data-year="${item.year}" data-num="${idx}">
              <div class="rm-contents">
                <div class="hubble-rm-card">
                  <div class="hubble-rm-eyebrow">${item.year}</div>
                  <h3>${item.title}</h3>
                  <ul>
                    ${item.items.map((bullet) => `<li>${bullet}</li>`).join("")}
                  </ul>
                </div>
              </div>
            </div>
          `
        )
        .join("");
    }

    section.setAttribute("data-total", String(roadmapContent.length));
    section.setAttribute("data-cur", "0");

    if (!section.querySelector("style[data-hubble-roadmap='true']")) {
      const roadmapStyle = document.createElement("style");
      roadmapStyle.setAttribute("data-hubble-roadmap", "true");
      roadmapStyle.textContent = `
        #home-roadmap {
          background: #111 !important;
          color: #fff;
          border-radius: 28px !important;
        }
        #home-roadmap .background {
          opacity: 0.4;
          mix-blend-mode: screen;
        }
        #home-roadmap header {
          text-align: center;
          padding: 70px 16px 0 !important;
        }
        #home-roadmap header h2 {
          color: #fff !important;
          font-size: clamp(34px, 5vw, 60px) !important;
          letter-spacing: -0.025em;
          line-height: 1.05;
          margin: 0 0 12px;
        }
        #home-roadmap .hubble-roadmap-sub {
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 16px;
          margin: 0;
        }
        #home-roadmap .max-wrap {
          padding-top: 30px !important;
        }
        #home-roadmap .rm-module {
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 24px !important;
          backdrop-filter: blur(8px);
        }
        #home-roadmap .header-year {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        #home-roadmap .rm-year h2 {
          color: rgba(255, 255, 255, 0.55) !important;
          font-size: 28px !important;
          letter-spacing: -0.01em;
          font-weight: 700;
        }
        #home-roadmap .rm-year.on h2 {
          color: #fff !important;
        }
        #home-roadmap .hubble-rm-card {
          padding: 36px 28px 28px;
          color: #fff;
        }
        #home-roadmap .hubble-rm-eyebrow {
          display: inline-block;
          padding: 6px 12px;
          background: #c2383a;
          color: #fff;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        #home-roadmap .hubble-rm-card h3 {
          font-size: clamp(28px, 3.4vw, 38px) !important;
          color: #fff !important;
          margin: 0 0 18px;
          letter-spacing: -0.015em;
        }
        #home-roadmap .hubble-rm-card ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        #home-roadmap .hubble-rm-card ul li {
          color: rgba(255, 255, 255, 0.82) !important;
          padding: 8px 0 8px 28px;
          position: relative;
          font-size: 16px;
          line-height: 1.5;
        }
        #home-roadmap .hubble-rm-card ul li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 16px;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: #c2383a;
          box-shadow: 0 0 0 4px rgba(194, 56, 58, 0.18);
        }
        #home-roadmap .slide-arrows .slide-arrow {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          color: #fff !important;
        }
        #home-roadmap .slide-arrows .slide-arrow img {
          filter: brightness(0) invert(1);
        }
        @media screen and (max-width: 768px) {
          #home-roadmap {
            margin: 30px 14px !important;
            padding-bottom: 60px !important;
          }
          #home-roadmap header {
            padding-top: 50px !important;
          }
          #home-roadmap .hubble-rm-card {
            padding: 28px 18px 20px;
          }
          #home-roadmap .hubble-rm-card h3 {
            font-size: 26px !important;
          }
        }
      `;
      section.appendChild(roadmapStyle);
    }
  }

  if (selector === "#globalFooter") {
    section.setAttribute("style", "background:#c2383a !important; padding-top: 24px !important; margin-top: 0 !important;");
    section.querySelectorAll("a[href]").forEach((anchor) => {
      anchor.setAttribute("href", "https://cheespace.com");
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    });

    if (!section.querySelector("style[data-hubble-footer='true']")) {
      const footerStyle = document.createElement("style");
      footerStyle.setAttribute("data-hubble-footer", "true");
      footerStyle.textContent = `
        #globalFooter {
          background: #c2383a !important;
          margin-top: 0 !important;
          padding-top: 24px !important;
        }
        #globalFooter .social-links ul li {
          border-color: rgba(255, 255, 255, 0.35) !important;
          background: rgba(0, 0, 0, 0.08) !important;
        }
        #globalFooter .social-links ul li h3,
        #globalFooter .social-links ul li .icon {
          color: #fff !important;
        }
      `;
      section.appendChild(footerStyle);
    }
  }

  ensureCtaButtonInner(section);

  return section.outerHTML;
}

async function getShardeumHtml(): Promise<string> {
  if (htmlCache.has("source")) {
    return htmlCache.get("source") as string;
  }

  if (!htmlPromise) {
    htmlPromise = fetch("/html/index.html", { cache: "force-cache" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load /html/index.html (${res.status})`);
        }
        return res.text();
      })
      .then((html) => {
        htmlCache.set("source", html);
        return html;
      });
  }

  return htmlPromise;
}

function attachProjectsCarousel(container: HTMLElement) {
  const scroller = container.querySelector<HTMLElement>(".project-mods.hubble-project-scroller");
  const arrows = container.querySelectorAll<HTMLAnchorElement>(".hubble-slide-arrows .slide-arrow");
  if (!scroller || !arrows.length) return () => {};

  const getCardStep = () => {
    const firstCard = scroller.querySelector<HTMLElement>(".project-mod");
    if (!firstCard) return scroller.clientWidth * 0.9;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const styles = window.getComputedStyle(scroller);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");
    return cardWidth + (Number.isFinite(gap) ? gap : 0);
  };

  const updateArrowState = () => {
    const back = container.querySelector<HTMLElement>(".hubble-slide-arrows .slide-arrow.back");
    const next = container.querySelector<HTMLElement>(".hubble-slide-arrows .slide-arrow.next");
    if (!back || !next) return;

    const atStart = scroller.scrollLeft <= 4;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;

    back.classList.toggle("off", atStart);
    next.classList.toggle("off", atEnd);
  };

  const handleClick = (event: Event) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const dir = target.classList.contains("back") ? -1 : 1;
    scroller.scrollBy({ left: getCardStep() * dir, behavior: "smooth" });
  };

  arrows.forEach((arrow) => arrow.addEventListener("click", handleClick));
  scroller.addEventListener("scroll", updateArrowState, { passive: true });
  window.addEventListener("resize", updateArrowState);

  updateArrowState();

  return () => {
    arrows.forEach((arrow) => arrow.removeEventListener("click", handleClick));
    scroller.removeEventListener("scroll", updateArrowState);
    window.removeEventListener("resize", updateArrowState);
  };
}

export function ShardeumSourceHtmlSection({ selector, onReady }: ShardeumSourceHtmlSectionProps) {
  const [markup, setMarkup] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    getShardeumHtml()
      .then((html) => {
        if (!mounted) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const section = doc.querySelector(selector);
        const normalizedMarkup = section ? normalizeSectionMarkup(section, selector) : "";
        setMarkup(normalizedMarkup);
        onReady?.(Boolean(normalizedMarkup));
      })
      .catch(() => {
        if (mounted) {
          setMarkup("");
          onReady?.(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [onReady, selector]);

  useEffect(() => {
    if (!markup || !containerRef.current) return;
    if (selector !== "#home-projects") return;
    const cleanup = attachProjectsCarousel(containerRef.current);
    return cleanup;
  }, [markup, selector]);

  const content = useMemo(() => ({ __html: markup }), [markup]);

  if (!markup) return null;

  return <div ref={containerRef} dangerouslySetInnerHTML={content} />;
}

export function ShardeumAssetLoader() {
  useEffect(() => {
    if (shardeumAssetsInjected) {
      return;
    }
    shardeumAssetsInjected = true;

    const stylesheetHrefs = ["/html/css/icons.css", "/html/css/fonts/fonts.css", "/html/css/style.css", "/html/css/mq.css"];
    const scriptSrcs = [
      "https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
      "/html/js/ScrollTrigger.min.js",
      "/html/js/ScrollToPlugin.min.js",
      "/html/js/DrawSVGPlugin.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/Draggable.min.js",
      "/html/js/InertiaPlugin.min.js",
      "/html/js/jquery.scrollstop.min.js",
      "/html/js/splitting.min.js",
      "/html/js/shardeum.js",
    ];

    stylesheetHrefs.forEach((href) => {
      if (document.querySelector(`link[data-shardeum-asset="true"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-shardeum-asset", "true");
      document.head.appendChild(link);
    });

    scriptSrcs.forEach((src) => {
      if (document.querySelector(`script[data-shardeum-asset="true"][src="${src}"]`)) return;
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.setAttribute("data-shardeum-asset", "true");
      document.body.appendChild(script);
    });
  }, []);

  return null;
}
