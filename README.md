<div align="center">
  <h1>📊 console-graph</h1>
  <p><strong>The Sparkline Logger</strong></p>
  <p>
    A tiny, zero-dependency sparkline logger that turns your console into a real-time dashboard.<br/>
    Track numerical values over time with beautiful ASCII sparklines.
  </p>
  <p>
    <img src="https://img.shields.io/npm/v/console-graph.svg?style=flat-square&color=blueviolet" alt="npm version" />
    <img src="https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square" alt="zero deps" />
    <img src="https://img.shields.io/badge/size-~3KB-blue.svg?style=flat-square" alt="size" />
    <img src="https://img.shields.io/badge/node-%3E%3D14-green.svg?style=flat-square" alt="node" />
    <img src="https://img.shields.io/badge/browser-✓-orange.svg?style=flat-square" alt="browser" />
  </p>
</div>

---

## The Problem

You're tracking a numerical value (like memory usage, CPU load, or sensor readings) over time and want to see the **trend**, not just a list of numbers.

## The Solution

```
Memory: [▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▇█▆▄] 45MB
CPU:    [▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁▃▅▇█] 72%
```

**console-graph** gives you `console.graph(value)` — a sparkline logger that maintains a rolling buffer and prints a tiny ASCII sparkline with every call. Turn the console into a real-time dashboard for streaming data, no heavy GUI needed.

## ✨ Features

- **Zero Config** — Works out of the box with sensible defaults
- **Zero Dependencies** — Tiny footprint, lightning-fast
- **Browser + Node** — Works in Chrome DevTools AND the terminal
- **Color Gradients** — 5 built-in ANSI/CSS color themes
- **Auto-scaling** — Adapts to your data range automatically
- **TypeScript** — Full type definitions included
- **ESM + CJS** — Dual module support

## 📦 Installation

```bash
npm install console-graph
```

## 🚀 Quick Start

### Method 1: `console.graph()` (Zero Config)

The easiest way — just import the register module and go:

```js
import 'console-graph/register';

// That's it! Now use console.graph() anywhere:
console.graph(45, { label: 'Memory', unit: 'MB' });
console.graph(48, { label: 'Memory', unit: 'MB' });
console.graph(52, { label: 'Memory', unit: 'MB' });
// → Memory: [▁▃▅] 52MB
```

```js
// CommonJS
require('console-graph/register');
console.graph(72, { label: 'CPU', unit: '%' });
```

### Method 2: ConsoleGraph Class (Full Control)

```js
import { ConsoleGraph } from 'console-graph';

const mem = new ConsoleGraph({
  label: 'Memory',
  unit: 'MB',
  bufferSize: 20,
  gradient: 'heat',
});

// In your monitoring loop:
setInterval(() => {
  const usage = process.memoryUsage().heapUsed / 1024 / 1024;
  mem.log(usage);
}, 1000);
```

### Method 3: One-shot Sparkline

```js
import { sparkline } from 'console-graph';

const data = [3, 7, 2, 8, 5, 9, 1, 6, 4, 8];
console.log(sparkline(data, { label: 'Trend' }));
// → Trend: [▂▆▁▇▄█▁▅▃▇] 8
```

## ⚙️ API Reference

### `new ConsoleGraph(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `bufferSize` | `number` | `20` | Max number of data points in the rolling window |
| `label` | `string` | `''` | Label prefix (e.g. `'Memory'`, `'CPU'`) |
| `unit` | `string` | `''` | Unit suffix (e.g. `'MB'`, `'%'`, `'ms'`) |
| `min` | `number` | auto | Fixed minimum value (auto-scales if omitted) |
| `max` | `number` | auto | Fixed maximum value (auto-scales if omitted) |
| `color` | `boolean` | `true` | Enable ANSI (Node) or CSS (browser) colors |
| `gradient` | `string` | `'green'` | Color theme: `'green'` `'heat'` `'cool'` `'mono'` `'ocean'` `'none'` |
| `showStats` | `boolean` | `false` | Append min/max/avg statistics |
| `showBounds` | `boolean` | `false` | Show the current scale range |
| `inline` | `boolean` | `false` | Overwrite the same line (Node TTY only) |
| `brackets` | `string` | `'[]'` | Bracket characters around sparkline |
| `format` | `function` | built-in | Custom value formatter `(value) => string` |

### Methods

| Method | Returns | Description |
|---|---|---|
| `.log(value)` | `string` | Push value, print sparkline, return plain text |
| `.push(value)` | `void` | Push value without printing (silent) |
| `.print()` | `string` | Print current state without pushing |
| `.toString()` | `string` | Get plain sparkline string (no printing) |
| `.reset()` | `void` | Clear the buffer |
| `.stats()` | `object` | Get `{ min, max, avg, current, count }` |
| `.buffer` | `number[]` | Snapshot of the current buffer |

### `sparkline(values, options?)`

Generate a sparkline string from an array of numbers. Same options as `ConsoleGraph`.

```js
sparkline([1, 5, 3, 8, 2, 7]); // → [▁▅▃█▁▆] 7
```

### `GraphDashboard`

Manage multiple named graphs for dashboard-style output:

```js
import { GraphDashboard } from 'console-graph';

const dash = new GraphDashboard({ bufferSize: 30 });

setInterval(() => {
  dash.log('CPU', getCpuUsage(), { unit: '%', gradient: 'heat' });
  dash.log('Memory', getMemUsage(), { unit: 'MB', gradient: 'green' });
  dash.log('Latency', getLatency(), { unit: 'ms', gradient: 'ocean' });
  dash.print(); // renders all graphs
}, 500);
```

## 🎨 Color Gradients

| Gradient | Look | Best for |
|---|---|---|
| `green` | 🟢🟢🟡🟡🔴🔴 | General metrics (low=good, high=bad) |
| `heat` | 🔵🟢🟡🟠🔴 | Temperature / intensity scales |
| `cool` | 🔵🔵🩵🩵⚪⚪ | Calm, informational data |
| `mono` | ⚫⚫⚪⚪⚪⚪ | Minimal, no-distraction style |
| `ocean` | 🔵🩵🟢🟡 | Layered / wave-like data |
| `none` | — | No color, plain Unicode only |

## 🌐 Browser Support

Works natively in Chrome DevTools, Firefox, Safari, and Edge consoles with CSS-based color styling:

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/console-graph/dist/register.mjs';

  // Now open DevTools and check the console:
  setInterval(() => {
    console.graph(Math.random() * 100, {
      label: 'Random',
      unit: '%',
      gradient: 'ocean'
    });
  }, 500);
</script>
```

## 💡 Real-World Use Cases

### Memory Monitoring
```js
const mem = new ConsoleGraph({ label: 'Heap', unit: 'MB', gradient: 'green' });
setInterval(() => {
  mem.log(process.memoryUsage().heapUsed / 1e6);
}, 1000);
```

### API Response Times
```js
import 'console-graph/register';

async function fetchData(url) {
  const start = Date.now();
  const res = await fetch(url);
  console.graph(Date.now() - start, { label: 'API', unit: 'ms', gradient: 'heat' });
  return res;
}
```

### Sensor Data Logging
```js
const temp = new ConsoleGraph({
  label: 'Temp',
  unit: '°C',
  min: -20,
  max: 50,
  gradient: 'heat',
  showStats: true,
});

sensor.on('reading', (value) => temp.log(value));
```

### Build/CI Performance
```js
const buildTime = new ConsoleGraph({
  label: 'Build',
  unit: 's',
  gradient: 'green',
  bufferSize: 30,
  showBounds: true,
});

// After each build step:
buildTime.log(elapsed);
```

## 📄 License

MIT © 2026
