import { business as b } from "@/lib/business";
import { DELIVERY_CHARGE } from "@/lib/delivery";
import { bnNum, type Section } from "@/lib/legal/format";
import { identityItems, shopIntro, complaintLine } from "@/lib/legal/contact";

export function termsContent(): { en: Section[]; bn: Section[] } {
  const dh = b.deliveryDaysDhaka;
  const out = b.deliveryDaysOutside;

  const en: Section[] = [
    {
      heading: "Who we are",
      paragraphs: [
        // `${b.brand} is an online shop for beauty and personal care products, operated by ${b.legalName}.`,
                shopIntro("en"),
      ],
      items: [
        // `Business address: ${b.address}`,
        // `Phone: ${b.phone}`,
        // `Email: ${b.email}`,
      //   `Trade license number: ${b.tradeLicense}`,
      //   `TIN: ${b.tin}`,
      //   ...(b.bin ? [`VAT registration (BIN): ${b.bin}`] : []),
      //   ...(b.ubid ? [`UBID / UBIN / PRA: ${b.ubid}`] : []),
            items: identityItems("en"),
       ],
    },
    {
      heading: "Using this website",
      paragraphs: [
        "By placing an order or creating an account on this website, you agree to these Terms & Conditions and to our Privacy Policy.",
      ],
    },
    {
      heading: "Products and prices",
      items: [
        "We try to show correct product names, photos, descriptions, sizes and prices. Photos are for reference, and the packaging may look slightly different.",
        "All prices are in Bangladeshi Taka (৳). You pay the product price plus the delivery charge shown at checkout.",
        "We may change prices at any time. A price change does not affect an order that has already been confirmed.",
        "If a product is shown at a wrong price because of an obvious mistake, we will tell you, and you can choose to cancel the order or continue at the correct price.",
      ],
    },
    {
      heading: "Placing and confirming an order",
      items: [
        "Your order is a request to buy. It is accepted when we confirm it, usually by phone call or SMS to the mobile number you gave us.",
        "Please give a correct name, mobile number and full address, and keep your phone on so we can reach you.",
        "If we cannot reach you, or we cannot supply the order (for example, the product is out of stock), we may cancel it and we will tell you.",
        "To stop fake orders, we may limit the number of unconfirmed orders from one mobile number.",
      ],
    },
    {
      heading: "Payment",
      items: [
        "At the moment we accept Cash on Delivery (COD). You pay the delivery person when you receive your order.",
        "When online payment (bKash, Nagad or card) is added, we will use a licensed payment provider.",
        "We never ask for your card PIN, bKash or Nagad PIN, or OTP by phone, SMS or message. Never share them with anyone.",
      ],
    },
    {
      heading: "Delivery",
      items: [
        
                `Delivery charge: ৳${DELIVERY_CHARGE.dhaka} inside Dhaka and ৳${DELIVERY_CHARGE.outside} outside Dhaka. The charge is added to every order and is shown at checkout before you place the order.`,
      ],
    },
    {
      heading: "Cancelling an order",
      items: [
        "You can cancel an order before it is shipped by calling or messaging us with your order number.",
        "If the order has already been shipped, tell us as soon as possible. If the parcel has not reached you, we will try to stop it, but we cannot promise.",
        "If you repeatedly refuse correct and undamaged orders, we may ask for advance payment on future orders or stop Cash on Delivery for that mobile number.",
      ],
    },
    {
      heading: "Returns, exchange and refund",
      paragraphs: [
        `You can ask for a return, exchange or refund within ${b.returnWindowDays} days after you receive the product, if:`,
      ],
      items: [
        "we sent the wrong product;",
        "the product arrived damaged or leaking;",
        "the product is defective;",
        "the product is expired, or close to its expiry date without us telling you; or",
        "the product is clearly different from its description.",
      ],
    },
    {
      heading: "How returns and refunds work",
      items: [
        "To ask for a return, contact us with your order number, a short description of the problem, and clear photos or a video of the product and its packaging.",
        "We will check your request and tell you the result. If it is approved, we will arrange to collect the product or tell you how to send it back. If the problem is ours, you do not pay for this.",
        `For an approved return we refund the price of the product (and the delivery charge, if the mistake was ours) within ${b.refundDays} days after we receive and check it. For Cash on Delivery orders we refund by bKash, Nagad or bank transfer to the account you tell us. Online payments are refunded to the account that was used; your bank or payment provider may need extra days to show it.`,
        "If you prefer, we can send you the correct product instead (exchange), depending on stock.",
        "For hygiene and safety, opened or used cosmetic and personal care products cannot be returned, unless they are defective, damaged, expired, or not as described. This does not take away any right you have under the law.",
        "If you paid in advance and we cannot supply the product for a reason beyond our control, we will tell you within 48 hours of your payment and refund the full amount within 72 hours. Your payment provider may need extra time to show it in your account.",
      ],
    },
    {
      heading: "Genuine products",
      items: [
        "We buy products from brands or trusted suppliers and keep product details, such as the expiry date, as printed on the pack. If you find a problem, please tell us.",
        "We do not sell medicines, or health products that need a licence from the Directorate General of Drug Administration.",
      ],
    },
    {
      heading: "Your account",
      items: [
        "Keep your password private and never share the codes we send you. You are responsible for what happens on your account.",
        "Please give correct information. We may suspend an account that is used for fraud, fake orders or abuse.",
      ],
    },
    {
      heading: "Reviews",
      items: [
        "Only customers who have received a product can review it. Reviews must be honest and respectful.",
        "We may hide or remove reviews that are abusive, fake or not about the product.",
      ],
    },
    {
      heading: "Complaints",
      items: [
        // `If you have a problem, contact our complaint officer: ${b.complaintOfficer}, phone ${b.complaintPhone}, email ${b.complaintEmail}.`,
        // "We will reply as soon as possible, and within 72 hours.",
        // "If you are not satisfied, you can also complain to the Directorate of National Consumer Rights Protection (DNCRP).",

                complaintLine("en"),
      ],
    },
    {
      heading: "Our responsibility",
      items: [
        "Nothing in these terms limits your rights under the Consumers' Rights Protection Act, 2009 or any other law of Bangladesh.",
        "We are not responsible for delays caused by events outside our control (for example natural disasters, strikes, road closures, or courier or network problems). We will keep you informed and refund any money we owe you.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. The updated terms apply to orders placed after the date shown at the top of this page.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: ["These terms are governed by the laws of Bangladesh."],
    },
  ];

  const bn: Section[] = [
    {
      heading: "আমরা কারা",
      paragraphs: [
        // `${b.brand} সৌন্দর্য ও ব্যক্তিগত যত্নের পণ্যের একটি অনলাইন শপ, যা পরিচালনা করে ${b.legalName}।`,
                shopIntro("bn"),
      ],
      items: [
        // `ব্যবসার ঠিকানা: ${b.address}`,
        // `ফোন: ${b.phone}`,
        // `ইমেইল: ${b.email}`,
        // `ট্রেড লাইসেন্স নম্বর: ${b.tradeLicense}`,
        // `টিআইএন: ${b.tin}`,
        // ...(b.bin ? [`ভ্যাট নিবন্ধন (বিআইএন): ${b.bin}`] : []),
        // ...(b.ubid ? [`ইউবিআইডি / ইউবিআইএন / পিআরএ: ${b.ubid}`] : []),

              items: identityItems("bn"),
      ],
    },
    {
      heading: "এই ওয়েবসাইট ব্যবহার",
      paragraphs: [
        "এই ওয়েবসাইটে অর্ডার করলে বা অ্যাকাউন্ট খুললে আপনি এই শর্তাবলি এবং আমাদের গোপনীয়তা নীতিতে সম্মত হচ্ছেন বলে ধরা হবে।",
      ],
    },
    {
      heading: "পণ্য ও দাম",
      items: [
        "আমরা পণ্যের সঠিক নাম, ছবি, বিবরণ, সাইজ ও দাম দেখানোর চেষ্টা করি। ছবি শুধু ধারণা দেওয়ার জন্য, মোড়কের ডিজাইন সামান্য আলাদা হতে পারে।",
        "সব দাম বাংলাদেশি টাকায় (৳)। আপনাকে পণ্যের দামের সঙ্গে চেকআউটে দেখানো ডেলিভারি চার্জ দিতে হবে।",
        "আমরা যেকোনো সময় দাম পরিবর্তন করতে পারি। তবে নিশ্চিত হয়ে যাওয়া অর্ডারের দাম বদলায় না।",
        "স্পষ্ট ভুলের কারণে কোনো পণ্যের দাম ভুল দেখানো হলে আমরা আপনাকে জানাব। তখন আপনি অর্ডার বাতিল করতে পারবেন অথবা সঠিক দামে চালিয়ে যেতে পারবেন।",
      ],
    },
    {
      heading: "অর্ডার করা ও নিশ্চিত করা",
      items: [
        "আপনার অর্ডার হলো কেনার একটি অনুরোধ। আমরা সাধারণত আপনার দেওয়া মোবাইল নম্বরে ফোন বা এসএমএসে নিশ্চিত করলে অর্ডার গ্রহণ করা হয়।",
        "সঠিক নাম, মোবাইল নম্বর ও পূর্ণ ঠিকানা দিন এবং ফোন খোলা রাখুন, যাতে আমরা আপনার সঙ্গে যোগাযোগ করতে পারি।",
        "আপনার সঙ্গে যোগাযোগ করতে না পারলে, বা অর্ডার পূরণ করা সম্ভব না হলে (যেমন পণ্যের স্টক শেষ), আমরা অর্ডার বাতিল করতে পারি এবং আপনাকে জানাব।",
        "ভুয়া অর্ডার ঠেকাতে আমরা একটি মোবাইল নম্বর থেকে নিশ্চিত-না-হওয়া অর্ডারের সংখ্যা সীমিত করতে পারি।",
      ],
    },
    {
      heading: "মূল্য পরিশোধ",
      items: [
        "এখন আমরা ক্যাশ অন ডেলিভারি (সিওডি) নিই। পণ্য হাতে পেয়ে ডেলিভারি ব্যক্তিকে টাকা দেবেন।",
        "অনলাইন পেমেন্ট (বিকাশ, নগদ বা কার্ড) যুক্ত হলে আমরা লাইসেন্সপ্রাপ্ত পেমেন্ট প্রতিষ্ঠান ব্যবহার করব।",
        "আমরা কখনোই ফোন, এসএমএস বা মেসেজে আপনার কার্ডের পিন, বিকাশ বা নগদ পিন, কিংবা ওটিপি চাই না। এগুলো কাউকে দেবেন না।",
      ],
    },
    {
      heading: "ডেলিভারি",
      items: [
       
                `ডেলিভারি চার্জ: ঢাকার ভেতরে ৳${bnNum(DELIVERY_CHARGE.dhaka)} এবং ঢাকার বাইরে ৳${bnNum(DELIVERY_CHARGE.outside)}। এই চার্জ প্রতিটি অর্ডারে যোগ হয় এবং অর্ডার করার আগে চেকআউটে দেখানো হয়।`,
      ],
    },
    {
      heading: "অর্ডার বাতিল",
      items: [
        "পণ্য শিপ হওয়ার আগে অর্ডার নম্বরসহ আমাদের ফোন বা মেসেজ করে অর্ডার বাতিল করতে পারবেন।",
        "শিপ হয়ে গেলে যত দ্রুত সম্ভব আমাদের জানান। পার্সেল আপনার কাছে না পৌঁছে থাকলে আমরা থামানোর চেষ্টা করব, তবে নিশ্চয়তা দিতে পারি না।",
        "সঠিক ও অক্ষত অর্ডার বারবার ফিরিয়ে দিলে ভবিষ্যতের অর্ডারে আমরা অগ্রিম পেমেন্ট চাইতে পারি, অথবা ওই মোবাইল নম্বরে ক্যাশ অন ডেলিভারি বন্ধ করতে পারি।",
      ],
    },
    {
      heading: "ফেরত, বদল ও রিফান্ড",
      paragraphs: [
        `পণ্য হাতে পাওয়ার ${bnNum(b.returnWindowDays)} দিনের মধ্যে আপনি ফেরত, বদল বা রিফান্ড চাইতে পারবেন, যদি:`,
      ],
      items: [
        "আমরা ভুল পণ্য পাঠিয়ে থাকি;",
        "পণ্য ক্ষতিগ্রস্ত বা লিক করা অবস্থায় পৌঁছায়;",
        "পণ্যে ত্রুটি থাকে;",
        "পণ্যের মেয়াদ শেষ হয়ে গেছে, বা আমরা না জানিয়ে মেয়াদ শেষের কাছাকাছি পণ্য দিয়েছি; অথবা",
        "পণ্য বিবরণের সঙ্গে স্পষ্টভাবে মেলে না।",
      ],
    },
    {
      heading: "ফেরত ও রিফান্ড কীভাবে হয়",
      items: [
        "ফেরত চাইতে অর্ডার নম্বর, সমস্যার সংক্ষিপ্ত বিবরণ এবং পণ্য ও মোড়কের স্পষ্ট ছবি বা ভিডিওসহ আমাদের সঙ্গে যোগাযোগ করুন।",
        "আমরা আপনার অনুরোধ যাচাই করে ফলাফল জানাব। অনুমোদিত হলে আমরা পণ্য ফেরত নেওয়ার ব্যবস্থা করব, অথবা কীভাবে পাঠাবেন তা জানাব। সমস্যা আমাদের হলে এর খরচ আপনাকে দিতে হবে না।",
        `অনুমোদিত ফেরতের ক্ষেত্রে পণ্য হাতে পেয়ে যাচাই করার পর ${bnNum(b.refundDays)} দিনের মধ্যে আমরা পণ্যের দাম রিফান্ড করব (ভুল আমাদের হলে ডেলিভারি চার্জসহ)। ক্যাশ অন ডেলিভারি অর্ডারে আপনার জানানো বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে রিফান্ড দেওয়া হয়। অনলাইন পেমেন্ট যে অ্যাকাউন্ট থেকে করা হয়েছে সেখানেই ফেরত যায়; ব্যাংক বা পেমেন্ট প্রতিষ্ঠানের সেটি দেখাতে বাড়তি কয়েক দিন লাগতে পারে।`,
        "আপনি চাইলে স্টক সাপেক্ষে আমরা সঠিক পণ্য পাঠিয়ে দিতে পারি (বদল)।",
        "স্বাস্থ্য ও নিরাপত্তার কারণে খোলা বা ব্যবহার করা প্রসাধনী ও ব্যক্তিগত যত্নের পণ্য ফেরত নেওয়া যায় না, তবে পণ্যে ত্রুটি থাকলে, ক্ষতিগ্রস্ত হলে, মেয়াদ শেষ হলে বা বিবরণের সঙ্গে না মিললে ফেরত নেওয়া হয়। এটি আইনে আপনার কোনো অধিকার কমায় না।",
        "আপনি অগ্রিম টাকা দিয়ে থাকলে এবং আমাদের নিয়ন্ত্রণের বাইরের কোনো কারণে পণ্য দিতে না পারলে, টাকা দেওয়ার ৪৮ ঘণ্টার মধ্যে আমরা আপনাকে জানাব এবং ৭২ ঘণ্টার মধ্যে পুরো টাকা ফেরত দেব। আপনার অ্যাকাউন্টে তা দেখাতে পেমেন্ট প্রতিষ্ঠানের বাড়তি সময় লাগতে পারে।",
      ],
    },
    {
      heading: "আসল পণ্য",
      items: [
        "আমরা ব্র্যান্ড বা বিশ্বস্ত সরবরাহকারীর কাছ থেকে পণ্য সংগ্রহ করি এবং মেয়াদের তারিখের মতো তথ্য মোড়কে যেমন ছাপা আছে তেমনই রাখি। কোনো সমস্যা পেলে আমাদের জানান।",
        "আমরা ওষুধ, কিংবা ঔষধ প্রশাসন অধিদপ্তরের লাইসেন্স লাগে এমন স্বাস্থ্যপণ্য বিক্রি করি না।",
      ],
    },
    {
      heading: "আপনার অ্যাকাউন্ট",
      items: [
        "আপনার পাসওয়ার্ড গোপন রাখুন এবং আমাদের পাঠানো কোড কাউকে দেবেন না। আপনার অ্যাকাউন্টে যা ঘটে তার দায় আপনার।",
        "সঠিক তথ্য দিন। প্রতারণা, ভুয়া অর্ডার বা অপব্যবহারে ব্যবহৃত অ্যাকাউন্ট আমরা স্থগিত করতে পারি।",
      ],
    },
    {
      heading: "রিভিউ",
      items: [
        "যাঁরা পণ্যটি হাতে পেয়েছেন শুধু তাঁরাই রিভিউ দিতে পারবেন। রিভিউ সৎ ও ভদ্র হতে হবে।",
        "অশ্লীল, ভুয়া বা পণ্যের সঙ্গে সম্পর্কহীন রিভিউ আমরা লুকিয়ে রাখতে বা মুছে দিতে পারি।",
      ],
    },
    {
      heading: "অভিযোগ",
      items: [
        // `কোনো সমস্যা হলে আমাদের অভিযোগ কর্মকর্তার সঙ্গে যোগাযোগ করুন: ${b.complaintOfficer}, ফোন ${b.complaintPhone}, ইমেইল ${b.complaintEmail}।`,
        // "আমরা যত দ্রুত সম্ভব, এবং ৭২ ঘণ্টার মধ্যে উত্তর দেব।",
        // "আপনি সন্তুষ্ট না হলে জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তরেও (ডিএনসিআরপি) অভিযোগ করতে পারেন।",
                complaintLine("bn"),
      ],
    },
    {
      heading: "আমাদের দায়",
      items: [
        "এই শর্তাবলির কোনো কিছুই ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯ বা বাংলাদেশের অন্য কোনো আইনে আপনার অধিকার সীমিত করে না।",
        "আমাদের নিয়ন্ত্রণের বাইরের ঘটনায় (যেমন প্রাকৃতিক দুর্যোগ, হরতাল, রাস্তা বন্ধ, কুরিয়ার বা নেটওয়ার্ক সমস্যা) দেরি হলে তার দায় আমাদের নয়। আমরা আপনাকে জানাব এবং আপনার প্রাপ্য টাকা ফেরত দেব।",
      ],
    },
    {
      heading: "শর্ত পরিবর্তন",
      paragraphs: [
        "আমরা এই শর্তাবলি হালনাগাদ করতে পারি। এই পাতার উপরে দেখানো তারিখের পর করা অর্ডারে হালনাগাদ শর্ত প্রযোজ্য হবে।",
      ],
    },
    {
      heading: "প্রযোজ্য আইন",
      paragraphs: ["এই শর্তাবলি বাংলাদেশের আইন দ্বারা পরিচালিত হবে।"],
    },
  ];

  return { en, bn };
}