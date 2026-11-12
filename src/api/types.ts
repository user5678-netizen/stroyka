export type ApiProduct = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  images: string[];
  stock_quantity: number;
  created_at: string;
};

export type PaginatedProducts = {
  items: ApiProduct[];
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  role: "customer" | "admin";
};

export type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

export type ApiCartItem = {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
  };
  quantity: number;
  line_total: number;
};

export type ApiCart = {
  id: string;
  items: ApiCartItem[];
  subtotal: number;
  promo_code?: string | null;
  discount_amount: number;
  discount_percentage: number;
  total: number;
  created_at: string;
  updated_at: string;
};

export type ProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort_by?: "price" | "title";
  order?: "asc" | "desc";
};
