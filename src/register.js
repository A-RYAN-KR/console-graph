/**
 * console-graph/register — Auto-patches console with a .graph() method
 *
 * Usage:
 *   import 'console-graph/register';
 *   // or: require('console-graph/register');
 *
 *   console.graph(42, { label: 'Memory', unit: 'MB' });
 */
import { ConsoleGraph } from './sparkline.js';

// Store graph instances by label (so we reuse buffers)
const _instances = new Map();

/**
 * console.graph(value, options?)
 *
 * @param {number} value - The numerical value to log
 * @param {Object} [options] - Options (label identifies the graph instance)
 * @param {string} [options.label='default'] - Graph label
 * @param {string} [options.unit] - Unit suffix
 * @param {number} [options.bufferSize] - Buffer size
 * @param {number} [options.min] - Fixed minimum
 * @param {number} [options.max] - Fixed maximum
 * @param {string} [options.gradient] - Color gradient name
 * @param {boolean} [options.color] - Enable color
 */
if (typeof console !== 'undefined') {
  console.graph = function (value, options = {}) {
    const key = options.label || 'default';

    if (!_instances.has(key)) {
      _instances.set(key, new ConsoleGraph({ label: key === 'default' ? '' : key, ...options }));
    }

    const graph = _instances.get(key);
    return graph.log(value);
  };

  /**
   * console.graphReset(label?) — Reset a specific graph or all graphs
   */
  console.graphReset = function (label) {
    if (label) {
      const g = _instances.get(label);
      if (g) g.reset();
    } else {
      _instances.forEach((g) => g.reset());
      _instances.clear();
    }
  };
}
