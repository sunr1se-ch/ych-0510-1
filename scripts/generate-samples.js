import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodes = [
  { nodeId: 'A01', basePotential: -680, corrosionRate: 0.8 },
  { nodeId: 'A02', basePotential: -695, corrosionRate: 1.2 },
  { nodeId: 'A03', basePotential: -670, corrosionRate: 0.6 },
  { nodeId: 'A04', basePotential: -710, corrosionRate: 1.5 },
  { nodeId: 'B01', basePotential: -660, corrosionRate: 0.5 },
  { nodeId: 'B02', basePotential: -685, corrosionRate: 0.9 },
  { nodeId: 'B03', basePotential: -700, corrosionRate: 1.1 },
  { nodeId: 'B04', basePotential: -720, corrosionRate: 1.8 },
  { nodeId: 'C01', basePotential: -675, corrosionRate: 0.7 },
  { nodeId: 'C02', basePotential: -690, corrosionRate: 1.0 },
  { nodeId: 'C03', basePotential: -705, corrosionRate: 1.3 },
  { nodeId: 'C04', basePotential: -715, corrosionRate: 1.6 },
];

const daysAgo = 90;
const intervalDays = 3;
const records = [];
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() - daysAgo);

function getTideLevel(dayOfYear, nodeOffset) {
  const tide = 120 + 60 * Math.sin((dayOfYear + nodeOffset) * 0.15) + 30 * Math.sin((dayOfYear + nodeOffset) * 0.6) + (Math.random() - 0.5) * 10;
  return Math.round(tide * 10) / 10;
}

for (let d = 0; d <= daysAgo; d += intervalDays) {
  const sampleDate = new Date(startDate);
  sampleDate.setDate(startDate.getDate() + d);
  const dayOfYear = Math.floor((sampleDate - new Date(sampleDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  nodes.forEach((node, idx) => {
    const corrosion = node.basePotential - node.corrosionRate * d + (Math.random() - 0.5) * 3;
    const tide = getTideLevel(dayOfYear, idx * 5);
    
    records.push({
      nodeId: node.nodeId,
      sampleTime: sampleDate.toISOString().slice(0, 10) + ' 10:00:00',
      corrosionPotential: Math.round(corrosion * 10) / 10,
      tideLevel: tide,
    });
  });
}

const csvHeader = 'nodeId,sampleTime,corrosionPotential,tideLevel\n';
const csvContent = records.map(r => 
  `${r.nodeId},${r.sampleTime},${r.corrosionPotential},${r.tideLevel}`
).join('\n');

const outputPath = path.join(__dirname, '..', 'data', 'sample_records.csv');
fs.writeFileSync(outputPath, csvHeader + csvContent + '\n');
console.log(`Generated ${records.length} sample records written to ${outputPath}`);
