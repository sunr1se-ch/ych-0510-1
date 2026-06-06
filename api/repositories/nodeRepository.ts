import { Database } from 'sql.js';
import { BuoyNode } from '../../shared/types.js';

export class NodeRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findAll(): BuoyNode[] {
    const result = this.db.exec(
      'SELECT node_id, segment, depth, position_in_segment FROM buoy_node ORDER BY segment, position_in_segment'
    );
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      nodeId: row[0] as string,
      segment: row[1] as string,
      depth: row[2] as number,
      positionInSegment: row[3] as number,
    }));
  }

  findBySegments(segments: string[]): BuoyNode[] {
    if (segments.length === 0) return this.findAll();
    const placeholders = segments.map(() => '?').join(',');
    const result = this.db.exec(
      `SELECT node_id, segment, depth, position_in_segment FROM buoy_node WHERE segment IN (${placeholders}) ORDER BY segment, position_in_segment`,
      segments
    );
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      nodeId: row[0] as string,
      segment: row[1] as string,
      depth: row[2] as number,
      positionInSegment: row[3] as number,
    }));
  }

  findSegments(): string[] {
    const result = this.db.exec('SELECT DISTINCT segment FROM buoy_node ORDER BY segment');
    if (result.length === 0) return [];
    return result[0].values.map(row => row[0] as string);
  }

  findById(nodeId: string): BuoyNode | null {
    const result = this.db.exec(
      'SELECT node_id, segment, depth, position_in_segment FROM buoy_node WHERE node_id = ?',
      [nodeId]
    );
    if (result.length === 0 || result[0].values.length === 0) return null;
    const row = result[0].values[0];
    return {
      nodeId: row[0] as string,
      segment: row[1] as string,
      depth: row[2] as number,
      positionInSegment: row[3] as number,
    };
  }

  findAdjacentPairs(segments: string[]): Array<[BuoyNode, BuoyNode]> {
    const nodes = this.findBySegments(segments);
    const pairs: Array<[BuoyNode, BuoyNode]> = [];

    const bySegment: Record<string, BuoyNode[]> = {};
    nodes.forEach(node => {
      if (!bySegment[node.segment]) bySegment[node.segment] = [];
      bySegment[node.segment].push(node);
    });

    Object.values(bySegment).forEach(segmentNodes => {
      segmentNodes.sort((a, b) => a.positionInSegment - b.positionInSegment);
      for (let i = 0; i < segmentNodes.length - 1; i++) {
        pairs.push([segmentNodes[i], segmentNodes[i + 1]]);
      }
    });

    return pairs;
  }
}
