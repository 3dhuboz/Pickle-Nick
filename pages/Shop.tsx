import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BrandedProductImage from '../components/brand/BrandedProductImage';
import { NICK_LOGO_SRC } from '../components/brand/NickLogo';
import { usePageMotion } from '../hooks/usePageMotion';

const Shop = () => {
  const { products, categories, addToCart } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const availableCategoryNames = ['All', ...new Set([
    ...categories.map(category => category.name),
    ...products.map(product => product.category).filter(Boolean),
  ])];

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === 'All' || product.category === filter;
    const matchesSearch = !normalizedSearch
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.description.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find(category => category.name === filter);
  usePageMotion(rootRef, `${filter}:${normalizedSearch}`);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleQuickAdd = (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product || product.stock <= 0) return;
    addToCart(product, 1);
    setAddedId(product.id);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAddedId(null), 1400);
  };

  return (
    <div ref={rootRef} className="page-shell">
      <header className="page-hero">
        <div className="page-width page-hero__row">
          <div>
            <img className="page-hero__logo" src={NICK_LOGO_SRC} alt="Pickle Nick" data-reveal />
            <p className="eyeline" data-reveal>The current batch</p>
            <h1 className="display" data-reveal>Pick your bite.</h1>
          </div>
          <p className="body-copy" data-reveal>
            {activeCategory?.description || 'Crunchy pickles, bright chilli sauce, smoky heat, and small-batch experiments from Nick’s bench.'}
          </p>
        </div>
      </header>

      <section className="page-width" aria-label="Shop controls">
        <div className="filter-bar" data-reveal>
          <label className="search-field">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search the batch"
              aria-label="Search products"
            />
          </label>
          <div className="filter-options" aria-label="Product categories">
            {availableCategoryNames.map(category => (
              <button
                key={category}
                type="button"
                className={`filter-chip ${filter === category ? 'is-active' : ''}`}
                onClick={() => setFilter(category)}
                aria-pressed={filter === category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="page-width" style={{ paddingBottom: 110 }}>
        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <article key={product.id} className="product-card" data-scroll-reveal>
                <Link to={`/product/${product.id}`} className="product-card__media" style={{ display: 'block' }}>
                  <BrandedProductImage product={product} />
                </Link>
                <div className="product-card__meta">
                  <div style={{ minWidth: 0 }}>
                    <p className="product-card__category">{product.category || 'Small batch'}</p>
                    <h2>{product.name}</h2>
                  </div>
                  <span className="product-card__price">${product.price.toFixed(2)}</span>
                </div>
                <p className="product-card__desc">{product.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22 }}>
                  <Link className="section-link" to={`/product/${product.id}`}>View product <ArrowRight size={15} /></Link>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleQuickAdd(product.id)}
                    disabled={product.stock <= 0}
                    title={product.stock > 0 ? `Add ${product.name} to basket` : 'Sold out'}
                    aria-label={product.stock > 0 ? `Add ${product.name} to basket` : `${product.name} is sold out`}
                  >
                    {addedId === product.id ? <Check size={17} /> : <Plus size={17} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state" data-scroll-reveal>
            <h2 className="display">Nothing matches that search.</h2>
            <p className="body-copy">Clear the filters and bring the full batch back.</p>
            <button type="button" className="button button--line" onClick={() => { setFilter('All'); setSearch(''); }}>
              Reset filters <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
