ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';

UPDATE users
SET role = 'admin'
WHERE LOWER(email) = 'mahesh@shopsphere.com';
