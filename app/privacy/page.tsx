import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import { privacyContent } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | WomensHub",
  description: "How WomensHub collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  const content = privacyContent();

  return (
    <LegalDocument
      title={{ en: "Privacy Policy", bn: "গোপনীয়তা নীতি" }}
      sections={{ en: content.en, bn: content.bn }}
    />
  );
}