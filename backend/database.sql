-- SQL til at oprette tabeller til Faktura-Generator

-- Brugere
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Firma-indstillinger (per bruger)
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  company_address TEXT,
  company_cvr VARCHAR(20),
  company_email VARCHAR(255),
  company_phone VARCHAR(50),
  bank_name VARCHAR(255),
  bank_account VARCHAR(50),
  reg_number VARCHAR(20),
  account_number VARCHAR(50),
  payment_terms INT DEFAULT 14,
  vat_rate DECIMAL(5,2) DEFAULT 25.00,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fakturaer
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  customer_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_cvr VARCHAR(20),
  customer_ean VARCHAR(20),
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_total DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 25.00,
  due_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_terms INT DEFAULT 14,
  status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Kunder
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT,
  cvr VARCHAR(20),
  ean VARCHAR(20),
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skabeloner
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  html TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Standard data
INSERT INTO users (email, password_hash, name, plan)
VALUES ('demo@faktura.dk', '$2a$10$demo', 'Demo Bruger', 'free')
ON CONFLICT DO NOTHING;
