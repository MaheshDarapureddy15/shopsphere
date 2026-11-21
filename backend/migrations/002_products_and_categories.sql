-- Ensure the full catalog shape is compatible with the initial schema.
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10, 2) CHECK (discount_price >= 0),
  sku VARCHAR(80) UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO categories (name, slug, description) VALUES
  ('Electronics', 'electronics', 'Devices, gadgets, accessories, and electronics'),
  ('Fashion', 'fashion', 'Clothing, footwear, and everyday fashion'),
  ('Home & Living', 'home-living', 'Furniture, decor, kitchen, and home essentials'),
  ('Books & Stationery', 'books-stationery', 'Books, notebooks, and stationery')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  category_id, name, slug, description, price, sku, stock, image_url, is_featured
)
SELECT
  c.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.slug || '-sku',
  p.stock,
  p.image_url,
  p.is_featured
FROM (VALUES
  ('electronics', 'Noise-Cancelling Wireless Headphones', 'wireless-anc-headphones', 'Over-ear Bluetooth 5.3 headphones with 40-hour battery life and active noise cancellation.', 4999.00, 25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', true),
  ('electronics', 'Mechanical Gaming Keyboard RGB', 'mechanical-rgb-keyboard', 'Compact 75% hot-swappable mechanical keyboard with tactile brown switches and customizable backlight.', 3499.00, 18, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&q=80', true),
  ('electronics', 'Smart Fitness Watch Pro', 'smart-fitness-watch-pro', 'AMOLED display smartwatch with SpO2 tracking, heart-rate monitor, and 10-day battery.', 2999.00, 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', true),
  ('fashion', 'Classic Cotton Oversized Hoodie', 'cotton-oversized-hoodie', 'Heavyweight 380 GSM brushed fleece cotton hoodie in charcoal grey for everyday comfort.', 1499.00, 40, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80', true),
  ('fashion', 'Minimalist Everyday Canvas Sneakers', 'minimalist-canvas-sneakers', 'Breathable organic canvas sneakers with cushioned memory-foam insoles.', 1899.00, 22, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80', false),
  ('home-living', 'Ceramic Pour-Over Coffee Dripper Set', 'ceramic-coffee-dripper-set', 'Handcrafted ribbed ceramic coffee dripper with matching 600ml glass server.', 1299.00, 15, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80', true),
  ('home-living', 'Warm LED Desk Lamp with Wireless Charger', 'led-desk-lamp-charger', 'Eye-care dimmable study lamp with built-in 15W Qi wireless phone charging base.', 2199.00, 12, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', false),
  ('books-stationery', 'Dot-Grid Hardcover Engineering Notebook', 'dot-grid-hardcover-notebook', 'A5 lay-flat notebook with 200 pages of 120gsm fountain-pen-friendly ivory paper.', 499.00, 60, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80', false)
) AS p(cat_slug, name, slug, description, price, stock, image_url, is_featured)
JOIN categories c ON c.slug = p.cat_slug
ON CONFLICT (slug) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
