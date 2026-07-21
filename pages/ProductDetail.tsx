import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BrandedProductImage from '../components/brand/BrandedProductImage';
import { usePageMotion } from '../hooks/usePageMotion';
import { calculateShippingCost, cloneShippingConfig, getFreeShippingProgress, getShippingTierDetails } from '../lib/shipping';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const product = products.find(item => item.id === id);
  const relatedProducts = products.filter(item => item.id !== id).slice(0, 3);

  usePageMotion(rootRef, id || 'missing');
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  if (!product) {
    return (
      <div className="page-shell">
        <div className="page-width empty-state" style={{ marginTop: 80 }}>
          <h1 className="display" style={{ fontSize: 48 }}>That product has left the bench.</h1>
          <p className="body-copy">Head back to the shop and choose from the current batch.</p>
          <Link className="button button--primary" to="/shop">Back to shop <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  const shippingConfig = cloneShippingConfig(settings.shippingConfig);
  const subtotal = product.price * quantity;
  const weightGrams = (product.weight || shippingConfig.defaultWeightGrams) * quantity;
  const standardShipping = calculateShippingCost({
    shippingConfig,
    totalWeightGrams: weightGrams,
    subtotal,
    method: 'standard',
  });
  const tier = getShippingTierDetails(shippingConfig, weightGrams);
  const freeShipping = getFreeShippingProgress(shippingConfig, subtotal);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    setAdded(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div ref={rootRef} className="page-shell detail-page">
      <main className="page-width" style={{ paddingTop: 52 }}>
        <button type="button" className="back-link" onClick={() => navigate(-1)} data-reveal>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="detail-layout">
          <div className="detail-media" data-reveal>
            <BrandedProductImage product={product} variant="detail" />
          </div>

          <div className="detail-info" data-reveal>
            <p className="eyeline">{product.category || 'Small batch'}</p>
            <h1 className="display">{product.name}</h1>
            <p className="detail-info__price">${product.price.toFixed(2)}</p>
            <p className="body-copy detail-info__description">{product.description}</p>

            <div className="detail-traits" aria-label="Product qualities">
              <span>Hand packed</span>
              <span>Bold flavour</span>
              <span>{product.weight ? `${product.weight} g` : 'Small batch'}</span>
            </div>

            <div className="shipping-note">
              <strong>
                {standardShipping === 0
                  ? 'Free standard shipping for this quantity'
                  : `Standard shipping from $${standardShipping.toFixed(2)}`}
              </strong>
              <p>
                {tier.label ? `${tier.label}. ` : ''}
                {freeShipping.unlocked
                  ? `Free standard shipping is unlocked.`
                  : `Add $${freeShipping.amountRemaining.toFixed(2)} more for free standard shipping over $${freeShipping.threshold.toFixed(0)}.`}
              </p>
            </div>

            <div className="purchase-row">
              <div className="quantity-control" aria-label="Quantity">
                <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Decrease quantity">
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(value => Math.min(product.stock, value + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'Sold out' : added ? <><Check size={17} /> Added to basket</> : <><ShoppingBag size={17} /> Add to basket</>}
              </button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="related-section" aria-labelledby="related-title">
            <div className="section-head" data-scroll-reveal>
              <div>
                <p className="eyeline">More from the bench</p>
                <h2 id="related-title" className="display">Keep the batch moving.</h2>
              </div>
              <Link className="section-link" to="/shop">View all products <ArrowRight size={16} /></Link>
            </div>
            <div className="product-grid">
              {relatedProducts.map(item => (
                <article key={item.id} className="product-card" data-scroll-reveal>
                  <Link to={`/product/${item.id}`} className="product-card__media" style={{ display: 'block' }}>
                    <BrandedProductImage product={item} />
                  </Link>
                  <div className="product-card__meta">
                    <div>
                      <p className="product-card__category">{item.category || 'Small batch'}</p>
                      <h3>{item.name}</h3>
                    </div>
                    <span className="product-card__price">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="product-card__desc">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default ProductDetail;
