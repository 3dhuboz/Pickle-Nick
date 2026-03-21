-- Seed data for Pickle Nick D1 database
-- Run: npm run db:seed

-- App settings (default)
INSERT OR IGNORE INTO app_settings (key, data, updated_at) VALUES (
  'main',
  '{"fbAppId":"","fbAppSecret":"","squareApplicationId":"","squareAccessToken":"","squareLocationId":"","lowStockThreshold":10,"gstEnabled":true,"gstRate":10,"emailConfig":{"enabled":false,"adminEmail":"","fromName":"Pickle Nick","fromEmail":"noreply@picklenick.au","emailProvider":"resend","resendApiKey":"","smtpEndpoint":""},"shippingConfig":{"carrierName":"Australia Post","trackingBaseUrl":"https://auspost.com.au/mypost/track/#/details/","freeShippingThreshold":100,"defaultWeightGrams":500,"rates":[{"maxWeightGrams":500,"standardPrice":9.95,"expressPrice":14.95},{"maxWeightGrams":1000,"standardPrice":12.95,"expressPrice":19.95},{"maxWeightGrams":2000,"standardPrice":16.95,"expressPrice":24.95},{"maxWeightGrams":5000,"standardPrice":22.95,"expressPrice":34.95}]}}',
  unixepoch() * 1000
);

-- Site content (default)
INSERT OR IGNORE INTO site_content (key, data, updated_at) VALUES (
  'main',
  '{"general":{"brandName":"Pickle Nick","logoUrl":"","faviconUrl":"","tagline":"Bold. Brined. Brilliant.","siteUrl":"https://picklenick.au","seoDescription":"Handcrafted artisan pickles and hot sauces made with bold, authentic flavours.","email":"hello@picklenick.au","phone":"","address":"Australia","mascotUrl1":"","mascotUrl2":""},"home":{"heroHeading":"Bold. Brined. Brilliant.","heroSubheading":"Handcrafted pickles & sauces","heroText":"Small-batch, big flavour. Made with love and a whole lot of brine.","heroImage":"","founderImage":"","galleryImage1":"","galleryImage2":"","galleryImage3":""},"about":{"heading":"About Pickle Nick","text":"We make handcrafted pickles and hot sauces the old-fashioned way — with real ingredients, real flavour, and real care."}}',
  unixepoch() * 1000
);

-- Sample categories
INSERT OR IGNORE INTO categories (id, name, image, description, updated_at) VALUES
  ('cat_pickles', 'Pickles', '', 'Classic and creative pickled vegetables', unixepoch() * 1000),
  ('cat_sauces', 'Hot Sauces', '', 'Fiery, flavourful hot sauces for every occasion', unixepoch() * 1000),
  ('cat_ferments', 'Ferments', '', 'Live-culture fermented foods packed with goodness', unixepoch() * 1000),
  ('cat_bundles', 'Bundles', '', 'Mix and match value packs', unixepoch() * 1000);

-- Sample products
INSERT OR IGNORE INTO products (id, name, description, price, stock, image, category, featured, weight, updated_at) VALUES
  ('prod_dill_classic', 'Classic Dill Pickles', 'Crisp cucumbers fermented in a traditional dill brine. Crunchy, tangy, and utterly addictive.', 12.95, 48, '', 'Pickles', 1, 450, unixepoch() * 1000),
  ('prod_bread_butter', 'Bread & Butter Chips', 'Sweet and tangy sliced pickles with a hint of mustard seed. Perfect on burgers and sandwiches.', 11.95, 32, '', 'Pickles', 0, 400, unixepoch() * 1000),
  ('prod_spicy_garlic', 'Spicy Garlic Dills', 'Classic dill pickles with a fiery garlic kick. Not for the faint-hearted.', 13.95, 25, '', 'Pickles', 1, 450, unixepoch() * 1000),
  ('prod_hot_sauce_original', 'Original Hot Sauce', 'Our signature blend of chillis, vinegar, and secret spices. A staple for any table.', 9.95, 60, '', 'Hot Sauces', 1, 200, unixepoch() * 1000),
  ('prod_hot_sauce_smoky', 'Smoky Chipotle Sauce', 'Deep, smoky chipotle flavour with a slow, satisfying heat. Incredible on tacos.', 10.95, 40, '', 'Hot Sauces', 0, 200, unixepoch() * 1000),
  ('prod_kimchi', 'Classic Kimchi', 'Traditional fermented napa cabbage with Korean chilli paste. Funky, spicy, probiotic-rich.', 14.95, 20, '', 'Ferments', 1, 500, unixepoch() * 1000),
  ('prod_sauerkraut', 'Wild Sauerkraut', 'Simple, pure fermented cabbage made with just cabbage and salt. Naturally preserved goodness.', 11.95, 18, '', 'Ferments', 0, 450, unixepoch() * 1000),
  ('prod_starter_bundle', 'Pickle Nick Starter Bundle', 'The perfect introduction — one Classic Dill, one Spicy Garlic, and one Original Hot Sauce.', 32.95, 15, '', 'Bundles', 1, 1050, unixepoch() * 1000);
