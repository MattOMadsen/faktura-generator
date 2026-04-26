// SQLite database wrapper der emulerer pg Pool API
// Bruges lokalt uden PostgreSQL. Byt nemt til PostgreSQL i produktion.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLitePool {
  constructor(dbPath = path.join(__dirname, 'data.sqlite')) {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        plan TEXT DEFAULT 'free',
        stripe_customer_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        company_name TEXT,
        company_address TEXT,
        company_cvr TEXT,
        company_email TEXT,
        company_phone TEXT,
        bank_name TEXT,
        reg_number TEXT,
        account_number TEXT,
        payment_terms INTEGER DEFAULT 14,
        vat_rate REAL DEFAULT 25.00,
        logo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_address TEXT,
        customer_cvr TEXT,
        customer_ean TEXT,
        line_items TEXT DEFAULT '[]',
        subtotal REAL NOT NULL,
        vat_total REAL NOT NULL,
        total REAL NOT NULL,
        vat_rate REAL DEFAULT 25.00,
        due_date TEXT NOT NULL,
        issue_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        payment_terms INTEGER DEFAULT 14,
        status TEXT DEFAULT 'unpaid',
        notes TEXT,
        pdf_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT,
        cvr TEXT,
        ean TEXT,
        phone TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        html TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  _all(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  _run(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async query(sql, params = []) {
    // Konverter PostgreSQL $1, $2... til ? for SQLite
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const action = sqliteSql.trim().split(/\s+/)[0].toLowerCase();

    if (action === 'select') {
      const rows = await this._all(sqliteSql, params);
      return { rows };
    }

    if (action === 'insert') {
      const result = await this._run(sqliteSql, params);
      // Find tabellen
      const match = sqliteSql.match(/into\s+(\w+)/i);
      const table = match ? match[1] : null;
      if (table && result.lastID) {
        const rows = await this._all(`SELECT * FROM ${table} WHERE id = ?`, [result.lastID]);
        return { rows };
      }
      return { rows: [] };
    }

    if (action === 'update') {
      // For simple updates med WHERE id = ?, hent den opdaterede række
      const idMatch = sqliteSql.match(/where\s+id\s*=\s*\?/i);
      const tableMatch = sqliteSql.match(/update\s+(\w+)/i);
      let affectedId = null;

      // Find det sidste ? i WHERE clause
      const whereParts = sqliteSql.split(/where/i);
      if (whereParts.length > 1) {
        // Tæl antal ? før WHERE for at finde rette param index
        const beforeWhere = whereParts[0].match(/\?/g) || [];
        const idx = beforeWhere.length;
        if (params[idx] !== undefined) affectedId = params[idx];
      }

      await this._run(sqliteSql, params);

      if (tableMatch && affectedId) {
        const table = tableMatch[1];
        const rows = await this._all(`SELECT * FROM ${table} WHERE id = ?`, [affectedId]);
        return { rows };
      }
      return { rows: [] };
    }

    if (action === 'delete') {
      await this._run(sqliteSql, params);
      return { rows: [] };
    }

    const rows = await this._all(sqliteSql, params);
    return { rows };
  }
}

module.exports = { SQLitePool };
