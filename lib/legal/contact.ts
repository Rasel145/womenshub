import { business as b } from "@/lib/business";

type Lang = "en" | "bn";

const clean = (v: string) => v.trim();

// Trade license, TIN, BIN and UBID that are filled in (empty ones are left out)
export function registrationParts() {
  return [
    { label: "Trade License", value: clean(b.tradeLicense) },
    { label: "TIN", value: clean(b.tin) },
    { label: "BIN", value: clean(b.bin) },
    { label: "UBID", value: clean(b.ubid) },
  ].filter((p) => p.value !== "");
}

// "Trade License: 123 · TIN: 456", or "" when nothing is filled in
export function registrationLine() {
  return registrationParts()
    .map((p) => `${p.label}: ${p.value}`)
    .join(" · ");
}

// The lines under "Who we are" in the Terms
export function identityItems(lang: Lang): string[] {
  const t =
    lang === "en"
      ? {
          address: "Business address",
          phone: "Phone",
          email: "Email",
          tradeLicense: "Trade license number",
          tin: "TIN",
          bin: "VAT registration (BIN)",
          ubid: "UBID / UBIN / PRA",
        }
      : {
          address: "ব্যবসার ঠিকানা",
          phone: "ফোন",
          email: "ইমেইল",
          tradeLicense: "ট্রেড লাইসেন্স নম্বর",
          tin: "টিআইএন",
          bin: "ভ্যাট নিবন্ধন (বিআইএন)",
          ubid: "ইউবিআইডি / ইউবিআইএন / পিআরএ",
        };

  const rows: [string, string][] = [
    [t.address, clean(b.address)],
    [t.phone, clean(b.phone)],
    [t.email, clean(b.email)],
    [t.tradeLicense, clean(b.tradeLicense)],
    [t.tin, clean(b.tin)],
    [t.bin, clean(b.bin)],
    [t.ubid, clean(b.ubid)],
  ];

  return rows.filter(([, value]) => value !== "").map(([label, value]) => `${label}: ${value}`);
}

const differs = () => clean(b.legalName) !== "" && clean(b.legalName) !== clean(b.brand);

// First sentence of the Terms
export function shopIntro(lang: Lang) {
  if (lang === "en") {
    return `${b.brand} is an online shop for beauty and personal care products${
      differs() ? `, operated by ${b.legalName}` : ""
    }.`;
  }
  return `${b.brand} সৌন্দর্য ও ব্যক্তিগত যত্নের পণ্যের একটি অনলাইন শপ${
    differs() ? `, যা পরিচালনা করে ${b.legalName}` : ""
  }।`;
}

// First sentence of the Privacy Policy
export function privacyIntro(lang: Lang) {
  const ways = [clean(b.email), clean(b.phone)].filter(Boolean);

  if (lang === "en") {
    return (
      `${b.brand}${differs() ? `, operated by ${b.legalName},` : ""} is responsible for your personal data on this website.` +
      (ways.length ? ` You can contact us at ${ways.join(" or ")}.` : "")
    );
  }
  return (
    `${differs() ? `${b.legalName} পরিচালিত ` : ""}${b.brand} এই ওয়েবসাইটে আপনার ব্যক্তিগত তথ্যের দায়িত্বে আছে।` +
    (ways.length ? ` আমাদের সঙ্গে যোগাযোগ: ${ways.join(" বা ")}।` : "")
  );
}

// The complaint line in the Terms
export function complaintLine(lang: Lang) {
  const officer = clean(b.complaintOfficer);
  const phone = clean(b.complaintPhone) || clean(b.phone);
  const email = clean(b.complaintEmail) || clean(b.email);

  if (lang === "en") {
    const ways = [phone && `phone ${phone}`, email && `email ${email}`].filter(Boolean);
    return (
      `If you have a problem, contact us${officer ? ` (complaint officer: ${officer})` : ""}` +
      (ways.length ? `: ${ways.join(", ")}` : "") +
      "."
    );
  }

  const ways = [phone && `ফোন ${phone}`, email && `ইমেইল ${email}`].filter(Boolean);
  return (
    `কোনো সমস্যা হলে আমাদের সঙ্গে যোগাযোগ করুন${officer ? ` (অভিযোগ কর্মকর্তা: ${officer})` : ""}` +
    (ways.length ? `: ${ways.join(", ")}` : "") +
    "।"
  );
}