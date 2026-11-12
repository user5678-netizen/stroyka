import { apiRequest } from "./client";
import { mapApiProduct } from "./mappers";
import type { Product } from "../types";
import type { ApiProduct, PaginatedProducts, ProductsQuery } from "./types";

function toQuery(params: ProductsQuery): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchProducts(query: ProductsQuery = {}): Promise<{
  items: Product[];
  meta: PaginatedProducts["meta"];
}> {
  const data = await apiRequest<PaginatedProducts>(
    `/api/products${toQuery(query)}`,
    { auth: false },
  );
  return {
    items: data.items.map(mapApiProduct),
    meta: data.meta,
  };
}

export async function fetchProductById(id: string): Promise<Product> {
  const data = await apiRequest<ApiProduct>(`/api/products/${id}`, {
    auth: false,
  });
  return mapApiProduct(data);
}
