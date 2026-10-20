export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  details: string;
  isDefault: boolean;
}

export interface User {
  name: string;
  email: string;
  phone: string;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  description?: string;   // notun
  variants?: string[];  
  images?: string[];  // notun (shade ba size)
}