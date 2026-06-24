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
