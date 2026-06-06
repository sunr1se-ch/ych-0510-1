import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'observatory.db');

let db: Database | null = null;

async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  let dbData: Uint8Array | null = null;
  if (fs.existsSync(DB_FILE)) {
    dbData = fs.readFileSync(DB_FILE);
  }

  db = new SQL.Database(dbData);

  db.run(`
    CREATE TABLE IF NOT EXISTS buoy_node (
      node_id TEXT PRIMARY KEY,
      segment TEXT NOT NULL,
      depth REAL NOT NULL,
      position_in_segment INTEGER NOT NULL,
      UNIQUE(segment, position_in_segment)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sample_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id TEXT NOT NULL,
      sample_time DATETIME NOT NULL,
      corrosion_potential REAL NOT NULL,
      tide_level REAL NOT NULL,
      FOREIGN KEY (node_id) REFERENCES buoy_node(node_id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_sample_time ON sample_record(sample_time)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sample_node ON sample_record(node_id)');

  const nodeCount = db.exec('SELECT COUNT(*) as cnt FROM buoy_node')[0].values[0][0] as number;
  if (nodeCount === 0) {
    await loadSeedData();
  }

  saveDatabase();

  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

async function loadSeedData() {
  if (!db) return;

  const nodesPath = path.join(DATA_DIR, 'buoy_nodes.csv');
  if (fs.existsSync(nodesPath)) {
    const nodes = await parseCsv(nodesPath);
    const stmt = db.prepare('INSERT OR IGNORE INTO buoy_node (node_id, segment, depth, position_in_segment) VALUES (?, ?, ?, ?)');
    nodes.forEach(row => {
      stmt.run([row.nodeId, row.segment, parseFloat(row.depth), parseInt(row.positionInSegment)]);
    });
    stmt.free();
    console.log(`Loaded ${nodes.length} buoy nodes from seed data`);
  }

  const samplesPath = path.join(DATA_DIR, 'sample_records.csv');
  if (fs.existsSync(samplesPath)) {
    const samples = await parseCsv(samplesPath);
    const stmt = db.prepare('INSERT INTO sample_record (node_id, sample_time, corrosion_potential, tide_level) VALUES (?, ?, ?, ?)');
    samples.forEach(row => {
      stmt.run([row.nodeId, row.sampleTime, parseFloat(row.corrosionPotential), parseFloat(row.tideLevel)]);
    });
    stmt.free();
    console.log(`Loaded ${samples.length} sample records from seed data`);
  }
}

function parseCsv(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const normalized: Record<string, string> = {};
        Object.keys(data).forEach(key => {
          const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          normalized[camelKey] = data[key].trim();
        });
        results.push(normalized);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export { initDatabase, getDb, saveDatabase };
