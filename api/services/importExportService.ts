import csv from 'csv-parser';
import { Readable } from 'stream';
import { SampleRecord, ImportResult, FilterParams, CorrosionRate, TideDifference, BuoyNode } from '../../shared/types.js';
import { SampleRepository } from '../repositories/sampleRepository.js';
import { NodeRepository } from '../repositories/nodeRepository.js';
import { saveDatabase } from '../db/database.js';

export class ImportExportService {
  private sampleRepo: SampleRepository;
  private nodeRepo: NodeRepository;

  constructor(sampleRepo: SampleRepository, nodeRepo: NodeRepository) {
    this.sampleRepo = sampleRepo;
    this.nodeRepo = nodeRepo;
  }

  async importSamples(fileBuffer: Buffer): Promise<ImportResult> {
    const records: Omit<SampleRecord, 'id'>[] = [];
    const errors: string[] = [];
    const validNodeIds = new Set(this.nodeRepo.findAll().map(n => n.nodeId));

    try {
      const stream = Readable.from(fileBuffer.toString('utf-8'));
      const parser = stream.pipe(csv());

      for await (const rawRow of parser) {
        const row = this.normalizeRow(rawRow);
        const lineNum = records.length + errors.length + 2;

        const validation = this.validateRow(row, validNodeIds, lineNum);
        if (!validation.valid) {
          errors.push(validation.error!);
          continue;
        }

        records.push({
          nodeId: row.nodeId!,
          sampleTime: this.formatSampleTime(row.sampleTime!),
          corrosionPotential: parseFloat(row.corrosionPotential!),
          tideLevel: parseFloat(row.tideLevel!),
        });
      }

      if (records.length > 0) {
        const inserted = this.sampleRepo.insertMany(records);
        saveDatabase();
        return {
          success: true,
          imported: inserted,
          errors,
        };
      }

      return {
        success: errors.length === 0,
        imported: 0,
        errors,
      };
    } catch (err) {
      return {
        success: false,
        imported: 0,
        errors: [`解析CSV文件失败: ${(err as Error).message}`],
      };
    }
  }

  exportToCsv(params: FilterParams, data: {
    corrosionRates: CorrosionRate[];
    tideDiffs: TideDifference[];
    nodes: BuoyNode[];
  }): { corrosionCsv: string; tideCsv: string; nodesCsv: string } {
    const corrosionCsv = this.exportCorrosionRates(data.corrosionRates);
    const tideCsv = this.exportTideDifferences(data.tideDiffs);
    const nodesCsv = this.exportNodes(data.nodes);
    return { corrosionCsv, tideCsv, nodesCsv };
  }

  private normalizeRow(row: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    Object.keys(row).forEach(key => {
      const camelKey = key.trim().toLowerCase().replace(/[_\s-]([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (_, c) => c);
      normalized[camelKey] = row[key].trim();
    });
    return normalized;
  }

  private validateRow(row: Record<string, string>, validNodeIds: Set<string>, lineNum: number): { valid: boolean; error?: string } {
    if (!row.nodeId) return { valid: false, error: `第${lineNum}行: 缺少节点号` };
    if (!validNodeIds.has(row.nodeId)) return { valid: false, error: `第${lineNum}行: 无效的节点号 ${row.nodeId}` };
    if (!row.sampleTime) return { valid: false, error: `第${lineNum}行: 缺少采样时间` };
    if (!row.corrosionPotential || isNaN(parseFloat(row.corrosionPotential))) {
      return { valid: false, error: `第${lineNum}行: 腐蚀电位无效` };
    }
    if (!row.tideLevel || isNaN(parseFloat(row.tideLevel))) {
      return { valid: false, error: `第${lineNum}行: 潮位无效` };
    }
    return { valid: true };
  }

  private formatSampleTime(timeStr: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
      return `${timeStr} 10:00:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10) + ' ' + date.toTimeString().slice(0, 8);
    }
    return timeStr;
  }

  private exportCorrosionRates(rates: CorrosionRate[]): string {
    const header = '节点号,链段,布设水深(米),日均变化率(mV/天),采样次数,起始日期,结束日期';
    const rows = rates.map(r =>
      `${r.nodeId},${r.segment},${r.depth},${r.avgDailyRate},${r.sampleCount},${r.dateRange[0]},${r.dateRange[1]}`
    );
    return [header, ...rows].join('\n') + '\n';
  }

  private exportTideDifferences(diffs: TideDifference[]): string {
    const header = '链段,节点对,平均潮位差(厘米),同期采样次数';
    const rows = diffs.map(d =>
      `${d.segment},${d.nodePair.join('-')},${d.avgTideDiff},${d.sampleCount}`
    );
    return [header, ...rows].join('\n') + '\n';
  }

  private exportNodes(nodes: BuoyNode[]): string {
    const header = '节点号,链段,布设水深(米),链段内位置';
    const rows = nodes.map(n =>
      `${n.nodeId},${n.segment},${n.depth},${n.positionInSegment}`
    );
    return [header, ...rows].join('\n') + '\n';
  }
}
