/**
 * 统计学工具函数
 * Z-Score / p-value / 均值方差校正
 */

/**
 * 根据 Z 值计算累积概率（近似正态分布 CDF）
 */
export function getZPercent(z) {
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);

  while (Math.abs(term) > loopStop) {
    term =
      (0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
        (2 * k + 1) /
        Math.pow(2, k) *
        Math.pow(z, k + 1) /
        factK;
    sum += term;
    k++;
    factK *= k;
  }
  sum += 0.5;
  return sum;
}

/**
 * 两总体 Z 检验
 */
export function ZScore(mean1, std1, n1, mean2, std2, n2) {
  return (mean1 - mean2) / Math.sqrt((std1 * std1) / n1 + (std2 * std2) / n2);
}

/**
 * 转化率比例检验（Z-test for proportions）
 *
 * 比较两个转化率是否有显著差异，用于 AB 测试显著性判定。
 * 比指标值均值的 Z 检验更符合「转化率是否显著」的直觉。
 *
 * @param {number} converters1 - 实验组转化人数
 * @param {number} n1 - 实验组总 UV
 * @param {number} converters2 - 对照组转化人数
 * @param {number} n2 - 对照组总 UV
 * @returns {{ zscore: number, pvalue: number }}
 */
export function proportionZTest(converters1, n1, converters2, n2) {
  if (n1 <= 0 || n2 <= 0) return { zscore: NaN, pvalue: NaN };

  const p1 = converters1 / n1;
  const p2 = converters2 / n2;
  const pooledP = (converters1 + converters2) / (n1 + n2);

  // pooled SE = 0 时（两组都 0 或都 100%），无法检验
  if (pooledP === 0 || pooledP === 1) return { zscore: NaN, pvalue: NaN };

  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  if (se === 0) return { zscore: NaN, pvalue: NaN };

  const z = (p1 - p2) / se;
  const p = 2 * getZPercent(-Math.abs(z));
  return { zscore: z, pvalue: p };
}

/**
 * 校正均值和标准差
 * 服务端统计的是 target 的均值/方差，需要补齐未触发用户的 0 值
 */
export function realMeanStd(mean, std, user, uv) {
  let realMean = mean;
  let realS = std * std * (user - 1);

  for (let i = user; i < uv; i++) {
    const score = 0;
    const count = i + 1;
    realS = realS + ((count - 1) / count) * (score - realMean) * (score - realMean);
    realMean = realMean + (score - realMean) / count;
  }

  const realStd = Math.sqrt(realS / (uv - 1));
  return [realMean, realStd, uv];
}
