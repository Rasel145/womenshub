import LegalLanguageSwitch from "./LegalLanguageSwitch";
import { hasPlaceholders, LEGAL_UPDATED } from "@/lib/business";
import { bnNum, type Bilingual, type Section } from "@/lib/legal/format";

function Sections({ sections, lang }: { sections: Section[]; lang: "en" | "bn" }) {
  return (
    <div className="space-y-7">
      {sections.map((section, index) => (
        <section key={section.heading}>
          <h2 className="mb-2 text-lg font-semibold">
            {lang === "bn" ? bnNum(index + 1) : index + 1}. {section.heading}
          </h2>

          {section.paragraphs?.map((p) => (
            <p key={p} className="mb-2 text-sm leading-relaxed text-gray-700">
              {p}
            </p>
          ))}

          {section.items && (
            <ul className="ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-gray-700">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default function LegalDocument({
  title,
  sections,
}: {
  title: Bilingual<string>;
  sections: Bilingual<Section[]>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Only shown while you are building the site, never on the live site */}
      {/* {process.env.NODE_ENV !== "production" && hasPlaceholders() && (
        <p className="mb-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Development note: some business details in lib/business.ts still say
          &quot;YOUR ...&quot;. Fill them in before the website goes live.
        </p>
      )} */}

            {process.env.NODE_ENV !== "production" && hasPlaceholders() && (
        <p className="mb-6 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Development note: your phone number or email is still empty in lib/business.ts.
          Add them so customers can contact you.
        </p>
      )}

      <LegalLanguageSwitch />

      <div data-lb="en">
        <h1 className="text-3xl font-bold">{title.en}</h1>
        <p className="mb-8 mt-1 text-sm text-gray-500">Last updated: {LEGAL_UPDATED.en}</p>
        <Sections sections={sections.en} lang="en" />
      </div>

      <div data-lb="bn">
        <h1 className="text-3xl font-bold">{title.bn}</h1>
        <p className="mb-8 mt-1 text-sm text-gray-500">
          সর্বশেষ হালনাগাদ: {LEGAL_UPDATED.bn}
        </p>
        <Sections sections={sections.bn} lang="bn" />
      </div>
    </main>
  );
}