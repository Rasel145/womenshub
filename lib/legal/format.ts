export type Section = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export type Bilingual<T> = { en: T; bn: T };

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

// 7 -> ৭
export function bnNum(value: number | string) {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}