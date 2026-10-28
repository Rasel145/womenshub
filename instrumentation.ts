// Next.js runs register() once when the server starts
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { assertProductionEnv } = await import("./lib/env");
    assertProductionEnv();
  }
}