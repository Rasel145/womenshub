import type { Metadata } from "next";
import LegalDocument from "@/components/legal/LegalDocument";
import { termsContent } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Terms & Conditions | WomensHub",
  description: "Terms of sale, delivery, returns and refunds for WomensHub.",
};

export default function TermsPage() {
  const content = termsContent();

  return (
    <LegalDocument
      title={{ en: "Terms & Conditions", bn: "শর্তাবলি" }}
      sections={{ en: content.en, bn: content.bn }}
    />
  );
}