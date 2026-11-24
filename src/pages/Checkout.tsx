import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCart } from "../store/CartContext";
import styles from "./Cart.module.css";

const money = (value: number) => `$${value.toFixed(2)}`;

export function Checkout() {
  const { items, subtotal, discount, discountPercentage, promoCode, total, ready } = useCart();

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.cartTitle}>Checkout</h1>
          {!ready ? <p role="status">Loading cart…</p> : items.length === 0 ? (
            <section className={styles.emptyWrapper}>
              <h2>Your Cart is Empty</h2>
              <Link className={styles.browseProducts} to="/">Browse Products</Link>
            </section>
          ) : (
            <div className={styles.layout}>
              <section className={styles.cartMain} aria-label="Review items">
                <h2>Review your items</h2>
                {items.map(item => (
                  <div className={styles.summaryRow} key={item.cartItemId}>
                    <span>{item.product.name} × {item.quantity}</span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
               
                <Link className={styles.continueShopping} to="/cart">Back to Cart</Link>
              </section>
              <aside className={styles.summary} aria-label="Order summary">
                <h2 className={styles.summaryTitle}>Order Summary</h2>
                <div className={styles.summaryRow}><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span>{promoCode} ({discountPercentage}%)</span><strong>-{money(discount)}</strong>
                  </div>
                )}
                <div className={styles.totalRow}><span>Total</span><strong>{money(total)}</strong></div>
                <Link className={styles.continueShopping} to="/">Continue Shopping</Link>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
