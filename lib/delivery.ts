export type DeliveryArea = "dhaka" | "outside";

export const FREE_DELIVERY_OVER = 2000;

export const DELIVERY_CHARGE: Record<DeliveryArea, number> = {
  dhaka: 60,
  outside: 120,
};

export function getDeliveryCharge(subtotal: number, area: DeliveryArea) {
  if (subtotal === 0 || subtotal >= FREE_DELIVERY_OVER) return 0;
  return DELIVERY_CHARGE[area];
}