/**
 * Build script — Bundles ESM and CJS versions without any build tool dependencies.
 * Zero-dependency build: just uses Node.js built-in fs.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// ─── Read source files ────────────────────────────────────────────────────────
const sparklineSrc = fs.readFileSync(path.join(SRC, 'sparkline.js'), 'utf-8');
const registerSrc = fs.readFileSync(path.join(SRC, 'register.js'), 'utf-8');

// ─── Build ESM versions ──────────────────────────────────────────────────────
// sparkline.mjs: just copy as-is (it's already ESM)
fs.writeFileSync(path.join(DIST, 'sparkline.mjs'), sparklineSrc);

// index.mjs: re-export from sparkline.mjs
const indexMjs = `export { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue } from './sparkline.mjs';
export { default } from './sparkline.mjs';
`;
fs.writeFileSync(path.join(DIST, 'index.mjs'), indexMjs);

// register.mjs: replace import path
const registerMjs = registerSrc.replace('./sparkline.js', './sparkline.mjs');
fs.writeFileSync(path.join(DIST, 'register.mjs'), registerMjs);

// ─── Build CJS versions ──────────────────────────────────────────────────────

function esmToCjs(source, moduleName) {
  let cjs = source;

  // Remove 'export default' and capture the identifier
  let defaultExport = null;
  cjs = cjs.replace(/export\s+default\s+(\w+);?\s*$/m, (_, id) => {
    defaultExport = id;
    return '';
  });

  // Replace 'export { ... }' with module.exports assignments
  cjs = cjs.replace(/export\s*\{([^}]+)\}\s*(?:from\s*['"][^'"]+['"])?\s*;/g, (match, exports, offset) => {
    // If it has a 'from', it's a re-export — skip for CJS (handled differently)
    if (match.includes('from')) return '';
    return ''; // Will be handled below
  });

  // Replace import statements from local modules
  cjs = cjs.replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/([^'"]+)['"]\s*;/g, (_, imports, file) => {
    const cjsFile = file.replace('.js', '.cjs').replace('.mjs', '.cjs');
    const vars = imports.split(',').map((v) => v.trim()).filter(Boolean);
    return `const { ${vars.join(', ')} } = require('./${cjsFile}');`;
  });

  cjs = cjs.replace(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;/g, (_, imports, mod) => {
    const vars = imports.split(',').map((v) => v.trim()).filter(Boolean);
    return `const { ${vars.join(', ')} } = require('${mod}');`;
  });

  cjs = cjs.replace(/import\s+(\w+)\s+from\s*['"]\.\/([^'"]+)['"]\s*;/g, (_, name, file) => {
    const cjsFile = file.replace('.js', '.cjs').replace('.mjs', '.cjs');
    return `const ${name} = require('./${cjsFile}');`;
  });

  return cjs;
}

// sparkline.cjs
let sparklineCjs = esmToCjs(sparklineSrc);
// Add CJS exports at the bottom
sparklineCjs += `
module.exports = { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue };
module.exports.default = ConsoleGraph;
`;
fs.writeFileSync(path.join(DIST, 'sparkline.cjs'), sparklineCjs);

// index.cjs
const indexCjs = `const { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue } = require('./sparkline.cjs');
module.exports = { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue };
module.exports.default = ConsoleGraph;
`;
fs.writeFileSync(path.join(DIST, 'index.cjs'), indexCjs);

// register.cjs
let registerCjs = esmToCjs(registerSrc);
fs.writeFileSync(path.join(DIST, 'register.cjs'), registerCjs);

// ─── TypeScript declarations ──────────────────────────────────────────────────
const dts = `/**
 * console-graph — The Sparkline Logger
 * A tiny, zero-dependency sparkline logger for the console.
 */

export interface ConsoleGraphOptions {
  /** Number of data points to keep (default: 20) */
  bufferSize?: number;
  /** Label prefix (e.g. 'Memory', 'CPU') */
  label?: string;
  /** Unit suffix (e.g. 'MB', '%', 'ms') */
  unit?: string;
  /** Fixed minimum value (auto-scales if omitted) */
  min?: number;
  /** Fixed maximum value (auto-scales if omitted) */
  max?: number;
  /** Enable colored output (default: true) */
  color?: boolean;
  /** Color gradient: 'green' | 'heat' | 'cool' | 'mono' | 'ocean' | 'none' */
  gradient?: 'green' | 'heat' | 'cool' | 'mono' | 'ocean' | 'none';
  /** Show min/max/avg statistics (default: false) */
  showStats?: boolean;
  /** Show scale bounds (default: false) */
  showBounds?: boolean;
  /** Use carriage return for in-place updates (Node only, default: false) */
  inline?: boolean;
  /** Bracket characters around the sparkline (default: '[]') */
  brackets?: string;
  /** Custom value formatter */
  format?: (value: number | null) => string;
}

export interface GraphStats {
  min: number;
  max: number;
  avg: number;
  current: number;
  count: number;
}

/**
 * A sparkline logger that maintains a buffer and prints ASCII sparklines.
 */
export class ConsoleGraph {
  constructor(options?: ConsoleGraphOptions);
  
  /** Add a value and render the sparkline to console */
  log(value: number): string;
  
  /** Add a value without printing */
  push(value: number): void;
  
  /** Render and print the current state without adding a value */
  print(): string;
  
  /** Get the sparkline string without printing */
  toString(): string;
  
  /** Reset the buffer */
  reset(): void;
  
  /** Get current statistics */
  stats(): GraphStats;
  
  /** Get a snapshot of the buffer */
  readonly buffer: number[];
  
  /** Get/set the label */
  label: string;
}

/**
 * A dashboard for managing multiple named graphs.
 */
export class GraphDashboard {
  constructor(globalOptions?: ConsoleGraphOptions);
  
  /** Add or update a named graph with a value */
  log(name: string, value: number, options?: ConsoleGraphOptions): void;
  
  /** Render all graphs at once */
  print(): void;
  
  /** Get a specific graph instance */
  get(name: string): ConsoleGraph | undefined;
  
  /** Reset all graphs */
  reset(): void;
}

/**
 * Generate a sparkline string from an array of numbers.
 */
export function sparkline(values: number[], options?: ConsoleGraphOptions): string;

/** Unicode block characters used for sparklines */
export const BLOCKS: string[];

/** Format a number for compact display */
export function formatValue(value: number, unit?: string): string;

export default ConsoleGraph;

// Augment console when using 'console-graph/register'
declare global {
  interface Console {
    graph(value: number, options?: ConsoleGraphOptions & { label?: string }): string;
    graphReset(label?: string): void;
  }
}
`;
fs.writeFileSync(path.join(DIST, 'index.d.ts'), dts);

console.log('✅ Build complete!');
console.log('   dist/index.mjs      (ESM entry)');
console.log('   dist/index.cjs      (CJS entry)');
console.log('   dist/sparkline.mjs  (ESM core)');
console.log('   dist/sparkline.cjs  (CJS core)');
console.log('   dist/register.mjs   (ESM console patch)');
console.log('   dist/register.cjs   (CJS console patch)');
console.log('   dist/index.d.ts     (TypeScript declarations)');
