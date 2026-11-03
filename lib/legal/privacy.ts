import { business as b } from "@/lib/business";
import { bnNum, type Section } from "@/lib/legal/format";
import { privacyIntro } from "@/lib/legal/contact";


export function privacyContent(): { en: Section[]; bn: Section[] } {
  const years = b.recordRetentionYears;

  const en: Section[] = [
    {
      heading: "Who we are",
      paragraphs: [
        // `${b.brand}, operated by ${b.legalName}, is responsible for your personal data on this website. You can contact us at ${b.email} or ${b.phone}.`,
                privacyIntro("en"),
      ],
    },
    {
      heading: "What information we collect",
      items: [
        "Account: your name, mobile number, email (optional) and password. Your password is stored only in a scrambled (hashed) form, so we cannot read it.",
        "Orders: your name, mobile number, delivery address, city, order note, the products you ordered, delivery area and payment method.",
        "Reviews and wishlist: the reviews you write and the products you save.",
        "Technical information: your IP address (we keep only a scrambled version, to stop abuse such as repeated login attempts), basic browser and device information in our server logs, and the cookies described below.",
        "We do not collect or store your card number, card PIN or mobile banking PIN.",
      ],
    },
    {
      heading: "Why we use your information",
      items: [
        "To take, confirm and deliver your orders, and to call or message you about them.",
        "To run your account and give you support.",
        "To prevent fraud, fake orders and abuse.",
        "To keep the accounting and legal records we need to keep.",
        "To improve the website.",
        "We send promotional messages only if you agree to receive them.",
      ],
    },
    {
      heading: "Your consent",
      paragraphs: [
        "We collect and use your personal data with your permission. When you register, place an order or write a review, you agree to this policy.",
        "You can withdraw your consent at any time by contacting us. This may mean we can no longer provide some services, and we may still need to keep order records that the law requires.",
      ],
    },
    {
      heading: "Cookies and similar technology",
      items: [
        "Login cookie: keeps you signed in. The website needs it to work.",
        "Settings saved in your browser: your language, light or dark mode, shopping cart and the wishlist display. These stay on your device.",
        "Security check: at checkout we use Cloudflare Turnstile to stop robots. It is loaded from Cloudflare and may process technical information about your browser.",
        "We do not use advertising or tracking cookies at the moment. If we add them, we will tell you first and ask for your permission.",
      ],
    },
    {
      heading: "Who we share it with",
      paragraphs: ["We do not sell your personal data. We share only what is needed with:"],
      items: [
        "delivery and courier companies (your name, phone number, address and order value);",
        "payment providers, when online payment is available;",
        "SMS or email service providers, to send codes and order updates;",
        "hosting and security providers, such as Cloudflare and our server provider; and",
        "government authorities, when the law requires it.",
      ],
    },
    {
      heading: "How long we keep it",
      items: [
        "Account information: for as long as your account is active.",
        `Order and accounting records: as long as the law requires (we keep them for ${years} years).`,
        "Security logs: for a short time only.",
        "You can ask us to delete your account. We will delete or anonymise what we can, but we may keep order records that the law requires.",
      ],
    },
    {
      heading: "How we protect your data",
      items: [
        "Passwords are stored in hashed form, and the website uses a secure (HTTPS) connection.",
        "Only authorised staff can see customer orders.",
        "No system is completely safe. If a data breach affects you, we will tell you and the authorities as the law requires.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can ask us to show you the personal data we hold about you, correct it, delete it, or stop using it, and you can withdraw your consent. Contact us and we will reply within a reasonable time. You can also complain to the authority responsible for data protection in Bangladesh.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Our shop is for adults. If you are under 18, please use it together with a parent or guardian.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy. The date of the latest update is at the top of this page.",
      ],
    },
  ];

  const bn: Section[] = [
    {
      heading: "আমরা কারা",
      paragraphs: [
        // `${b.legalName} পরিচালিত ${b.brand} এই ওয়েবসাইটে আপনার ব্যক্তিগত তথ্যের দায়িত্বে আছে। আমাদের সঙ্গে যোগাযোগ: ${b.email} বা ${b.phone}।`,
                     privacyIntro("bn"),
      ],
    },
    {
      heading: "আমরা কী তথ্য সংগ্রহ করি",
      items: [
        "অ্যাকাউন্ট: আপনার নাম, মোবাইল নম্বর, ইমেইল (ঐচ্ছিক) ও পাসওয়ার্ড। পাসওয়ার্ড শুধু এলোমেলো করা (হ্যাশ) আকারে রাখা হয়, তাই আমরা তা পড়তে পারি না।",
        "অর্ডার: আপনার নাম, মোবাইল নম্বর, ডেলিভারির ঠিকানা, শহর, অর্ডারের নোট, কী কী পণ্য অর্ডার করেছেন, ডেলিভারি এলাকা ও পেমেন্টের ধরন।",
        "রিভিউ ও পছন্দের তালিকা: আপনার লেখা রিভিউ এবং সংরক্ষণ করা পণ্য।",
        "প্রযুক্তিগত তথ্য: আপনার আইপি ঠিকানা (বারবার লগইনের চেষ্টার মতো অপব্যবহার ঠেকাতে আমরা এর শুধু এলোমেলো করা রূপ রাখি), সার্ভার লগে ব্রাউজার ও ডিভাইসের সাধারণ তথ্য, এবং নিচে বলা কুকি।",
        "আমরা আপনার কার্ড নম্বর, কার্ডের পিন বা মোবাইল ব্যাংকিং পিন সংগ্রহ বা সংরক্ষণ করি না।",
      ],
    },
    {
      heading: "কেন আপনার তথ্য ব্যবহার করি",
      items: [
        "আপনার অর্ডার নেওয়া, নিশ্চিত করা ও ডেলিভারি দেওয়া এবং সে বিষয়ে আপনাকে ফোন বা মেসেজ করা।",
        "আপনার অ্যাকাউন্ট চালানো ও সহায়তা দেওয়া।",
        "প্রতারণা, ভুয়া অর্ডার ও অপব্যবহার ঠেকানো।",
        "যে হিসাব ও আইনি রেকর্ড রাখা আমাদের জন্য জরুরি তা সংরক্ষণ করা।",
        "ওয়েবসাইট আরও ভালো করা।",
        "আপনি রাজি হলে তবেই আমরা প্রচারমূলক মেসেজ পাঠাই।",
      ],
    },
    {
      heading: "আপনার সম্মতি",
      paragraphs: [
        "আমরা আপনার অনুমতি নিয়ে আপনার ব্যক্তিগত তথ্য সংগ্রহ ও ব্যবহার করি। নিবন্ধন, অর্ডার বা রিভিউ লেখার সময় আপনি এই নীতিতে সম্মত হন।",
        "আপনি যেকোনো সময় আমাদের জানিয়ে সম্মতি প্রত্যাহার করতে পারেন। এতে কিছু সেবা আর দেওয়া সম্ভব নাও হতে পারে, এবং আইনে যে অর্ডার রেকর্ড রাখা বাধ্যতামূলক তা আমাদের রাখতে হতে পারে।",
      ],
    },
    {
      heading: "কুকি ও অনুরূপ প্রযুক্তি",
      items: [
        "লগইন কুকি: আপনাকে লগইন করা অবস্থায় রাখে। ওয়েবসাইট চলার জন্য এটি দরকার।",
        "ব্রাউজারে সংরক্ষিত সেটিং: আপনার ভাষা, লাইট বা ডার্ক মোড, শপিং কার্ট ও পছন্দের তালিকার প্রদর্শন। এগুলো আপনার ডিভাইসেই থাকে।",
        "নিরাপত্তা যাচাই: চেকআউটে রোবট ঠেকাতে আমরা ক্লাউডফ্লেয়ার টার্নস্টাইল ব্যবহার করি। এটি ক্লাউডফ্লেয়ার থেকে লোড হয় এবং আপনার ব্রাউজারের কিছু প্রযুক্তিগত তথ্য প্রক্রিয়া করতে পারে।",
        "এই মুহূর্তে আমরা বিজ্ঞাপন বা ট্র্যাকিং কুকি ব্যবহার করি না। ভবিষ্যতে যুক্ত করলে আগে আপনাকে জানাব এবং আপনার অনুমতি নেব।",
      ],
    },
    {
      heading: "কাদের সঙ্গে তথ্য শেয়ার করি",
      paragraphs: [
        "আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না। শুধু যতটুকু দরকার ততটুকু নিচের পক্ষগুলোর সঙ্গে শেয়ার করি:",
      ],
      items: [
        "ডেলিভারি ও কুরিয়ার প্রতিষ্ঠান (আপনার নাম, ফোন নম্বর, ঠিকানা ও অর্ডারের মূল্য);",
        "অনলাইন পেমেন্ট চালু হলে পেমেন্ট প্রতিষ্ঠান;",
        "কোড ও অর্ডারের আপডেট পাঠাতে এসএমএস বা ইমেইল সেবাদাতা;",
        "হোস্টিং ও নিরাপত্তা সেবাদাতা, যেমন ক্লাউডফ্লেয়ার ও আমাদের সার্ভার প্রদানকারী; এবং",
        "আইনে প্রয়োজন হলে সরকারি কর্তৃপক্ষ।",
      ],
    },
    {
      heading: "কতদিন তথ্য রাখি",
      items: [
        "অ্যাকাউন্টের তথ্য: যতদিন আপনার অ্যাকাউন্ট সচল থাকে।",
        `অর্ডার ও হিসাবের রেকর্ড: আইনে যতদিন রাখা প্রয়োজন (আমরা ${bnNum(years)} বছর রাখি)।`,
        "নিরাপত্তা লগ: অল্প সময়ের জন্য।",
        "আপনি অ্যাকাউন্ট মুছে ফেলতে বলতে পারেন। আমরা যতটুকু সম্ভব মুছে ফেলব বা পরিচয় সরিয়ে দেব, তবে আইনে যে অর্ডার রেকর্ড রাখা বাধ্যতামূলক তা রেখে দিতে পারি।",
      ],
    },
    {
      heading: "আপনার তথ্য কীভাবে সুরক্ষিত রাখি",
      items: [
        "পাসওয়ার্ড হ্যাশ আকারে রাখা হয় এবং ওয়েবসাইট নিরাপদ (এইচটিটিপিএস) সংযোগে চলে।",
        "শুধু অনুমোদিত কর্মীরা গ্রাহকের অর্ডার দেখতে পারেন।",
        "কোনো ব্যবস্থাই সম্পূর্ণ নিরাপদ নয়। তথ্য ফাঁসের ঘটনায় আপনি ক্ষতিগ্রস্ত হলে আইন অনুযায়ী আমরা আপনাকে ও কর্তৃপক্ষকে জানাব।",
      ],
    },
    {
      heading: "আপনার অধিকার",
      paragraphs: [
        "আপনার সম্পর্কে আমাদের কাছে থাকা ব্যক্তিগত তথ্য দেখতে, সংশোধন করতে, মুছে ফেলতে বা ব্যবহার বন্ধ করতে বলতে পারেন, এবং সম্মতি প্রত্যাহার করতে পারেন। আমাদের সঙ্গে যোগাযোগ করুন, আমরা যুক্তিসঙ্গত সময়ের মধ্যে উত্তর দেব। তথ্য সুরক্ষার দায়িত্বে থাকা বাংলাদেশের কর্তৃপক্ষের কাছেও আপনি অভিযোগ করতে পারেন।",
      ],
    },
    {
      heading: "শিশুদের বিষয়ে",
      paragraphs: [
        "আমাদের দোকান প্রাপ্তবয়স্কদের জন্য। আপনার বয়স ১৮ বছরের কম হলে অনুগ্রহ করে অভিভাবকের সঙ্গে ব্যবহার করুন।",
      ],
    },
    {
      heading: "এই নীতির পরিবর্তন",
      paragraphs: [
        "আমরা এই নীতি হালনাগাদ করতে পারি। সর্বশেষ হালনাগাদের তারিখ এই পাতার উপরে দেওয়া আছে।",
      ],
    },
  ];

  return { en, bn };
}