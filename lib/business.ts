// Fill in these details before the website goes live.
// They appear on the Terms & Conditions, the Privacy Policy and in the footer.
export const business = {
  brand: "WomensHub",
  legalName: "YOUR LEGAL BUSINESS NAME", // exactly as written on the trade license
  address: "YOUR FULL BUSINESS ADDRESS",
  phone: "YOUR PHONE NUMBER",
  email: "YOUR SUPPORT EMAIL",

  tradeLicense: "YOUR TRADE LICENSE NUMBER",
  tin: "YOUR TIN",
  bin: "", // VAT registration number (BIN). Leave empty if you are not VAT registered.
  ubid: "", // UBID / UBIN / PRA number, if you have one. Leave empty if not.

  complaintOfficer: "NAME OF COMPLAINT OFFICER",
  complaintPhone: "YOUR COMPLAINT PHONE NUMBER",
  complaintEmail: "YOUR COMPLAINT EMAIL",

  // Only promise what you can really do. Check these with your lawyer.
  deliveryDaysDhaka: { min: 1, max: 3 }, // working days
  deliveryDaysOutside: { min: 3, max: 7 },
  returnWindowDays: 7, // how long after delivery a customer can ask for return/refund
  refundDays: 7, // how long you take to refund after the returned product is checked
  recordRetentionYears: 6, // check this number with your lawyer / accountant
};

export const LEGAL_UPDATED = { en: "28 October 2026", bn: "২৮ অক্টোবর ২০২৬" };

// True while some required details above are still the "YOUR ..." examples
export function hasPlaceholders() {
  const required = [
    business.legalName,
    business.address,
    business.phone,
    business.email,
    business.tradeLicense,
    business.tin,
    business.complaintOfficer,
    business.complaintPhone,
    business.complaintEmail,
  ];
  return required.some((v) => v.startsWith("YOUR ") || v.startsWith("NAME OF "));
}