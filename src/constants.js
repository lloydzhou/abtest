/**
 * 全局常量定义
 * 实验状态、显著性判定等共用配置
 */

/**
 * 实验状态配置
 * @typedef {Object} StatusConfig
 * @property {string} label  中文标签
 * @property {string} color  Ant Design Tag 语义色
 * @property {string} dot    状态圆点色（十六进制）
 * @property {string} tone   语义分组：positive / neutral / warning / danger
 */
export const STATUS_CONFIG = {
  running: { label: '运行中', color: 'processing', dot: '#10b981', tone: 'positive' },
  stoped:  { label: '已停止', color: 'warning',    dot: '#f59e0b', tone: 'warning' },
  init:    { label: '未启动', color: 'default',    dot: '#94a3b8', tone: 'neutral' },
  deleted: { label: '已删除', color: 'error',      dot: '#ef4444', tone: 'danger' },
};

/**
 * 根据状态返回配置，未知状态回退到中性
 */
export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, color: 'default', dot: '#94a3b8', tone: 'neutral' };
}

/**
 * 显著性判定阈值
 */
export const SIGNIFICANCE_THRESHOLD = 0.05;

/**
 * 根据对照组/实验组的指标值、Z-score、p-value 判定显著性
 * @returns {{type: 'win'|'loss'|'neutral', label: string, color: string, bg: string, lift: number|null}}
 */
export function getSignificance({
  isControl,
  zscore,
  pvalue,
  treatmentRate,
  controlRate,
}) {
  // 对照组本身不参与显著性比较
  if (isControl) {
    return { type: 'control', label: '对照组', color: '#6366f1', bg: 'rgba(99,102,241,0.10)' };
  }

  // 提升幅度
  const lift = (typeof treatmentRate === 'number' && typeof controlRate === 'number' && controlRate > 0)
    ? ((treatmentRate - controlRate) / controlRate) * 100
    : null;

  const significant = (typeof pvalue === 'number' && !isNaN(pvalue) && pvalue < SIGNIFICANCE_THRESHOLD);

  if (!significant || zscore == null || isNaN(zscore)) {
    return {
      type: 'neutral',
      label: '不显著',
      color: '#64748b',
      bg: 'rgba(100,116,139,0.10)',
      lift,
    };
  }

  if (zscore > 0) {
    return {
      type: 'win',
      label: '显著提升',
      color: '#059669',
      bg: 'rgba(16,185,129,0.12)',
      lift,
    };
  }

  return {
    type: 'loss',
    label: '显著下降',
    color: '#dc2626',
    bg: 'rgba(239,68,68,0.12)',
    lift,
  };
}
