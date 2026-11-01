WITH replacements(id, expected_image, new_image) AS (
  VALUES
    ('prod_bourbon_glaze', 'https://picklenick.au/brand/products/bourbon-glaze-studio-v2.webp', 'https://picklenick.au/api/r2/file/client-images/30fdb2bf-c21c-4297-89bb-f5765f23a3ea.jpg'),
    ('prod_burger_onions', 'https://picklenick.au/brand/products/red-onions-label.webp', 'https://picklenick.au/api/r2/file/client-images/df2b8a84-cd79-47db-b4a1-2f476289e587.jpg'),
    ('prod_carrot', 'https://picklenick.au/brand/products/carrots-label.webp', 'https://picklenick.au/api/r2/file/client-images/1277677b-6b66-4984-a35a-052b5560e3f4.jpg'),
    ('prod_cauliflower', 'https://picklenick.au/brand/products/cauliflower-label.webp', 'https://picklenick.au/api/r2/file/client-images/24945307-4890-4e00-9310-f66cee13965d.jpg'),
    ('prod_cucumbers', 'https://picklenick.au/brand/products/cucumbers-label.webp', 'https://picklenick.au/api/r2/file/client-images/f6b182ca-0930-4d88-ae18-ff1936e5b23e.jpg'),
    ('prod_roast_habanero', 'https://picklenick.au/brand/products/roast-habanero-studio-v2.webp', 'https://picklenick.au/api/r2/file/client-images/cb377e4e-f8e0-4c53-8b3a-51f41db7166d.jpg'),
    ('prod_roast_jalapeno', 'https://picklenick.au/brand/products/roast-jalapeno-studio-v2.webp', 'https://picklenick.au/api/r2/file/client-images/278a4c73-f615-44d9-b974-6213e87ff240.jpg'),
    ('prod_sweet_smokey', 'https://picklenick.au/brand/products/sweet-smokey-studio-v2.webp', 'https://picklenick.au/api/r2/file/client-images/d3173781-0963-4956-b2a7-684e4b8b26a8.jpg')
),
precondition AS MATERIALIZED (
  SELECT COUNT(*) AS matched FROM replacements r
  JOIN products p ON p.id = r.id AND p.image = r.expected_image
)
UPDATE products
SET image = (SELECT r.new_image FROM replacements r WHERE r.id = products.id)
WHERE id IN (SELECT id FROM replacements)
  AND (SELECT matched FROM precondition) = 8;
