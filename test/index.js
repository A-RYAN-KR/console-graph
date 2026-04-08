/**
 * console-graph test suite
 * Run with: node test/index.js
 */

// We test against the source directly (no build needed for tests)
// Using dynamic import for ESM
async function runTests() {
  // Build first so we can test CJS
  const { execSync } = require('child_process');
  const path = require('path');

  console.log('🔨 Building...\n');
  execSync('node scripts/build.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  // Test CJS build
  const { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue } = require('../dist/index.cjs');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.log(`  ❌ ${message}`);
      failed++;
    }
  }

  // ─── Test 1: Basic instantiation ───────────────────────────────────────
  console.log('\n📦 ConsoleGraph - Instantiation');
  {
    const g = new ConsoleGraph();
    assert(g instanceof ConsoleGraph, 'Creates instance with defaults');
    assert(g.buffer.length === 0, 'Buffer starts empty');
  }

  // ─── Test 2: Options ──────────────────────────────────────────────────
  console.log('\n⚙️  ConsoleGraph - Options');
  {
    const g = new ConsoleGraph({
      bufferSize: 10,
      label: 'Test',
      unit: 'MB',
      min: 0,
      max: 100,
      color: false,
    });
    assert(g.label === 'Test', 'Label is set correctly');
    g.label = 'NewLabel';
    assert(g.label === 'NewLabel', 'Label can be updated');
  }

  // ─── Test 3: Logging values ───────────────────────────────────────────
  console.log('\n📊 ConsoleGraph - Logging');
  {
    const g = new ConsoleGraph({ color: false, label: 'Mem', unit: 'MB' });
    console.log('   (Visual output below:)');
    const result = g.log(10);
    assert(typeof result === 'string', 'log() returns a string');
    assert(result.includes('Mem'), 'Output includes label');
    assert(result.includes('MB'), 'Output includes unit');
    assert(result.includes('['), 'Output includes opening bracket');
    assert(result.includes(']'), 'Output includes closing bracket');
  }

  // ─── Test 4: Buffer management ────────────────────────────────────────
  console.log('\n🔄 ConsoleGraph - Buffer Management');
  {
    const g = new ConsoleGraph({ bufferSize: 5, color: false });
    for (let i = 0; i < 10; i++) g.push(i);
    assert(g.buffer.length === 5, 'Buffer respects bufferSize limit');
    assert(g.buffer[0] === 5, 'Oldest values are dropped (FIFO)');
    assert(g.buffer[4] === 9, 'Newest value is at the end');
  }

  // ─── Test 5: Statistics ───────────────────────────────────────────────
  console.log('\n📈 ConsoleGraph - Statistics');
  {
    const g = new ConsoleGraph({ color: false });
    [10, 20, 30, 40, 50].forEach((v) => g.push(v));
    const s = g.stats();
    assert(s.min === 10, `min is 10 (got ${s.min})`);
    assert(s.max === 50, `max is 50 (got ${s.max})`);
    assert(s.avg === 30, `avg is 30 (got ${s.avg})`);
    assert(s.current === 50, `current is 50 (got ${s.current})`);
    assert(s.count === 5, `count is 5 (got ${s.count})`);
  }

  // ─── Test 6: Reset ────────────────────────────────────────────────────
  console.log('\n🗑️  ConsoleGraph - Reset');
  {
    const g = new ConsoleGraph({ color: false });
    [1, 2, 3].forEach((v) => g.push(v));
    g.reset();
    assert(g.buffer.length === 0, 'Buffer is empty after reset');
    const s = g.stats();
    assert(s.count === 0, 'Count is 0 after reset');
  }

  // ─── Test 7: toString ─────────────────────────────────────────────────
  console.log('\n🔤 ConsoleGraph - toString');
  {
    const g = new ConsoleGraph({ color: false, label: 'CPU', unit: '%' });
    [10, 50, 90, 50, 10].forEach((v) => g.push(v));
    const str = g.toString();
    assert(str.includes('CPU'), 'toString includes label');
    assert(str.includes('%'), 'toString includes unit');
    assert(str.length > 5, 'toString produces meaningful output');
    console.log(`   Result: ${str}`);
  }

  // ─── Test 8: sparkline utility ────────────────────────────────────────
  console.log('\n✨ sparkline() utility');
  {
    const result = sparkline([1, 3, 5, 7, 5, 3, 1]);
    assert(typeof result === 'string', 'Returns a string');
    assert(result.includes('['), 'Includes brackets');
    console.log(`   Result: ${result}`);

    const labeled = sparkline([10, 20, 30, 40, 50], { label: 'Trend', unit: 'ms' });
    assert(labeled.includes('Trend'), 'Supports label option');
    assert(labeled.includes('ms'), 'Supports unit option');
    console.log(`   Result: ${labeled}`);
  }

  // ─── Test 9: BLOCKS constant ──────────────────────────────────────────
  console.log('\n🧱 BLOCKS constant');
  {
    assert(Array.isArray(BLOCKS), 'BLOCKS is an array');
    assert(BLOCKS.length === 8, `BLOCKS has 8 characters (got ${BLOCKS.length})`);
    assert(BLOCKS[0] === '▁', 'First block is ▁');
    assert(BLOCKS[7] === '█', 'Last block is █');
  }

  // ─── Test 10: formatValue ─────────────────────────────────────────────
  console.log('\n🔢 formatValue()');
  {
    assert(formatValue(42, 'MB') === '42MB', `formatValue(42, 'MB') = '42MB'`);
    assert(formatValue(1500000, '') === '1.5M', `formatValue(1500000) = '1.5M'`);
    assert(formatValue(2500000000, '') === '2.5B', `formatValue(2500000000) = '2.5B'`);
    assert(formatValue(15000, '') === '15.0K', `formatValue(15000) = '15.0K'`);
    assert(formatValue(3.14159, '') === '3.1', 'Decimals are truncated to 1 place');
    assert(formatValue(null) === '?', 'null returns ?');
  }

  // ─── Test 11: Show stats option ───────────────────────────────────────
  console.log('\n📋 ConsoleGraph - showStats option');
  {
    const g = new ConsoleGraph({ color: false, showStats: true, label: 'Stat' });
    [10, 20, 30].forEach((v) => g.push(v));
    const str = g.toString();
    assert(str.includes('min:'), 'Shows min stat');
    assert(str.includes('max:'), 'Shows max stat');
    assert(str.includes('avg:'), 'Shows avg stat');
    console.log(`   Result: ${str}`);
  }

  // ─── Test 12: Fixed bounds ────────────────────────────────────────────
  console.log('\n📏 ConsoleGraph - Fixed min/max bounds');
  {
    const g = new ConsoleGraph({ color: false, min: 0, max: 100 });
    g.push(50);
    const str = g.toString();
    assert(typeof str === 'string', 'Works with fixed bounds');
    console.log(`   Result: ${str}`);
  }

  // ─── Test 13: Custom brackets ─────────────────────────────────────────
  console.log('\n🔲 ConsoleGraph - Custom brackets');
  {
    const g = new ConsoleGraph({ color: false, brackets: '()' });
    g.push(50);
    const str = g.toString();
    assert(str.includes('('), 'Uses custom open bracket');
    assert(str.includes(')'), 'Uses custom close bracket');
    console.log(`   Result: ${str}`);
  }

  // ─── Test 14: Custom format ───────────────────────────────────────────
  console.log('\n🎨 ConsoleGraph - Custom formatter');
  {
    const g = new ConsoleGraph({
      color: false,
      format: (v) => (v !== null ? `${v.toFixed(2)} units` : 'N/A'),
    });
    g.push(42.567);
    const str = g.toString();
    assert(str.includes('42.57 units'), 'Uses custom formatter');
    console.log(`   Result: ${str}`);
  }

  // ─── Test 15: GraphDashboard ──────────────────────────────────────────
  console.log('\n🖥️  GraphDashboard');
  {
    const dash = new GraphDashboard({ color: false, bufferSize: 5 });
    dash.log('CPU', 45);
    dash.log('Memory', 1024);
    dash.log('CPU', 67);
    dash.log('Memory', 1200);

    const cpu = dash.get('CPU');
    assert(cpu instanceof ConsoleGraph, 'get() returns a ConsoleGraph');
    assert(cpu.buffer.length === 2, 'CPU has 2 values');

    const mem = dash.get('Memory');
    assert(mem.buffer.length === 2, 'Memory has 2 values');

    dash.reset();
    assert(dash.get('CPU').buffer.length === 0, 'Reset clears all buffers');
  }

  // ─── Test 16: Colored output (just make sure it doesn't crash) ────────
  console.log('\n🌈 Colored output (visual check)');
  {
    const g = new ConsoleGraph({ label: 'Colored', color: true, gradient: 'heat' });
    [10, 20, 40, 80, 60, 30, 15, 10, 20, 50, 70, 90, 70, 40, 20].forEach((v) => g.push(v));
    g.print();

    const g2 = new ConsoleGraph({ label: 'Ocean', color: true, gradient: 'ocean' });
    [5, 15, 25, 35, 50, 65, 80, 95, 80, 60, 40, 20].forEach((v) => g2.push(v));
    g2.print();

    const g3 = new ConsoleGraph({ label: 'Cool', color: true, gradient: 'cool' });
    [90, 80, 70, 60, 50, 40, 30, 20, 10, 5].forEach((v) => g3.push(v));
    g3.print();
    assert(true, 'Colored output rendered without errors');
  }

  // ─── Test 17: Register module (console.graph) ─────────────────────────
  console.log('\n🔌 console.graph (register module)');
  {
    require('../dist/register.cjs');
    assert(typeof console.graph === 'function', 'console.graph is a function');
    assert(typeof console.graphReset === 'function', 'console.graphReset is a function');

    console.log('   (Visual output below:)');
    const result = console.graph(42, { label: 'Register', unit: 'MB' });
    assert(typeof result === 'string', 'console.graph returns a string');
    console.graph(55, { label: 'Register', unit: 'MB' });
    console.graph(70, { label: 'Register', unit: 'MB' });

    console.graphReset('Register');
    assert(true, 'console.graphReset works without errors');
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
