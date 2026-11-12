import { apiRequest } from "./client";
import { mapApiCart, type UiCartItem } from "./mappers";
import type { ApiCart } from "./types";

export type CartState = {
  items: UiCartItem[];
  subtotal: number;
  discount: number;
  discountPercentage: number;
  promoCode: string;
  total: number;
};

const emptyCart: CartState = {
  items: [],
  subtotal: 0,
  discount: 0,
  discountPercentage: 0,
  promoCode: "",
  total: 0,
};

function fromApi(cart: ApiCart): CartState {
  return mapApiCart(cart);
}

export async function getCart(): Promise<CartState> {
  const cart = await apiRequest<ApiCart>("/api/cart");
  return fromApi(cart);
}

export async function addCartItem(
  productId: string,
  quantity: number,
): Promise<CartState> {
  const cart = await apiRequest<ApiCart>("/api/cart/items", {
    method: "POST",
    body: { product_id: productId, quantity },
  });
  return fromApi(cart);
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number,
): Promise<CartState> {
  const cart = await apiRequest<ApiCart>(`/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    body: { quantity },
  });
  return fromApi(cart);
}

export async function removeCartItem(cartItemId: string): Promise<CartState> {
  const cart = await apiRequest<ApiCart>(`/api/cart/items/${cartItemId}`, {
    method: "DELETE",
  });
  return fromApi(cart);
}

export async function applyPromoCode(code: string): Promise<CartState> {
  const cart = await apiRequest<ApiCart>("/api/cart/apply-promo", {
    method: "POST",
    body: { code },
  });
  return fromApi(cart);
}

export async function removePromoCode(): Promise<CartState> {
  const cart = await apiRequest<ApiCart>("/api/cart/remove-promo", {
    method: "DELETE",
  });
  return fromApi(cart);
}

export async function clearCartApi(): Promise<void> {
  await apiRequest<void>("/api/cart/clear", { method: "DELETE" });
}

export { emptyCart };
