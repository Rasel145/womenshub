// The details of your shop. Anything left empty ("") is simply not shown on the website.
export const business = {
  brand: "WomensHub",
  legalName: "WomensHub",

  // Contact details: customers see these in the footer (on every page), the Terms,
  // the Privacy Policy and on invoices.
  phone: "01310306083",
  email: "support.womenshub@gmail.com",
  address: "", // optional: your shop address

  // Registration numbers. Shown only when you fill them in.
  tradeLicense: "",
  tin: "",
  bin: "", // VAT registration number
  ubid: "", // UBID / UBIN / PRA number

  // Optional: a separate contact for complaints. If empty, the phone and email above are used.
  complaintOfficer: "",
  complaintPhone: "",
  complaintEmail: "",

  // Only promise what you can really do
  deliveryDaysDhaka: { min: 1, max: 3 }, // working days
  deliveryDaysOutside: { min: 3, max: 7 },
  returnWindowDays: 7, // how long after delivery a customer can ask for a return or refund
  refundDays: 7, // how long you take to refund after the returned product is checked
  recordRetentionYears: 6, // check this number with your lawyer or accountant
};

export const LEGAL_UPDATED = { en: "3 November 2026", bn: "৩ নভেম্বর ২০২৬" };

// True while the contact details are still missing (used only for a note while developing)
export function hasPlaceholders() {
  return !business.phone.trim() || !business.email.trim();
}