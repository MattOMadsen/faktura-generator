-- SQL til at oprette tabeller til Faktura-Generator

-- Brugere (hvis vi tilføjer auth senere)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fakturaer
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  vat DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skabeloner
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  user_id INT REFERENCES users(id)
);

-- Kunder
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT,
  cvr VARCHAR(20),
  user_id INT REFERENCES users(id)
);