/**
 * console-graph — The Sparkline Logger
 * A tiny, zero-dependency sparkline logger for tracking numerical values.
 * Works in Node.js and browsers.
 *
 * @license MIT
 */

// ─── Unicode block characters (8 levels) ───────────────────────────────────────
const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const EMPTY_BLOCK = ' ';

// ─── Environment detection ─────────────────────────────────────────────────────
const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

// ─── ANSI color helpers (Node.js only) ─────────────────────────────────────────
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  // Bright variants
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
};

// ─── Gradient palettes ─────────────────────────────────────────────────────────
const GRADIENTS = {
  green: [ANSI.green, ANSI.green, ANSI.brightGreen, ANSI.brightGreen, ANSI.yellow, ANSI.yellow, ANSI.brightRed, ANSI.red],
  heat: [ANSI.blue, ANSI.cyan, ANSI.green, ANSI.brightGreen, ANSI.yellow, ANSI.brightYellow, ANSI.brightRed, ANSI.red],
  cool: [ANSI.blue, ANSI.blue, ANSI.brightBlue, ANSI.cyan, ANSI.brightCyan, ANSI.brightCyan, ANSI.white, ANSI.white],
  mono: [ANSI.gray, ANSI.gray, ANSI.white, ANSI.white, ANSI.white, ANSI.white, ANSI.bold, ANSI.bold],
  ocean: [ANSI.blue, ANSI.brightBlue, ANSI.cyan, ANSI.brightCyan, ANSI.green, ANSI.brightGreen, ANSI.yellow, ANSI.brightYellow],
  none: null,
};

// ─── Browser CSS color gradients ───────────────────────────────────────────────
const BROWSER_GRADIENTS = {
  green: ['#22c55e', '#22c55e', '#4ade80', '#4ade80', '#eab308', '#eab308', '#ef4444', '#dc2626'],
  heat: ['#3b82f6', '#06b6d4', '#22c55e', '#4ade80', '#eab308', '#facc15', '#f87171', '#ef4444'],
  cool: ['#3b82f6', '#3b82f6', '#60a5fa', '#06b6d4', '#22d3ee', '#22d3ee', '#f8fafc', '#f8fafc'],
  mono: ['#9ca3af', '#9ca3af', '#e5e7eb', '#e5e7eb', '#f9fafb', '#f9fafb', '#ffffff', '#ffffff'],
  ocean: ['#3b82f6', '#60a5fa', '#06b6d4', '#22d3ee', '#22c55e', '#4ade80', '#eab308', '#facc15'],
  none: null,
};

/**
 * Formats a number for display (compact notation)
 */
function formatValue(value, unit) {
  if (value === null || value === undefined) return '?';
  let formatted;
  const abs = Math.abs(value);
  if (abs >= 1e9) {
    formatted = (value / 1e9).toFixed(1) + 'B';
  } else if (abs >= 1e6) {
    formatted = (value / 1e6).toFixed(1) + 'M';
  } else if (abs >= 1e4) {
    formatted = (value / 1e3).toFixed(1) + 'K';
  } else if (Number.isInteger(value)) {
    formatted = String(value);
  } else {
    formatted = value.toFixed(1);
  }
  return unit ? `${formatted}${unit}` : formatted;
}

/**
 * Calculates min/max with optional bounds
 */
function getBounds(buffer, optMin, optMax) {
  const values = buffer.filter((v) => v !== null && v !== undefined);
  if (values.length === 0) return { min: 0, max: 1 };
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  return {
    min: optMin !== undefined ? optMin : dataMin,
    max: optMax !== undefined ? optMax : dataMax === dataMin ? dataMin + 1 : dataMax,
  };
}

/**
 * Maps a value to a sparkline block character
 */
function valueToBlock(value, min, max) {
  if (value === null || value === undefined) return EMPTY_BLOCK;
  const range = max - min;
  if (range === 0) return BLOCKS[4]; // middle block if flat
  const normalized = Math.max(0, Math.min(1, (value - min) / range));
  const index = Math.min(BLOCKS.length - 1, Math.floor(normalized * BLOCKS.length));
  return BLOCKS[index];
}

/**
 * Gets the block index (0-7) for gradient coloring
 */
function valueToBlockIndex(value, min, max) {
  if (value === null || value === undefined) return -1;
  const range = max - min;
  if (range === 0) return 4;
  const normalized = Math.max(0, Math.min(1, (value - min) / range));
  return Math.min(BLOCKS.length - 1, Math.floor(normalized * BLOCKS.length));
}

// ─── ConsoleGraph class ────────────────────────────────────────────────────────
class ConsoleGraph {
  /**
   * Create a new ConsoleGraph instance.
   *
   * @param {Object} [options] - Configuration options
   * @param {number} [options.bufferSize=20] - Number of data points to keep
   * @param {string} [options.label=''] - Label prefix (e.g. 'Memory', 'CPU')
   * @param {string} [options.unit=''] - Unit suffix (e.g. 'MB', '%', 'ms')
   * @param {number} [options.min] - Fixed minimum value (auto-scales if omitted)
   * @param {number} [options.max] - Fixed maximum value (auto-scales if omitted)
   * @param {boolean} [options.color=true] - Enable colored output
   * @param {string} [options.gradient='green'] - Color gradient: 'green'|'heat'|'cool'|'mono'|'ocean'|'none'
   * @param {boolean} [options.showStats=false] - Show min/max/avg stats
   * @param {boolean} [options.showBounds=false] - Show scale bounds [min..max]
   * @param {boolean} [options.inline=false] - Use carriage return for in-place updates (Node only)
   * @param {string} [options.brackets='[]'] - Bracket characters around the sparkline
   * @param {Function} [options.format] - Custom value formatter: (value) => string
   */
  constructor(options = {}) {
    this._bufferSize = options.bufferSize || 20;
    this._label = options.label || '';
    this._unit = options.unit || '';
    this._min = options.min;
    this._max = options.max;
    this._color = options.color !== undefined ? options.color : true;
    this._gradient = options.gradient || 'green';
    this._showStats = options.showStats || false;
    this._showBounds = options.showBounds || false;
    this._inline = options.inline || false;
    this._format = options.format || null;
    this._brackets = options.brackets || '[]';

    /** @type {(number|null)[]} */
    this._buffer = [];
    this._callCount = 0;
  }

  /**
   * Add a value and render the sparkline.
   * @param {number} value - The numerical value to track
   * @returns {string} The rendered sparkline string (without ANSI codes)
   */
  log(value) {
    // Push value to buffer
    this._buffer.push(typeof value === 'number' ? value : null);
    if (this._buffer.length > this._bufferSize) {
      this._buffer.shift();
    }
    this._callCount++;

    const output = this._render();
    this._print(output);
    return output.plain;
  }

  /**
   * Add a value without printing (silent push).
   * @param {number} value
   */
  push(value) {
    this._buffer.push(typeof value === 'number' ? value : null);
    if (this._buffer.length > this._bufferSize) {
      this._buffer.shift();
    }
    this._callCount++;
  }

  /**
   * Render and print the current state without adding a value.
   * @returns {string} The rendered sparkline string
   */
  print() {
    const output = this._render();
    this._print(output);
    return output.plain;
  }

  /**
   * Get the sparkline string without printing.
   * @returns {string}
   */
  toString() {
    return this._render().plain;
  }

  /**
   * Reset the buffer.
   */
  reset() {
    this._buffer = [];
    this._callCount = 0;
  }

  /**
   * Get current statistics.
   * @returns {{ min: number, max: number, avg: number, current: number, count: number }}
   */
  stats() {
    const values = this._buffer.filter((v) => v !== null && v !== undefined);
    if (values.length === 0) return { min: 0, max: 0, avg: 0, current: 0, count: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg, current: values[values.length - 1], count: this._callCount };
  }

  /**
   * Get a snapshot of the buffer.
   * @returns {number[]}
   */
  get buffer() {
    return [...this._buffer];
  }

  /**
   * Get/set the label.
   */
  get label() {
    return this._label;
  }
  set label(v) {
    this._label = v;
  }

  // ─── Internal rendering ────────────────────────────────────────────────

  _render() {
    const { min, max } = getBounds(this._buffer, this._min, this._max);
    const current = this._buffer.length > 0 ? this._buffer[this._buffer.length - 1] : null;

    // Build sparkline characters
    const blocks = this._buffer.map((v) => valueToBlock(v, min, max));
    const indices = this._buffer.map((v) => valueToBlockIndex(v, min, max));

    const openBracket = this._brackets[0] || '[';
    const closeBracket = this._brackets[1] || ']';

    // Format current value
    const valueStr = this._format
      ? this._format(current)
      : formatValue(current, this._unit);

    // Build plain text
    let plain = '';
    if (this._label) plain += `${this._label}: `;
    plain += `${openBracket}${blocks.join('')}${closeBracket}`;
    plain += ` ${valueStr}`;

    if (this._showStats && this._buffer.length > 1) {
      const s = this.stats();
      plain += ` (min:${formatValue(s.min, this._unit)} max:${formatValue(s.max, this._unit)} avg:${formatValue(s.avg, this._unit)})`;
    }

    if (this._showBounds) {
      plain += ` [${formatValue(min, '')}..${formatValue(max, '')}]`;
    }

    // Build colored output
    let colored;
    if (this._color && !isBrowser) {
      colored = this._renderAnsi(blocks, indices, openBracket, closeBracket, valueStr, min, max);
    } else if (this._color && isBrowser) {
      colored = this._renderBrowser(blocks, indices, openBracket, closeBracket, valueStr, min, max);
    } else {
      colored = { text: plain, args: [] };
    }

    return { plain, colored };
  }

  _renderAnsi(blocks, indices, openBracket, closeBracket, valueStr, min, max) {
    const gradientPalette = GRADIENTS[this._gradient] || GRADIENTS.green;
    let text = '';

    if (this._label) {
      text += `${ANSI.bold}${ANSI.cyan}${this._label}:${ANSI.reset} `;
    }

    text += `${ANSI.dim}${openBracket}${ANSI.reset}`;

    if (gradientPalette) {
      for (let i = 0; i < blocks.length; i++) {
        const idx = indices[i];
        const color = idx >= 0 ? gradientPalette[idx] : ANSI.dim;
        text += `${color}${blocks[i]}${ANSI.reset}`;
      }
    } else {
      text += blocks.join('');
    }

    text += `${ANSI.dim}${closeBracket}${ANSI.reset}`;
    text += ` ${ANSI.bold}${valueStr}${ANSI.reset}`;

    if (this._showStats && this._buffer.length > 1) {
      const s = this.stats();
      text += ` ${ANSI.dim}(min:${formatValue(s.min, this._unit)} max:${formatValue(s.max, this._unit)} avg:${formatValue(s.avg, this._unit)})${ANSI.reset}`;
    }

    if (this._showBounds) {
      text += ` ${ANSI.dim}[${formatValue(min, '')}..${formatValue(max, '')}]${ANSI.reset}`;
    }

    return { text, args: [] };
  }

  _renderBrowser(blocks, indices, openBracket, closeBracket, valueStr, min, max) {
    const gradientPalette = BROWSER_GRADIENTS[this._gradient] || BROWSER_GRADIENTS.green;
    let text = '';
    const args = [];

    if (this._label) {
      text += '%c' + this._label + ': ';
      args.push('font-weight:bold;color:#06b6d4');
    }

    text += '%c' + openBracket;
    args.push('color:#6b7280');

    if (gradientPalette) {
      for (let i = 0; i < blocks.length; i++) {
        const idx = indices[i];
        const color = idx >= 0 ? gradientPalette[idx] : '#6b7280';
        text += '%c' + blocks[i];
        args.push(`color:${color};font-size:14px`);
      }
    } else {
      text += '%c' + blocks.join('');
      args.push('font-size:14px');
    }

    text += '%c' + closeBracket;
    args.push('color:#6b7280');

    text += '%c ' + valueStr;
    args.push('font-weight:bold;color:inherit');

    if (this._showStats && this._buffer.length > 1) {
      const s = this.stats();
      text += '%c' + ` (min:${formatValue(s.min, this._unit)} max:${formatValue(s.max, this._unit)} avg:${formatValue(s.avg, this._unit)})`;
      args.push('color:#9ca3af');
    }

    if (this._showBounds) {
      text += '%c' + ` [${formatValue(min, '')}..${formatValue(max, '')}]`;
      args.push('color:#9ca3af');
    }

    return { text, args };
  }

  _print(output) {
    const { colored } = output;

    if (this._inline && isNode && process.stdout && process.stdout.clearLine) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(colored.text);
    } else if (isBrowser && colored.args.length > 0) {
      console.log(colored.text, ...colored.args);
    } else if (isNode) {
      console.log(colored.text);
    } else {
      console.log(output.plain);
    }
  }
}

// ─── Multi-graph dashboard ─────────────────────────────────────────────────────
class GraphDashboard {
  /**
   * Create a dashboard with multiple named graphs.
   * @param {Object} [globalOptions] - Options applied to all graphs
   */
  constructor(globalOptions = {}) {
    this._globalOptions = globalOptions;
    /** @type {Map<string, ConsoleGraph>} */
    this._graphs = new Map();
  }

  /**
   * Add or update a named graph with a value.
   * @param {string} name - Graph identifier
   * @param {number} value - Value to log
   * @param {Object} [options] - Per-graph options (merged with global)
   */
  log(name, value, options = {}) {
    if (!this._graphs.has(name)) {
      this._graphs.set(
        name,
        new ConsoleGraph({
          ...this._globalOptions,
          label: name,
          ...options,
        })
      );
    }
    const graph = this._graphs.get(name);
    graph.push(value);
  }

  /**
   * Render all graphs at once.
   */
  print() {
    if (isNode && !isBrowser) {
      // Clear previous dashboard lines
      const count = this._graphs.size;
      if (this._printed) {
        process.stdout.write(`\x1b[${count}A`);
      }
      for (const graph of this._graphs.values()) {
        const output = graph._render();
        process.stdout.clearLine && process.stdout.clearLine(0);
        process.stdout.cursorTo && process.stdout.cursorTo(0);
        console.log(output.colored.text);
      }
      this._printed = true;
    } else {
      console.clear();
      for (const graph of this._graphs.values()) {
        graph.print();
      }
    }
  }

  /**
   * Get a specific graph instance.
   * @param {string} name
   * @returns {ConsoleGraph}
   */
  get(name) {
    return this._graphs.get(name);
  }

  /**
   * Reset all graphs.
   */
  reset() {
    this._graphs.forEach((g) => g.reset());
  }
}

// ─── Convenience: single sparkline string ──────────────────────────────────────
/**
 * Generate a sparkline string from an array of numbers.
 * @param {number[]} values - Array of numerical values
 * @param {Object} [options] - Options (same as ConsoleGraph)
 * @returns {string} Plain sparkline string
 */
function sparkline(values, options = {}) {
  const graph = new ConsoleGraph({ ...options, bufferSize: values.length });
  values.forEach((v) => graph.push(v));
  return graph.toString();
}

// ─── Exports ───────────────────────────────────────────────────────────────────
export { ConsoleGraph, GraphDashboard, sparkline, BLOCKS, formatValue };
export default ConsoleGraph;
