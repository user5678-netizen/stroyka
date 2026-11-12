import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ImageCarousel } from "../components/ImageCarousel";
import { ProductCard } from "../components/ProductCard";
import { Rating } from "../components/Rating";
import { BadgeBoxIcon, BadgeShieldIcon, BadgeTruckIcon, CartIcon } from "../components/icons";
import type { Product as ProductType, TechnicalSpec } from "../types";
import { SPEC_COLUMNS_BY_TITLE } from "../data/productExtras";
import { fetchProductById, fetchProducts } from "../api/products";
import { useCart } from "../store/CartContext";
import styles from "./Product.module.css";

const FALLBACK_SPECS: TechnicalSpec[] = [
  { label: "DETAILS", value: "See packaging for full specifications." },
];
const SPECS_FIRST_COLUMN = ["VOLUME", "COVERAGE", "DRY TIME"];
const SPECS_SECOND_COLUMN = ["TYPE", "FINISH", "COLORS"];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export function Product() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [product, setProduct] = useState<ProductType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    setQuantity(1);
    setSpecsOpen(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const current = await fetchProductById(id);
        if (cancelled) return;
        setProduct(current);

        const related = await fetchProducts({
          page: 1,
          limit: 12,
          sort_by: "title",
          order: "asc",
        });
        if (cancelled) return;
        setRelatedProducts(
          related.items
            .filter(
              (item) =>
                item.id !== current.id && item.category === current.category,
            )
            .slice(0, 3),
        );
      } catch (err) {
        if (!cancelled) {
          setProduct(null);
          setRelatedProducts([]);
          setError(err instanceof Error ? err.message : "Product not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const increaseQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (value: string) => {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.max(1, parsed));
  };

  const description = product
    ? product.description ??
      `High-quality ${product.category.toLowerCase()} for your project.`
    : "";

  const technicalSpecs = product?.technicalSpecs ?? FALLBACK_SPECS;
  const specsByLabel = useMemo(
    () => new Map(technicalSpecs.map((row) => [row.label.toUpperCase(), row])),
    [technicalSpecs],
  );
  const getSpecsForLabels = (labels: string[]) =>
    labels.map((label) => specsByLabel.get(label)).filter((row): row is TechnicalSpec => Boolean(row));

  const overrideColumns = product ? SPEC_COLUMNS_BY_TITLE[product.name] : undefined;
  const firstSpecColumn = overrideColumns
    ? getSpecsForLabels(overrideColumns.left)
    : getSpecsForLabels(SPECS_FIRST_COLUMN);
  const secondSpecColumn = overrideColumns
    ? getSpecsForLabels(overrideColumns.right)
    : getSpecsForLabels(SPECS_SECOND_COLUMN);
  const knownLabels = new Set([...(overrideColumns?.left ?? SPECS_FIRST_COLUMN), ...(overrideColumns?.right ?? SPECS_SECOND_COLUMN)]);
  const remainingSpecs = technicalSpecs.filter((row) => !knownLabels.has(row.label.toUpperCase()));
  const hasKnownColumns = firstSpecColumn.length > 0 || secondSpecColumn.length > 0;
  const leftSpecs = hasKnownColumns ? [...firstSpecColumn, ...remainingSpecs] : remainingSpecs;
  const rightSpecs = hasKnownColumns ? secondSpecColumn : [];
  const getSpecRowClassName = (label: string) =>
    `${styles.specRow} ${label.toUpperCase() === "COLORS" ? styles.specRowNoUnderline : ""}`;

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <h1 className={styles.h1}>Loading...</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p className={styles.breadcrumbs}>
              <Link to="/">Products</Link> <span aria-hidden="true">/</span>{" "}
              Not found
            </p>
            <h1 className={styles.h1}>Product not found</h1>
            {error ? <p>{error}</p> : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.breadcrumbs}>
            <Link to="/">Products</Link> <span aria-hidden="true">/</span>{" "}
            {product.name}
          </p>

          <div className={styles.layout}>
            <div className={styles.media}>
              <ImageCarousel
                images={product.images ?? [product.imageUrl]}
                alt={product.name}
              />
            </div>

            <div className={styles.panel}>
              <h1 className={styles.h1}>{product.name}</h1>
              <div className={styles.metaRow}>
                <Rating value={product.rating} />
              </div>
              <div className={styles.priceRow}>
                <div className={styles.price}>{formatPrice(product.price)}</div>
                <div className={styles.unit}>/unit</div>
              </div>

              <div className={styles.badges}>
                <div className={styles.badge}>
                  <div className={styles.badgeTitle}>
                    <span className={styles.badgeIcon} aria-hidden="true">
                      <BadgeBoxIcon />
                    </span>
                    Quality Assured
                  </div>
                  <div className={styles.badgeText}>Premium grade material</div>
                </div>
                <div className={styles.badge}>
                  <div className={styles.badgeTitle}>
                    <span className={styles.badgeIcon} aria-hidden="true">
                      <BadgeTruckIcon />
                    </span>
                    Fast Delivery
                  </div>
                  <div className={styles.badgeText}>2-5 business days</div>
                </div>
                <div className={styles.badge}>
                  <div className={styles.badgeTitle}>
                    <span className={styles.badgeIcon} aria-hidden="true">
                      <BadgeShieldIcon />
                    </span>
                    Warranty
                  </div>
                  <div className={styles.badgeText}>30-day guarantee</div>
                </div>
              </div>

              <div className={styles.qtyRow}>
                <div className={styles.qtyLabel}>Quantity</div>
                <div className={styles.qty}>
                  <button className={styles.qtyBtn} onClick={decreaseQty} type="button">
                    -
                  </button>
                  <input
                    className={styles.qtyInput}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(event.target.value)}
                    aria-label="Quantity"
                  />
                  <button className={styles.qtyBtn} onClick={increaseQty} type="button">
                    +
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primary}
                  type="button"
                  onClick={() => {
                    void addToCart(product, quantity);
                  }}
                >
                  <CartIcon className={styles.primaryIcon} />
                  Add to Cart
                </button>
                <button className={styles.secondary} type="button">
                  Buy Now
                </button>
              </div>

              <section className={styles.about}>
                <h2 className={styles.h2}>Description</h2>
                <p className={styles.p}>{description}</p>

                <div className={styles.specCard}>
                  <button
                    className={styles.specToggle}
                    type="button"
                    aria-expanded={specsOpen}
                    onClick={() => setSpecsOpen((open) => !open)}
                  >
                    <span>Technical Specifications</span>
                    <span
                      className={specsOpen ? styles.specChevronOpen : styles.specChevron}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {specsOpen ? (
                    <div className={styles.specBody}>
                      <div className={styles.specColumns}>
                        <div className={styles.specList}>
                          {leftSpecs.map((row) => (
                            <div key={row.label} className={getSpecRowClassName(row.label)}>
                              <div className={styles.specLabel}>{row.label}</div>
                              <div className={styles.specValue}>{row.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className={styles.specList}>
                          {rightSpecs.map((row) => (
                            <div key={row.label} className={getSpecRowClassName(row.label)}>
                              <div className={styles.specLabel}>{row.label}</div>
                              <div className={styles.specValue}>{row.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </div>

          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>Related Products</h2>
            {relatedProducts.length > 0 ? (
              <div className={styles.relatedList}>
                {relatedProducts.map((related) => (
                  <ProductCard key={related.id} product={related} />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
