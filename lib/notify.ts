// Sends a message to a customer.
// Before going live, replace the production part with a real SMS provider
// (for a mobile number) or an email service (for an email address).
export async function sendPasswordResetCode(
  user: { name: string; phone: string; email: string | null },
  code: string,
  channel: "phone" | "email"
) {
  if (process.env.NODE_ENV !== "production") {
    const to = channel === "email" ? user.email : user.phone;
    console.log(`\n[DEV ONLY] Password reset code for ${user.name} (${to}): ${code}\n`);
    return;
  }

  // The code is never printed in production
  throw new Error("No SMS or email provider is configured yet.");
}