-- Seed data for Pickle Nick D1 database
-- Run: npm run db:seed

-- App settings (default)
INSERT OR IGNORE INTO app_settings (key, data, updated_at) VALUES (
  'main',
  '{"fbAppId":"","fbAppSecret":"","squareApplicationId":"","squareAccessToken":"","squareLocationId":"","lowStockThreshold":10,"gstEnabled":true,"gstRate":10,"emailConfig":{"enabled":false,"adminEmail":"","fromName":"Pickle Nick","fromEmail":"noreply@picklenick.au","emailProvider":"resend","resendApiKey":"","smtpEndpoint":""},"shippingConfig":{"carrierName":"Australia Post","trackingBaseUrl":"https://auspost.com.au/mypost/track/#/details/","freeShippingThreshold":90,"defaultWeightGrams":500,"rates":[{"maxWeightGrams":500,"standardPrice":8.95,"expressPrice":13.95},{"maxWeightGrams":1000,"standardPrice":10.95,"expressPrice":16.95},{"maxWeightGrams":2000,"standardPrice":13.95,"expressPrice":21.95},{"maxWeightGrams":5000,"standardPrice":16.95,"expressPrice":26.95},{"maxWeightGrams":10000,"standardPrice":22.95,"expressPrice":34.95}]}}',
  unixepoch() * 1000
);

-- Site content (default)
INSERT OR IGNORE INTO site_content (key, data, updated_at) VALUES (
  'main',
  '{"general":{"brandName":"Pickle Nick","logoUrl":"/brand/pickle-nick-logo.jpg","faviconUrl":"/brand/pickle-nick-logo.jpg","tagline":"Bold. Brined. Brilliant.","siteUrl":"https://picklenick.au","seoDescription":"Small-batch pickles, hot sauce, and bold jars with Nick''s mark.","email":"hello@picklenick.au","phone":"","address":"Australia","mascotUrl1":"","mascotUrl2":""},"home":{"heroHeading":"Bold. Brined. Brilliant.","heroSubheading":"Small-batch pickles & hot sauce","heroText":"Small-batch crunch, bold heat, and Nick''s mark on every jar.","heroImage":"","founderImage":"","galleryImage1":"","galleryImage2":"","galleryImage3":""},"about":{"heading":"About Pickle Nick","text":"We make small-batch pickles and hot sauces with real ingredients, sharp brine, and the kind of heat that bites back."}}',
  unixepoch() * 1000
);

-- Sample categories
INSERT OR IGNORE INTO categories (id, name, image, description, updated_at) VALUES
  ('cat_pickles', 'Pickles', '', 'Classic and creative pickled vegetables', unixepoch() * 1000),
  ('cat_sauces', 'Hot Sauces', '', 'Fiery, flavourful hot sauces for every occasion', unixepoch() * 1000),
  ('cat_ferments', 'Brine Specials', '', 'Small-batch experiments from Nick''s counter', unixepoch() * 1000),
  ('cat_bundles', 'Bundles', '', 'Mix and match value packs', unixepoch() * 1000);

-- Sample products
INSERT OR IGNORE INTO products (id, name, description, price, stock, image, category, featured, weight, updated_at) VALUES
  ('prod_dill_classic', 'Nick''s Dill Bite', 'Crisp cucumbers in a sharp dill brine with a clean snap and a bold finish.', 12.95, 48, '', 'Pickles', 1, 450, unixepoch() * 1000),
  ('prod_bread_butter', 'Bread & Butter Flash', 'Sweet, tangy sliced pickles cut for burgers, sandwiches, and late-night raids on the fridge.', 11.95, 32, '', 'Pickles', 0, 400, unixepoch() * 1000),
  ('prod_spicy_garlic', 'Garlic Gunpowder Dills', 'Classic dill crunch with a fiery garlic kick and Nick''s small-batch stamp.', 13.95, 25, '', 'Pickles', 1, 450, unixepoch() * 1000),
  ('prod_hot_sauce_original', 'Habanero Bite Sauce', 'A bright chilli hit with vinegar snap, deep heat, and a clean pour.', 9.95, 60, '', 'Hot Sauces', 1, 200, unixepoch() * 1000),
  ('prod_hot_sauce_smoky', 'Smoked Red Chilli Sauce', 'Slow, smoky chilli heat built for grilled meat, eggs, tacos, and brave sandwiches.', 10.95, 40, '', 'Hot Sauces', 0, 200, unixepoch() * 1000),
  ('prod_mixed_veg', 'Mixed Veg Battle Brine', 'Crunchy mixed vegetables in a punchy brine with chilli, garlic, and serious character.', 14.95, 20, '', 'Brine Specials', 1, 500, unixepoch() * 1000),
  ('prod_cabbage_brine', 'Cabbage War Cry', 'A lean cabbage brine with a clean sour edge and plenty of bite.', 11.95, 18, '', 'Brine Specials', 0, 450, unixepoch() * 1000),
  ('prod_starter_bundle', 'Pickle Nick Starter Bundle', 'The perfect introduction - one Dill Bite, one Garlic Gunpowder, and one Habanero Bite Sauce.', 32.95, 15, '', 'Bundles', 1, 1050, unixepoch() * 1000);
