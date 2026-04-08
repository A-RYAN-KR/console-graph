/**
 * console-graph — Dashboard Example
 * Simulates a real-time monitoring dashboard.
 * Run with: node examples/dashboard.js
 */
const { GraphDashboard } = require('../dist/index.cjs');

const dashboard = new GraphDashboard({
  bufferSize: 30,
  gradient: 'heat',
});

let tick = 0;

console.log('🖥️  Real-time Dashboard (Ctrl+C to stop)\n');

const interval = setInterval(() => {
  // Simulate CPU usage (oscillating)
  const cpu = 30 + Math.sin(tick / 5) * 25 + Math.random() * 15;

  // Simulate memory (slowly increasing with GC drops)
  const mem = 200 + tick * 2 + Math.random() * 50 - (tick % 20 === 0 ? 80 : 0);

  // Simulate network latency (spiky)
  const latency = 15 + Math.random() * 30 + (Math.random() > 0.9 ? 100 : 0);

  // Simulate requests/sec
  const rps = 100 + Math.sin(tick / 3) * 40 + Math.random() * 20;

  dashboard.log('CPU     ', cpu, { unit: '%', min: 0, max: 100, gradient: 'heat' });
  dashboard.log('Memory  ', mem, { unit: 'MB', gradient: 'green' });
  dashboard.log('Latency ', latency, { unit: 'ms', gradient: 'ocean' });
  dashboard.log('Req/sec ', rps, { unit: '', gradient: 'cool' });

  dashboard.print();
  tick++;

  if (tick > 100) {
    clearInterval(interval);
    console.log('\n\n✅ Dashboard demo complete!');
  }
}, 200);
