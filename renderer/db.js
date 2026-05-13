const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/spotmanager.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS provider_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        rif TEXT,
        legal_rep TEXT,
        provider_type_id INTEGER,
        FOREIGN KEY(provider_type_id) REFERENCES provider_types(id)
      )
    `);

    // ===== MÓDULO 2: Servicios de publicidad =====
db.run(`
  CREATE TABLE IF NOT EXISTS ad_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    frequency TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS ad_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS ad_package_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER,
    service_id INTEGER,
    FOREIGN KEY(package_id) REFERENCES ad_packages(id),
    FOREIGN KEY(service_id) REFERENCES ad_services(id)
  )
`);


// ===== MÓDULO 3: Servicios de mantenimiento =====
db.run(`
  CREATE TABLE IF NOT EXISTS maintenance_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost REAL NOT NULL
  )
`);


    const initialTypes = [
      'Pago adelantado',
      'Pago mensual',
      'Convenio',
      'Intercambio',
      'Honorarios profesionales',
      'Asesorias',
      'Servicio Técnico'
    ];

    initialTypes.forEach(type => {
      db.run(`INSERT OR IGNORE INTO provider_types (name) VALUES (?)`, [type]);
    });
  });
}

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { initDatabase, dbQuery };
