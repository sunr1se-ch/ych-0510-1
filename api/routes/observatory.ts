import { Router, Request, Response } from 'express';
import multer from 'multer';
import { FilterParams } from '../../shared/types.js';
import { NodeRepository } from '../repositories/nodeRepository.js';
import { SampleRepository } from '../repositories/sampleRepository.js';
import { AnalysisService } from '../services/analysisService.js';
import { ImportExportService } from '../services/importExportService.js';
import { getDb } from '../db/database.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function getServices() {
  const db = getDb();
  const nodeRepo = new NodeRepository(db);
  const sampleRepo = new SampleRepository(db);
  const analysisService = new AnalysisService(nodeRepo, sampleRepo);
  const importExportService = new ImportExportService(sampleRepo, nodeRepo);
  return { nodeRepo, sampleRepo, analysisService, importExportService };
}

function parseFilterParams(req: Request): FilterParams {
  const segments = typeof req.query.segments === 'string'
    ? req.query.segments.split(',').filter(Boolean)
    : [];
  const startDate = req.query.startDate as string || getDefaultStartDate();
  const endDate = req.query.endDate as string || getDefaultEndDate();
  return { segments, startDate, endDate };
}

function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function getDefaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get('/nodes', (_req: Request, res: Response) => {
  try {
    const { nodeRepo } = getServices();
    const nodes = nodeRepo.findAll();
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/segments', (_req: Request, res: Response) => {
  try {
    const { nodeRepo } = getServices();
    const segments = nodeRepo.findSegments();
    res.json({ success: true, data: segments });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/samples', (req: Request, res: Response) => {
  try {
    const { sampleRepo } = getServices();
    const params = parseFilterParams(req);
    const samples = sampleRepo.findByFilter(params.segments, params.startDate, params.endDate);
    res.json({ success: true, data: samples });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/analysis/corrosion-rate', (req: Request, res: Response) => {
  try {
    const { analysisService } = getServices();
    const params = parseFilterParams(req);
    const rates = analysisService.calculateCorrosionRates(params);
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/analysis/tide-difference', (req: Request, res: Response) => {
  try {
    const { analysisService } = getServices();
    const params = parseFilterParams(req);
    const diffs = analysisService.calculateTideDifferences(params);
    res.json({ success: true, data: diffs });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/analysis/stats', (req: Request, res: Response) => {
  try {
    const { analysisService } = getServices();
    const params = parseFilterParams(req);
    const stats = analysisService.getStatsOverview(params);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post('/import/samples', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }
    const { importExportService } = getServices();
    const result = await importExportService.importSamples(req.file.buffer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get('/export/data', (req: Request, res: Response) => {
  try {
    const { analysisService, importExportService } = getServices();
    const params = parseFilterParams(req);
    const data = analysisService.exportData(params);
    const csvData = importExportService.exportToCsv(params, data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=observatory_export_${new Date().toISOString().slice(0, 10)}.csv`);

    const combined = [
      '=== 腐蚀电位变化率 ===',
      csvData.corrosionCsv,
      '\n=== 相邻节点潮位差 ===',
      csvData.tideCsv,
      '\n=== 节点信息 ===',
      csvData.nodesCsv,
    ].join('\n');

    res.send('\uFEFF' + combined);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
