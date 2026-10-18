import { Address, Order, User } from "@/types";

export const user: User = {
  name: "Nusrat Jahan",
  email: "nusrat@example.com",
  phone: "01712345678",
};

export const orders: Order[] = [
  { id: "SG-10231", date: "2026-10-10", total: 2450, status: "delivered", itemCount: 3 },
  { id: "SG-10198", date: "2026-10-14", total: 1280, status: "shipped", itemCount: 2 },
  { id: "SG-10255", date: "2026-10-16", total: 790, status: "pending", itemCount: 1 },
  { id: "SG-10102", date: "2026-09-28", total: 3100, status: "cancelled", itemCount: 4 },
];

export const addresses: Address[] = [
  {
    id: "a1",
    label: "Home",
    name: "Nusrat Jahan",
    phone: "01712345678",
    details: "House 12, Road 5, Dhanmondi, Dhaka",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Office",
    name: "Nusrat Jahan",
    phone: "01712345678",
    details: "Level 4, Gulshan Avenue, Dhaka",
    isDefault: false,
  },
];