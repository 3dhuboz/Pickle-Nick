import { ShippingConfig, ShippingRate } from '../types';

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  carrierName: 'Australia Post',
  trackingBaseUrl: 'https://auspost.com.au/mypost/track/#/details/',
  freeShippingThreshold: 90,
  defaultWeightGrams: 500,
  rates: [
    { maxWeightGrams: 500, standardPrice: 8.95, expressPrice: 13.95 },
    { maxWeightGrams: 1000, standardPrice: 10.95, expressPrice: 16.95 },
    { maxWeightGrams: 2000, standardPrice: 13.95, expressPrice: 21.95 },
    { maxWeightGrams: 5000, standardPrice: 16.95, expressPrice: 26.95 },
    { maxWeightGrams: 10000, standardPrice: 22.95, expressPrice: 34.95 },
  ],
};

export const cloneShippingConfig = (shippingConfig?: ShippingConfig | null): ShippingConfig => {
  const resolved = shippingConfig ? { ...DEFAULT_SHIPPING_CONFIG, ...shippingConfig } : DEFAULT_SHIPPING_CONFIG;
  const rates = shippingConfig?.rates?.length ? shippingConfig.rates : DEFAULT_SHIPPING_CONFIG.rates;

  return {
    ...resolved,
    rates: rates.map(rate => ({ ...rate })),
  };
};

export const getSortedShippingRates = (shippingConfig?: ShippingConfig | null): ShippingRate[] =>
  cloneShippingConfig(shippingConfig).rates.sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);

export const formatWeightLabel = (grams: number): string =>
  grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg` : `${grams} g`;

export const getShippingTierDetails = (shippingConfig: ShippingConfig | null | undefined, totalWeightGrams: number) => {
  const rates = getSortedShippingRates(shippingConfig);
  const tierIndex = rates.findIndex(rate => totalWeightGrams <= rate.maxWeightGrams);
  const activeIndex = tierIndex >= 0 ? tierIndex : Math.max(rates.length - 1, 0);
  const tier = rates[activeIndex];
  const lowerBound = activeIndex > 0 ? rates[activeIndex - 1].maxWeightGrams : 0;
  const label = tier
    ? lowerBound > 0
      ? `${formatWeightLabel(lowerBound)} - ${formatWeightLabel(tier.maxWeightGrams)}`
      : `Up to ${formatWeightLabel(tier.maxWeightGrams)}`
    : null;

  return {
    rates,
    tier,
    tierIndex: activeIndex,
    lowerBound,
    label,
  };
};

export const calculateShippingCost = ({
  shippingConfig,
  totalWeightGrams,
  subtotal,
  method,
}: {
  shippingConfig: ShippingConfig | null | undefined;
  totalWeightGrams: number;
  subtotal: number;
  method: 'standard' | 'express';
}): number => {
  const config = cloneShippingConfig(shippingConfig);
  const { rates, tier } = getShippingTierDetails(config, totalWeightGrams);

  if (rates.length === 0 || !tier) return method === 'express' ? 15 : 10;
  if (method === 'standard' && subtotal >= config.freeShippingThreshold) return 0;

  return method === 'express' ? tier.expressPrice : tier.standardPrice;
};

export const getFreeShippingProgress = (shippingConfig: ShippingConfig | null | undefined, subtotal: number) => {
  const config = cloneShippingConfig(shippingConfig);
  const threshold = config.freeShippingThreshold;
  const amountRemaining = Math.max(0, threshold - subtotal);
  const progressPercent = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  return {
    threshold,
    amountRemaining,
    progressPercent,
    unlocked: amountRemaining === 0,
  };
};
