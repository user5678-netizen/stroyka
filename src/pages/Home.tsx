import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { SlidersIcon } from "../components/icons";
import { fetchProducts } from "../api/products";
import type { Product } from "../types";
import styles from "./Home.module.css";

type SortValue = "name-asc" | "price-asc" | "price-desc";
const PRICE_MIN = 0;
const PRICE_MAX = 400;
const RATING_FILTERS = [5, 4, 3] as const;

export function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";

  const [sortBy, setSortBy] = useState<SortValue>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<number>(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState<number>(PRICE_MAX);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const minRating = useMemo(
    () => (selectedRatings.length ? Math.min(...selectedRatings) : undefined),
    [selectedRatings],
  );

  useEffect(() => {
    let cancelled = false;
    const sort_by = sortBy.startsWith("price") ? "price" : "title";
    const order = sortBy === "price-desc" ? "desc" : "asc";

    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchProducts({
          page: 1,
          limit: 48,
          search: search || undefined,
          min_price: minPrice,
          max_price: maxPrice,
          min_rating: minRating,
          sort_by,
          order,
        });
        if (!cancelled) {
          setProducts(result.items);
          setTotalItems(result.meta.total_items);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setTotalItems(0);
          setError(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [maxPrice, minPrice, minRating, search, sortBy]);

  const toggleRating = (value: number) => {
    setSelectedRatings((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const clearFilters = () => {
    setSelectedRatings([]);
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <h1 className={styles.h1}>Building Materials</h1>
            <p className={styles.subtitle}>
              Premium construction supplies for all your projects
            </p>
          </section>

          <section className={styles.controls} aria-label="Product controls">
            <button
              className={styles.filters}
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
            >
              <SlidersIcon />
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </button>

            <div className={styles.count}>
              {loading ? "Loading..." : `Showing ${totalItems} products`}
              {search ? ` for “${search}”` : ""}
            </div>

            <div className={styles.sort}>
              <span className={styles.sortLabel}>Sort by:</span>
              <select
                className={styles.select}
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortValue)}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </section>

          {filtersOpen ? (
            <section id="filters-panel" className={styles.filtersPanel} aria-label="Filters">
              <div className={styles.filtersGrid}>
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Minimum Rating</div>
                  <div className={styles.ratingChecks}>
                    {RATING_FILTERS.map((rating) => {
                      const checked = selectedRatings.includes(rating);
                      return (
                        <label key={rating} className={styles.ratingItem}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRating(rating)}
                          />
                          <span>{rating}+ Stars</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Price Range</div>
                  <div className={styles.rangeWrap}>
                    <div className={styles.rangeTrack} />
                    <input
                      className={styles.rangeInput}
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={1}
                      value={minPrice}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setMinPrice(Math.min(value, maxPrice));
                      }}
                      aria-label="Minimum price range"
                    />
                    <input
                      className={styles.rangeInput}
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={1}
                      value={maxPrice}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setMaxPrice(Math.max(value, minPrice));
                      }}
                      aria-label="Maximum price range"
                    />
                  </div>
                  <div className={styles.rangeLabels}>
                    <span>${PRICE_MIN}</span>
                    <span>${PRICE_MAX}</span>
                  </div>
                </div>

                <div className={styles.filterActions}>
                  <button className={styles.clearAllFilters} type="button" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {error ? (
            <p role="alert" style={{ color: "#b42318", marginTop: 16 }}>
              {error}. Make sure backend is running at http://localhost:3000
            </p>
          ) : null}

          <section className={styles.grid} aria-label="Products">
            {!loading && !error && products.length === 0 ? (
              <p>No products found.</p>
            ) : null}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
