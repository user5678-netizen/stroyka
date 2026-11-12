import type { Product } from "../types";
import { productExtrasByTitle } from "../data/productExtras";
import type { ApiCart, ApiProduct } from "./types";

export function mapApiProduct(product: ApiProduct): Product {
  const extras = productExtrasByTitle[product.title];
  const images =
    product.images?.length > 0
      ? product.images
      : extras?.images ?? [];

  return {
    id: product.id,
    name: product.title,
    price: Number(product.price),
    rating: Number(product.rating),
    category: product.category || extras?.category || "General",
    imageUrl: images[0] ?? "",
    images,
    description: product.description || extras?.description,
    technicalSpecs: extras?.technicalSpecs,
  };
}

export type UiCartItem = {
  cartItemId: string;
  product: Product;
  quantity: number;
  lineTotal: number;
};

export function mapApiCart(cart: ApiCart): {
  items: UiCartItem[];
  subtotal: number;
  discount: number;
  discountPercentage: number;
  promoCode: string;
  total: number;
} {
  return {
    items: cart.items.map((item) => ({
      cartItemId: item.id,
      product: {
        id: item.product.id,
        name: item.product.title,
        price: Number(item.product.price),
        rating: 0,
        category: productExtrasByTitle[item.product.title]?.category ?? "General",
        imageUrl: item.product.image,
        images: [item.product.image],
      },
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
    })),
    subtotal: Number(cart.subtotal),
    discount: Number(cart.discount_amount),
    discountPercentage: Number(cart.discount_percentage),
    promoCode: cart.promo_code ?? "",
    total: Number(cart.total),
  };
}
