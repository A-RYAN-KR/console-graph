/**
 * console-graph — Demo Example
 * Run with: node examples/demo.js
 */
const { ConsoleGraph, sparkline } = require('../dist/index.cjs');

console.log('╔══════════════════════════════════════════════════╗');
console.log('║          console-graph  —  Demo                  ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// ─── 1. Basic usage ─────────────────────────────────────────────────────────
console.log('── 1. Basic Usage ──────────────────────────────────\n');

const memGraph = new ConsoleGraph({
  label: 'Memory',
  unit: 'MB',
  gradient: 'green',
});

// Simulate memory fluctuations
const memValues = [45, 48, 52, 55, 61, 58, 53, 49, 46, 50, 54, 67, 72, 68, 63, 58, 52, 47, 44, 42];
memValues.forEach((v) => memGraph.log(v));

// ─── 2. Different gradients ─────────────────────────────────────────────────
console.log('\n── 2. Color Gradients ──────────────────────────────\n');

const values = [10, 20, 30, 50, 70, 90, 80, 60, 40, 20, 10, 30, 60, 80, 95, 75, 50, 25, 15, 10];
const gradients = ['green', 'heat', 'cool', 'mono', 'ocean'];

gradients.forEach((gradient) => {
  const g = new ConsoleGraph({ label: gradient.padEnd(6), gradient, unit: '%' });
  values.forEach((v) => g.push(v));
  g.print();
});

// ─── 3. With statistics ─────────────────────────────────────────────────────
console.log('\n── 3. With Statistics ──────────────────────────────\n');

const cpuGraph = new ConsoleGraph({
  label: 'CPU',
  unit: '%',
  showStats: true,
  gradient: 'heat',
  min: 0,
  max: 100,
});

[23, 45, 67, 89, 74, 56, 34, 12, 45, 78, 90, 85, 72, 63, 41, 29, 38, 55, 71, 82].forEach((v) =>
  cpuGraph.push(v)
);
cpuGraph.print();

// ─── 4. sparkline() utility ─────────────────────────────────────────────────
console.log('\n── 4. Quick Sparkline ──────────────────────────────\n');

const quick = sparkline([3, 7, 2, 8, 5, 9, 1, 6, 4, 8], { label: 'Trend' });
console.log(`  ${quick}`);

// ─── 5. Custom brackets and formatter ───────────────────────────────────────
console.log('\n── 5. Custom Formatting ────────────────────────────\n');

const custom = new ConsoleGraph({
  label: 'Latency',
  brackets: '❮❯',
  format: (v) => (v !== null ? `${v.toFixed(1)}ms` : '—'),
  gradient: 'ocean',
});

[12.5, 15.3, 11.2, 18.7, 22.1, 19.4, 14.8, 13.1, 16.5, 20.3].forEach((v) => custom.push(v));
custom.print();

// ─── 6. console.graph() ─────────────────────────────────────────────────────
console.log('\n── 6. console.graph() (register) ──────────────────\n');

require('../dist/register.cjs');

for (let i = 0; i < 15; i++) {
  console.graph(Math.sin(i / 2) * 50 + 50, { label: 'Sine Wave', unit: '%', min: 0, max: 100 });
}

console.log('\n── Done! ──────────────────────────────────────────\n');
