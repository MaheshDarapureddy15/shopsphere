INSERT INTO categories (name, slug, description) VALUES
  ('Sports & Fitness', 'sports-fitness', 'Workout gear, sports equipment, and fitness essentials'),
  ('Accessories', 'accessories', 'Bags, jewellery, watches, and everyday accessories'),
  ('Kitchen & Dining', 'kitchen-dining', 'Cookware, dining sets, and modern kitchen essentials'),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Skincare, grooming, beauty, and personal care products')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  category_id, name, slug, description, price, sku, stock, image_url, is_featured
)
SELECT c.id, p.name, p.slug, p.description, p.price,
       p.slug || '-sku', p.stock, p.image_url, p.is_featured
FROM (VALUES
  ('electronics', 'Portable Bluetooth Party Speaker', 'portable-bluetooth-party-speaker', 'A rugged wireless speaker with 360-degree sound, deep bass, and a 16-hour battery.', 3499.00, 28, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', false),
  ('electronics', '4K USB-C Portable Monitor', '4k-usbc-portable-monitor', 'A slim 15.6-inch 4K portable monitor with USB-C display input and built-in stand.', 12999.00, 10, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80', true),
  ('electronics', 'Smart Home Wi-Fi Camera', 'smart-home-wifi-camera', 'A 1080p indoor security camera with night vision, two-way audio, and motion alerts.', 2499.00, 35, 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=600&q=80', false),
  ('electronics', 'Fast-Charging Wireless Power Bank', 'fast-charging-wireless-power-bank', 'A 20,000mAh power bank with 22.5W wired and 15W wireless fast charging.', 2799.00, 42, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80', false),

  ('fashion', 'Women''s Linen Summer Co-ord', 'womens-linen-summer-coord', 'A breathable linen-blend two-piece co-ord set tailored for warm, relaxed days.', 2299.00, 24, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80', true),
  ('fashion', 'Men''s Classic Leather Jacket', 'mens-classic-leather-jacket', 'A modern fitted leather jacket with a soft lining and durable metal hardware.', 5999.00, 14, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', false),
  ('fashion', 'Premium Cotton Chinos', 'premium-cotton-chinos', 'Slim-straight stretch-cotton chinos with a polished finish for work or weekends.', 1799.00, 38, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80', false),
  ('fashion', 'Running Athletic Shoes', 'running-athletic-shoes', 'Lightweight running shoes with responsive cushioning and breathable mesh uppers.', 3499.00, 32, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', true),

  ('home-living', 'Minimal Oak Side Table', 'minimal-oak-side-table', 'A compact solid-oak side table with rounded edges and a natural matte finish.', 3499.00, 12, 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80', false),
  ('home-living', 'Textured Cotton Throw Blanket', 'textured-cotton-throw-blanket', 'A soft handwoven cotton throw with subtle tassels for sofas and reading corners.', 1299.00, 26, 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&q=80', false),
  ('home-living', 'Botanical Ceramic Planter Set', 'botanical-ceramic-planter-set', 'A set of three glazed ceramic planters in complementary earthy shades with drainage trays.', 899.00, 45, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80', true),
  ('home-living', 'Scandinavian Table Clock', 'scandinavian-table-clock', 'A silent wood-and-metal bedside clock with a high-contrast minimal dial.', 799.00, 30, 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&q=80', false),

  ('books-stationery', 'Modern Indian History Hardcover', 'modern-indian-history-hardcover', 'A well-researched illustrated hardcover exploring the people and events shaping modern India.', 699.00, 48, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80', true),
  ('books-stationery', 'Productivity Planner 2026', 'productivity-planner-2026', 'A 12-month undated planner with goal-setting, habit tracking, and weekly review pages.', 549.00, 55, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80', true),
  ('books-stationery', 'Premium Gel Pen Set', 'premium-gel-pen-set', 'A pack of ten 0.5mm quick-drying gel pens in smooth black, blue, and coloured inks.', 349.00, 60, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80', false),
  ('books-stationery', 'Desk Organizer and Pen Holder', 'desk-organizer-pen-holder', 'A bamboo desk organizer with compartments for stationery, cables, and small essentials.', 999.00, 20, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', false),

  ('sports-fitness', 'Adjustable 20 kg Dumbbell Set', 'adjustable-dumbbell-set-20kg', 'A compact spin-lock dumbbell set with adjustable plates for progressive home strength training.', 4499.00, 18, 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=600&q=80', true),
  ('sports-fitness', 'Anti-Slip Yoga Mat 6 mm', 'anti-slip-yoga-mat-6mm', 'A high-density 6mm yoga mat with dual textures, carrying strap, and easy-clean surface.', 1299.00, 50, 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&q=80', true),
  ('sports-fitness', 'Resistance Band Training Kit', 'resistance-band-training-kit', 'Five stackable latex resistance bands with cushioned handles and ankle straps for full-body workouts.', 899.00, 44, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&q=80', false),
  ('sports-fitness', 'Professional Jump Rope', 'professional-jump-rope', 'An adjustable ball-bearing jump rope with lightweight handles for speed, cardio, and conditioning.', 649.00, 58, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', false),

  ('accessories', 'Slim RFID Leather Wallet', 'slim-rfid-leather-wallet', 'A genuine leather bifold wallet with RFID protection and a slim seven-card capacity.', 1199.00, 36, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', true),
  ('accessories', 'Structured Vegan Leather Tote', 'structured-vegan-leather-tote', 'A spacious everyday tote with padded compartments, top zip closure, and vegan leather finish.', 2499.00, 22, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80', true),
  ('accessories', 'Classic Polarized Sunglasses', 'classic-polarized-sunglasses', 'Lightweight polarized sunglasses with UV400 lenses and a timeless metal-frame silhouette.', 1599.00, 30, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80', false),
  ('accessories', 'Minimal Steel Wrist Watch', 'minimal-steel-wrist-watch', 'A slim quartz wrist watch with a sapphire-coated glass face and brushed stainless-steel strap.', 3999.00, 16, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80', true),

  ('kitchen-dining', 'Triply Stainless Steel Cookware Set', 'triply-cookware-set', 'A five-piece induction-compatible cookware set with three-layer bases and riveted handles.', 4999.00, 19, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80', true),
  ('kitchen-dining', 'Handcrafted Ceramic Dinner Set', 'handcrafted-ceramic-dinner-set', 'A 12-piece glazed stoneware dinner set with four plates, bowls, and side dishes.', 2999.00, 24, 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=600&q=80', true),
  ('kitchen-dining', 'Electric Glass Kettle 1.7 L', 'electric-glass-kettle-17l', 'A fast-boiling 1.7-litre kettle with temperature control, auto shut-off, and borosilicate glass.', 1499.00, 34, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80', false),
  ('kitchen-dining', 'Bamboo Chopping Board Set', 'bamboo-chopping-board-set', 'A three-board bamboo set with juice grooves and non-slip feet for organised food preparation.', 799.00, 52, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80', false),

  ('beauty-personal-care', 'Vitamin C Brightening Serum', 'vitamin-c-brightening-serum', 'A lightweight 15% vitamin C serum with hyaluronic acid to brighten and hydrate tired skin.', 999.00, 48, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80', true),
  ('beauty-personal-care', 'Waterproof Volumizing Mascara', 'waterproof-volumizing-mascara', 'A smudge-resistant mascara that adds buildable volume and definition for up to 12 hours.', 699.00, 60, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', false),
  ('beauty-personal-care', 'Cordless Beard Trimmer', 'cordless-beard-trimmer', 'A rechargeable waterproof beard trimmer with 20 length settings and 90-minute runtime.', 1799.00, 27, 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&q=80', true),
  ('beauty-personal-care', 'Premium Bath and Body Gift Set', 'premium-bath-body-gift-set', 'A calming gift set featuring shower gel, body lotion, bath salts, and a reusable linen pouch.', 1499.00, 32, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80', false)
) AS p(cat_slug, name, slug, description, price, stock, image_url, is_featured)
JOIN categories c ON c.slug = p.cat_slug
ON CONFLICT (slug) DO NOTHING;

UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80',
    updated_at = NOW()
WHERE slug = 'triply-cookware-set';

UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80',
    updated_at = NOW()
WHERE slug = 'minimal-oak-side-table';

UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    updated_at = NOW()
WHERE slug = 'waterproof-volumizing-mascara';

