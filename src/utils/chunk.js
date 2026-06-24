/**
 * 将数组按 n 个元素切分为二维数组
 * 替代原来的 Array.prototype.chunk polyfill (vendor.js)
 */
export function chunk(arr, n) {
  if (!Array.isArray(arr) || n <= 0) return [];
  return Array.from(
    { length: Math.ceil(arr.length / n) },
    (_, i) => arr.slice(i * n, i * n + n),
  );
}
