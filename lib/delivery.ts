export type DeliveryArea = "dhaka" | "outside";

// The delivery charge is added to every order
export const DELIVERY_CHARGE: Record<DeliveryArea, number> = {
  dhaka: 60,
  outside: 120,
};

export function getDeliveryCharge(subtotal: number, area: DeliveryArea) {
  if (subtotal <= 0) return 0;
  return DELIVERY_CHARGE[area];
}