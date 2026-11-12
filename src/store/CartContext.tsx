import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../types";
import { ensureCustomerSession } from "../api/auth";
import {
  addCartItem,
  applyPromoCode,
  clearCartApi,
  emptyCart,
  getCart,
  removeCartItem,
  removePromoCode,
  updateCartItem,
  type CartState,
} from "../api/cart";
import { ApiError } from "../api/client";

type CartNotice = {
  id: number;
  message: string;
};

type CartContextValue = {
  items: CartState["items"];
  cartCount: number;
  subtotal: number;
  discount: number;
  discountPercentage: number;
  promoCode: string;
  total: number;
  ready: boolean;
  loading: boolean;
  notice: CartNotice | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromo: (code: string) => Promise<void>;
  clearPromo: () => Promise<void>;
  closeNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<CartNotice | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensureCustomerSession();
        const next = await getCart();
        if (!cancelled) setCart(next);
      } catch (error) {
        console.error("Failed to init cart session", error);
        if (!cancelled) {
          showNotice("Backend unavailable. Start Nest API on :3000");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showNotice]);

  const runCartAction = useCallback(
    async (action: () => Promise<CartState | void>, successMessage?: string) => {
      setLoading(true);
      try {
        await ensureCustomerSession();
        const next = await action();
        if (next) setCart(next);
        else setCart(emptyCart);
        if (successMessage) showNotice(successMessage);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Cart request failed";
        showNotice(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showNotice],
  );

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      const safeQty = Math.max(1, quantity);
      await runCartAction(
        () => addCartItem(product.id, safeQty),
        `Added ${product.name} to cart`,
      );
    },
    [runCartAction],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const item = cart.items.find((entry) => entry.product.id === productId);
      if (!item) return;
      await runCartAction(() => removeCartItem(item.cartItemId));
    },
    [cart.items, runCartAction],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const item = cart.items.find((entry) => entry.product.id === productId);
      if (!item) return;
      if (quantity <= 0) {
        await runCartAction(() => removeCartItem(item.cartItemId));
        return;
      }
      await runCartAction(() => updateCartItem(item.cartItemId, quantity));
    },
    [cart.items, runCartAction],
  );

  const clearCart = useCallback(async () => {
    await runCartAction(async () => {
      await clearCartApi();
    });
  }, [runCartAction]);

  const applyPromo = useCallback(
    async (code: string) => {
      await runCartAction(() => applyPromoCode(code), "Promo code applied");
    },
    [runCartAction],
  );

  const clearPromo = useCallback(async () => {
    await runCartAction(() => removePromoCode());
  }, [runCartAction]);

  const closeNotice = useCallback(() => setNotice(null), []);

  const cartCount = useMemo(
    () => cart.items.reduce((total, item) => total + item.quantity, 0),
    [cart.items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      cartCount,
      subtotal: cart.subtotal,
      discount: cart.discount,
      discountPercentage: cart.discountPercentage,
      promoCode: cart.promoCode,
      total: cart.total,
      ready,
      loading,
      notice,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      applyPromo,
      clearPromo,
      closeNotice,
    }),
    [
      cart,
      cartCount,
      ready,
      loading,
      notice,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      applyPromo,
      clearPromo,
      closeNotice,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
