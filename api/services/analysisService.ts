import { CorrosionRate, TideDifference, FilterParams, StatsOverview, BuoyNode, SampleRecord } from '../../shared/types.js';
import { NodeRepository } from '../repositories/nodeRepository.js';
import { SampleRepository } from '../repositories/sampleRepository.js';

export class AnalysisService {
  private nodeRepo: NodeRepository;
  private sampleRepo: SampleRepository;

  constructor(nodeRepo: NodeRepository, sampleRepo: SampleRepository) {
    this.nodeRepo = nodeRepo;
    this.sampleRepo = sampleRepo;
  }

  calculateCorrosionRates(params: FilterParams): CorrosionRate[] {
    const { segments, startDate, endDate } = params;
    const samples = this.sampleRepo.findByFilter(segments, startDate, endDate);
    const nodes = this.nodeRepo.findBySegments(segments);
    const nodeMap = new Map(nodes.map(n => [n.nodeId, n]));

    const byNode: Record<string, SampleRecord[]> = {};
    samples.forEach(s => {
      if (!byNode[s.nodeId]) byNode[s.nodeId] = [];
      byNode[s.nodeId].push(s);
    });

    const rates: CorrosionRate[] = [];
    Object.entries(byNode).forEach(([nodeId, nodeSamples]) => {
      if (nodeSamples.length < 2) return;

      nodeSamples.sort((a, b) => new Date(a.sampleTime).getTime() - new Date(b.sampleTime).getTime());

      let totalRate = 0;
      let intervalCount = 0;

      for (let i = 1; i < nodeSamples.length; i++) {
        const prev = nodeSamples[i - 1];
        const curr = nodeSamples[i];
        const prevDate = new Date(prev.sampleTime);
        const currDate = new Date(curr.sampleTime);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > 0) {
          const potentialDiff = curr.corrosionPotential - prev.corrosionPotential;
          const dailyRate = potentialDiff / daysDiff;
          totalRate += dailyRate;
          intervalCount++;
        }
      }

      if (intervalCount > 0) {
        const node = nodeMap.get(nodeId);
        rates.push({
          nodeId,
          segment: node?.segment || '',
          avgDailyRate: Math.round((totalRate / intervalCount) * 1000) / 1000,
          sampleCount: nodeSamples.length,
          dateRange: [
            nodeSamples[0].sampleTime.slice(0, 10),
            nodeSamples[nodeSamples.length - 1].sampleTime.slice(0, 10),
          ],
          depth: node?.depth || 0,
        });
      }
    });

    return rates.sort((a, b) => a.segment.localeCompare(b.segment) || a.nodeId.localeCompare(b.nodeId));
  }

  calculateTideDifferences(params: FilterParams): TideDifference[] {
    const { segments, startDate, endDate } = params;
    const samples = this.sampleRepo.findByFilter(segments, startDate, endDate);
    const adjacentPairs = this.nodeRepo.findAdjacentPairs(segments);

    const byNodeTime: Record<string, Record<string, number>> = {};
    samples.forEach(s => {
      const dateKey = s.sampleTime.slice(0, 10);
      if (!byNodeTime[s.nodeId]) byNodeTime[s.nodeId] = {};
      byNodeTime[s.nodeId][dateKey] = s.tideLevel;
    });

    const diffs: TideDifference[] = [];
    adjacentPairs.forEach(([node1, node2]) => {
      const tides1 = byNodeTime[node1.nodeId] || {};
      const tides2 = byNodeTime[node2.nodeId] || {};

      const commonDates = Object.keys(tides1).filter(d => tides2[d] !== undefined);
      if (commonDates.length === 0) return;

      let totalDiff = 0;
      commonDates.forEach(date => {
        totalDiff += Math.abs(tides1[date] - tides2[date]);
      });

      diffs.push({
        segment: node1.segment,
        nodePair: [node1.nodeId, node2.nodeId],
        avgTideDiff: Math.round((totalDiff / commonDates.length) * 10) / 10,
        sampleCount: commonDates.length,
      });
    });

    return diffs;
  }

  getStatsOverview(params: FilterParams): StatsOverview {
    const nodes = this.nodeRepo.findBySegments(params.segments);
    const sampleCount = this.sampleRepo.countByFilter(params.segments, params.startDate, params.endDate);
    const corrosionRates = this.calculateCorrosionRates(params);
    const tideDiffs = this.calculateTideDifferences(params);

    const avgRate = corrosionRates.length > 0
      ? Math.round((corrosionRates.reduce((sum, r) => sum + r.avgDailyRate, 0) / corrosionRates.length) * 1000) / 1000
      : 0;

    const maxDiff = tideDiffs.length > 0
      ? Math.max(...tideDiffs.map(d => d.avgTideDiff))
      : 0;

    return {
      nodeCount: nodes.length,
      sampleCount,
      avgCorrosionRate: avgRate,
      maxTideDiff: maxDiff,
    };
  }

  exportData(params: FilterParams): { corrosionRates: CorrosionRate[]; tideDiffs: TideDifference[]; nodes: BuoyNode[] } {
    return {
      corrosionRates: this.calculateCorrosionRates(params),
      tideDiffs: this.calculateTideDifferences(params),
      nodes: this.nodeRepo.findBySegments(params.segments),
    };
  }
}
