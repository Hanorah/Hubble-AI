"use client";

import { ShardeumAssetLoader, ShardeumSourceHtmlSection } from "./sections/shardeum-source-html-section";
import {
  HubbleFaqSection,
  HubbleFeaturesSection,
  HubbleFinalCtaSection,
  HubbleHowItWorksSection,
  HubbleTestimonialSection,
} from "./sections/hubble-extra-sections";

export default function ShardeumLanding() {
  return (
    <main>
      <ShardeumAssetLoader />
      <ShardeumSourceHtmlSection selector="#globalHeader" />
      <ShardeumSourceHtmlSection selector="#globalMenu" />
      <ShardeumSourceHtmlSection selector="#home-hero" />
      <HubbleHowItWorksSection />
      <ShardeumSourceHtmlSection selector="#home-projects" />
      <HubbleFeaturesSection />
      <ShardeumSourceHtmlSection selector="#home-future" />
      <HubbleTestimonialSection />
      <ShardeumSourceHtmlSection selector="#home-bucket-ctas" />
      <HubbleFaqSection />
      <HubbleFinalCtaSection />
      <ShardeumSourceHtmlSection selector="#globalFooter" />
    </main>
  );
}
