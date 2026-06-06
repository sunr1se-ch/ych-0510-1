import { Database } from 'sql.js';
import { SampleRecord } from '../../shared/types.js';

export class SampleRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findByFilter(segments: string[], startDate: string, endDate: string): SampleRecord[] {
    let sql = `
      SELECT s.id, s.node_id, s.sample_time, s.corrosion_potential, s.tide_level
      FROM sample_record s
      INNER JOIN buoy_node n ON s.node_id = n.node_id
      WHERE s.sample_time >= ? AND s.sample_time <= ?
    `;
    const params: (string | number)[] = [startDate + ' 00:00:00', endDate + ' 23:59:59'];

    if (segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND n.segment IN (${placeholders})`;
      params.push(...segments);
    }

    sql += ' ORDER BY s.node_id, s.sample_time';

    const result = this.db.exec(sql, params);
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0] as number,
      nodeId: row[1] as string,
      sampleTime: row[2] as string,
      corrosionPotential: row[3] as number,
      tideLevel: row[4] as number,
    }));
  }

  insertMany(records: Omit<SampleRecord, 'id'>[]): number {
    const stmt = this.db.prepare(
      'INSERT INTO sample_record (node_id, sample_time, corrosion_potential, tide_level) VALUES (?, ?, ?, ?)'
    );
    let count = 0;
    records.forEach(r => {
      stmt.run([r.nodeId, r.sampleTime, r.corrosionPotential, r.tideLevel]);
      count++;
    });
    stmt.free();
    return count;
  }

  countByFilter(segments: string[], startDate: string, endDate: string): number {
    let sql = `
      SELECT COUNT(*) as cnt
      FROM sample_record s
      INNER JOIN buoy_node n ON s.node_id = n.node_id
      WHERE s.sample_time >= ? AND s.sample_time <= ?
    `;
    const params: (string | number)[] = [startDate + ' 00:00:00', endDate + ' 23:59:59'];

    if (segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND n.segment IN (${placeholders})`;
      params.push(...segments);
    }

    const result = this.db.exec(sql, params);
    if (result.length === 0) return 0;
    return result[0].values[0][0] as number;
  }
}
