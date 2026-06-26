/**
 * 实验详情页
 * 4 个 Tab：概览 / 转化率 / 版本 / 指标
 *
 * 视觉升级：
 * - 大标题 + 状态徽章 + 元信息行
 * - KPI 卡片行（PV / UV / 版本数 / 流量分配）
 * - 转化率 Tab 加显著性标识（显著提升/下降/不显著）和 lift %
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tabs, Tag, Table, Progress, Space, Alert, Skeleton,
  Tooltip, Card, Modal, message,
} from 'antd';
import {
  PlayCircleOutlined, PauseCircleOutlined,
  DeleteOutlined, PlusOutlined, PieChartOutlined, QuestionCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useApp } from '../store/AppContext';
import { parseRateData, parseTrafficData } from '../utils/parse';
import { getZPercent, ZScore, realMeanStd, proportionZTest } from '../utils/stats';
import { getStatusConfig, getSignificance } from '../constants';
import EditWeightModal from '../components/EditWeightModal';
import NewVersionModal from '../components/NewVersionModal';
import NewTargetModal from '../components/NewTargetModal';
import EmptyState from '../components/EmptyState';

// 紧凑数字格式：1234 → 1.2k，1234567 → 1.2M
function formatCompact(n) {
  if (n == null) return '-';
  const num = Number(n);
  if (!isFinite(num)) return '-';
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

export default function ExperimentDetail() {
  const { varName } = useParams();
  const navigate = useNavigate();
  const {
    tests, versions, targets, testWeight, testAction, loadRate, loadTraffic,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [rateData, setRateData] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [trafficData, setTrafficData] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [showEditWeight, setShowEditWeight] = useState(false);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [showNewTarget, setShowNewTarget] = useState(false);

  const test = tests.find((t) => t.var_name === varName);
  const testVersions = versions.filter((v) => v.var_name === varName);
  const testTargets = targets.filter((t) => t.var_name === varName);
  const tw = testWeight[varName] || { weight: [], total: 0 };

  /* ==================== 按需加载分析数据 ==================== */

  const fetchRate = useCallback(async () => {
    setRateLoading(true);
    const result = await loadRate(varName);
    if (result.error) {
      setRateData({ error: result.error });
    } else {
      setRateData(result);
    }
    setRateLoading(false);
  }, [varName, loadRate]);

  const fetchTraffic = useCallback(async () => {
    setTrafficLoading(true);
    const result = await loadTraffic(varName);
    if (result.error) {
      setTrafficData({ error: result.error });
    } else {
      setTrafficData(result);
    }
    setTrafficLoading(false);
  }, [varName, loadTraffic]);

  useEffect(() => {
    fetchTraffic();
  }, [fetchTraffic]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'rate' && !rateData) fetchRate();
    if (key === 'targets' && !rateData) fetchRate();
    if (key === 'overview' && !trafficData) fetchTraffic();
  };

  const handleAction = (action, title) => {
    Modal.confirm({
      title: title || '确认操作',
      content: `确定将实验状态更新为：${action}`,
      okButtonProps: action === 'deleted' ? { danger: true } : {},
      onOk: () => testAction(varName, action),
    });
  };

  if (!test) {
    return (
      <div className="page-container">
        <EmptyState icon="🔍" title="实验不存在" />
      </div>
    );
  }

  const cfg = getStatusConfig(test.status);

  // KPI 数据
  const totalPV = testVersions.reduce((s, v) => s + (Number(v.pv) || 0), 0);
  const totalUV = testVersions.reduce((s, v) => s + (Number(v.uv) || 0), 0);

  return (
    <div className="page-container">
      {/* ====== 详情页头部 ====== */}
      <div className="detail-header">
        <div className="detail-title-block">
          <div className="detail-title">
            <h2>{test.name}</h2>
            <Tag color={cfg.color} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center' }}>
              <span className={`status-dot is-${cfg.tone}`} style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}22`, marginRight: 6 }} />
              {cfg.label}
            </Tag>
          </div>
          <div className="detail-meta-line">
            <span className="meta-mono">{test.var_name}</span>
            <span><span className="meta-label">流量层</span> <span className="meta-mono">{test.layer}</span></span>
            <span><span className="meta-label">类型</span> {test.var_type}</span>
            <span><span className="meta-label">默认值</span> <span className="meta-mono">{test.default_value}</span></span>
            {test.condition ? (
              <span><span className="meta-label">条件</span> <span className="meta-mono">{test.condition}</span></span>
            ) : null}
          </div>
        </div>

        <div className="detail-actions">
          {(test.status === 'init' || test.status === 'stoped') && (
            <Button type="primary" icon={<PlayCircleOutlined />}
              onClick={() => handleAction('running', '启动实验')}>
              启动
            </Button>
          )}
          {test.status === 'running' && (
            <Button danger icon={<PauseCircleOutlined />}
              onClick={() => handleAction('stoped', '停止实验')}>
              停止
            </Button>
          )}
          {test.status === 'stoped' && (
            <Button danger icon={<DeleteOutlined />}
              onClick={() => handleAction('deleted', '删除实验')}>
              删除
            </Button>
          )}
        </div>
      </div>

      {/* ====== KPI 卡片行 ====== */}
      <div className="kpi-grid">
        <KPICard label="累计 PV" value={formatCompact(totalPV)} />
        <KPICard label="累计 UV" value={formatCompact(totalUV)} />
        <KPICard label="版本数" value={testVersions.length} />
        <KPICard
          label="流量分配"
          tone={tw.total >= 100 ? 'warning' : 'neutral'}
          value={tw.total}
          suffix="%"
          hint={tw.total >= 100 ? '已占满' : `剩余 ${100 - tw.total}%`}
        />
        <KPICard label="层内占比" value={test.weight} suffix="%" hint={`流量层 ${test.layer}`} />
        <KPICard label="指标数" value={testTargets.length} />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <OverviewTab
                test={test}
                versions={testVersions}
                tw={tw}
                trafficData={trafficData}
                trafficLoading={trafficLoading}
                onRetryTraffic={fetchTraffic}
              />
            ),
          },
          {
            key: 'rate',
            label: '转化率',
            children: (
              <RateTab
                rateData={rateData}
                rateLoading={rateLoading}
                defaultValue={test.default_value}
                onRetry={fetchRate}
              />
            ),
          },
          {
            key: 'versions',
            label: '版本',
            children: (
              <VersionsTab
                versions={testVersions}
                tw={tw}
                onEditWeight={() => setShowEditWeight(true)}
                onAddVersion={() => setShowNewVersion(true)}
              />
            ),
          },
          {
            key: 'targets',
            label: '指标',
            children: (
              <TargetsTab
                targets={testTargets}
                rateData={rateData}
                defaultValue={test.default_value}
                onAddTarget={() => setShowNewTarget(true)}
              />
            ),
          },
        ]}
      />

      {/* ====== 弹窗 ====== */}
      <EditWeightModal
        open={showEditWeight}
        varName={varName}
        onClose={() => setShowEditWeight(false)}
      />
      <NewVersionModal
        open={showNewVersion}
        experiment={{ var_name: varName, name: test.name, weight: tw.total }}
        onClose={() => setShowNewVersion(false)}
      />
      <NewTargetModal
        open={showNewTarget}
        varName={varName}
        onClose={() => setShowNewTarget(false)}
      />
    </div>
  );
}

/* ============================================================
 * KPI 卡片
 * ============================================================ */
function KPICard({ label, value, suffix, hint, tone }) {
  const cls = tone ? `kpi-card is-${tone}` : 'kpi-card';
  return (
    <div className={cls}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {suffix ? <span className="kpi-value-suffix">{suffix}</span> : null}
      </div>
      {hint ? <div className="kpi-hint">{hint}</div> : null}
    </div>
  );
}

/* ============================================================
 * Tab 1: 概览 —— 版本卡片 + 流量趋势图
 * ============================================================ */
function OverviewTab({ test, versions, tw, trafficData, trafficLoading, onRetryTraffic }) {
  return (
    <div>
      <div className="version-cards">
        {versions.length === 0 ? (
          <EmptyState icon="📦" title="暂无版本" description="点击右上角“新增版本”开始配置" />
        ) : (
          versions.map((v) => {
            const w = tw.weight.find((w) => w.value === v.value);
            const weight = w ? w.weight : 0;
            return (
              <Card key={v.version} size="small" className="version-card">
                <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                  {v.name === v.value ? v.name : `${v.name}(${v.value})`}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-hover)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {weight}<span style={{ fontSize: 14, color: 'var(--text-3)', marginLeft: 2 }}>%</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 16, color: 'var(--text-3)', fontSize: 12 }}>
                  <span>PV: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{formatCompact(v.pv)}</span></span>
                  <span>UV: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{formatCompact(v.uv)}</span></span>
                </div>
                {v.value === test.default_value && (
                  <Tag style={{ marginTop: 8, borderRadius: 6 }}>默认版本</Tag>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Card title="流量趋势" size="small" style={{ marginTop: 16, borderRadius: 'var(--radius-lg)' }}>
        <div style={{ minHeight: trafficLoading ? 320 : 'auto' }}>
          {trafficLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : trafficData?.error ? (
            <Alert type="error" showIcon message={trafficData.error} action={onRetryTraffic && <Button size="small" onClick={onRetryTraffic}>重试</Button>} />
          ) : !trafficData || !trafficData.values || trafficData.values.length === 0 ? (
            <EmptyState icon="📈" title="暂无流量数据" description="实验运行后会自动统计流量数据" />
          ) : (
            <TrafficChart trafficData={trafficData} versions={versions} />
          )}
        </div>
      </Card>
    </div>
  );
}

function TrafficChart({ trafficData, versions }) {
  const { values, targets, traffic } = trafficData;

  const rows = parseTrafficData(traffic, values, targets);
  const chartData = rows.flatMap((row) =>
    values.map((val) => {
      const ver = versions.find((v) => v.var_name === versions[0]?.var_name && v.value === val);
      const name = ver ? ver.name : val;
      return {
        day: row.day,
        type: name === val ? val : `${name}(${val})`,
        value: row[val] || 0,
      };
    }),
  );

  return (
    <Line
      height={320}
      data={chartData}
      xField="day"
      yField="value"
      seriesField="type"
      smooth
      point={{ size: 3 }}
      yAxis={{ label: { formatter: (v) => v } }}
      tooltip={{ showCrosshairs: true }}
      color={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']}
      theme={{
        styleSheet: {
          brandColor: '#6366f1',
          paletteQualitative10: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4f46e5'],
          backgroundColor: 'transparent',
        },
      }}
      axis={{
        x: { line: { stroke: '#e2e8f0' }, label: { fill: '#94a3b8' } },
        y: { line: { stroke: '#e2e8f0' }, label: { fill: '#94a3b8' }, grid: { line: { stroke: '#f1f5f9' } } },
      }}
      legend={{ position: 'top', marker: { symbol: 'smooth' } }}
    />
  );
}

/* ============================================================
 * Tab 2: 转化率 —— 版本对比表（带显著性标识）
 * ============================================================ */
function RateTab({ rateData, rateLoading, defaultValue, onRetry }) {
  if (rateLoading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (!rateData) return <EmptyState icon="📊" title="点击此 Tab 加载转化率数据" />;
  if (rateData.error) return (
    <Alert
      type="error"
      showIcon
      message={rateData.error}
      action={onRetry && <Button size="small" onClick={onRetry}>重试</Button>}
    />
  );

  const { targets = [], versions: rawVersions = [] } = rateData;
  const rows = parseRateData(rawVersions, targets, defaultValue);

  if (rows.length === 0) {
    return <EmptyState icon="📊" title="暂无转化率数据" />;
  }

  const defaultRow = rows.find((r) => r.value === defaultValue) || {};

  // 对照组的关键指标值（用于 lift 计算）
  const controlRates = {};
  if (defaultRow && defaultRow.targets) {
    for (const tName of targets) {
      const dt = defaultRow.targets[tName] || {};
      const dUV = defaultRow.uv || 1;
      controlRates[tName] = (dt.user || 0) / dUV;
    }
  }

  // 构建表格列
  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      fixed: 'left',
      width: 180,
      render: (version, row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{version}</span>
          <Tag style={{ margin: 0, fontSize: 11 }}>{row.weight}%</Tag>
          {row.value === defaultValue && <Tag color="purple" style={{ margin: 0 }}>对照</Tag>}
        </span>
      ),
    },
    {
      title: 'PV',
      dataIndex: 'pv',
      key: 'pv',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCompact(v)}</span>,
    },
    {
      title: 'UV',
      dataIndex: 'uv',
      key: 'uv',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCompact(v)}</span>,
    },
  ];

  for (const target of targets) {
    columns.push({
      title: (
        <Tooltip
          title={
            <div>
              转化率：转化人数／实验UV<br />
              转化人数：累计指标触发人数<br />
              总值：累计上报指标数<br />
              人均：总值／转化人数<br />
              全量均值：总值／实验UV（含未转化用户，用于 Z 检验）<br />
              标准差：全量均值的离散程度<br />
              lift：相对对照组转化率的提升幅度
            </div>
          }
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {target} <QuestionCircleOutlined style={{ color: 'var(--text-3)' }} />
          </span>
        </Tooltip>
      ),
      key: target,
      width: 240,
      render: (_, row) => {
        const t = row.targets[target] || {};
        const dt = defaultRow.targets ? (defaultRow.targets[target] || {}) : {};
        const uv = row.uv || 1;

        const [dRealMean, dRealStd, dRealN] = realMeanStd(
          dt.mean || 0, dt.std || 0, dt.user || 0, defaultRow.uv || 0,
        );
        const [tRealMean, tRealStd, tRealN] = realMeanStd(
          t.mean || 0, t.std || 0, t.user || 0, uv,
        );

        const treatmentRate = (t.user || 0) / uv;
        const controlRate = controlRates[target] || 0;

        // 转化率比例检验（用于显著性判定）
        const { zscore, pvalue } = proportionZTest(
          t.user || 0, uv,
          dt.user || 0, defaultRow.uv || 0,
        );

        // 指标值均值 Z 检验（仅展示）
        const meanZscore = ZScore(tRealMean, tRealStd, tRealN, dRealMean, dRealStd, dRealN);
        const meanPvalue = 2 * getZPercent(-Math.abs(meanZscore));

        const sig = getSignificance({
          isControl: row.value === defaultValue,
          zscore,
          pvalue,
          treatmentRate,
          controlRate,
        });

        return (
          <div className="rate-cell">
            <div className="rate-cell-primary">
              <span className="rate-cell-rate">
                {(treatmentRate * 100).toFixed(2)}%
              </span>
              <SignificanceBadge sig={sig} />
            </div>
            <div className="rate-line">转化人数：<b>{t.user || 0}</b></div>
            <div className="rate-line rate-line-muted">
                总值：{t.count || 0} · 人均：{t.user ? (t.count / t.user).toFixed(2) : '-'}
              </div>
              <div className="rate-line rate-line-muted">
                全量均值：{tRealMean.toFixed(2)} · 标准差：{tRealStd.toFixed(3)}
              </div>
            {row.value !== defaultValue && (
              <div className="rate-line rate-line-muted" style={{ marginTop: 2 }}>
                转化率检验 Z={isNaN(zscore) ? '-' : zscore.toFixed(3)} p={isNaN(pvalue) ? '-' : pvalue.toFixed(3)}
              </div>
            )}
            {row.value !== defaultValue && (
              <div className="rate-line rate-line-muted">
                均值检验 Z={isNaN(meanZscore) ? '-' : meanZscore.toFixed(3)} p={isNaN(meanPvalue) ? '-' : meanPvalue.toFixed(3)}
              </div>
            )}
          </div>
        );
      },
    });
  }

  return (
    <Table
      dataSource={rows}
      rowKey={(row) => row.version}
      columns={columns}
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
}

/* ============================================================
 * 显著性徽章
 * ============================================================ */
function SignificanceBadge({ sig }) {
  if (sig.type === 'control') {
    return <span className="sig-badge is-control">对照组</span>;
  }
  if (sig.type === 'win') {
    return (
      <span className="sig-badge is-win">
        <ArrowUpOutlined className="sig-arrow" />
        {sig.lift != null ? `+${sig.lift.toFixed(1)}%` : '显著提升'}
      </span>
    );
  }
  if (sig.type === 'loss') {
    return (
      <span className="sig-badge is-loss">
        <ArrowDownOutlined className="sig-arrow" />
        {sig.lift != null ? `${sig.lift.toFixed(1)}%` : '显著下降'}
      </span>
    );
  }
  return (
    <span className="sig-badge is-neutral">
      <MinusOutlined className="sig-arrow" />
      不显著{sig.lift != null ? ` · ${sig.lift >= 0 ? '+' : ''}${sig.lift.toFixed(1)}%` : ''}
    </span>
  );
}

/* ============================================================
 * Tab 3: 版本管理
 * ============================================================ */
function VersionsTab({ versions, tw, onEditWeight, onAddVersion }) {
  const columns = [
    {
      title: '版本值',
      dataIndex: 'value',
      key: 'value',
      render: (val, row) => (row.name === val ? val : `${row.name}(${val})`),
    },
    {
      title: '流量',
      dataIndex: 'value',
      key: 'weight',
      render: (val) => {
        const w = tw.weight.find((w) => w.value === val);
        const weight = w ? w.weight : 0;
        return <Progress percent={weight} size="small" format={(p) => `${p}%`} />;
      },
    },
    {
      title: 'PV', dataIndex: 'pv', key: 'pv',
      align: 'right',
      render: (v) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCompact(v)}</span>,
    },
    {
      title: 'UV', dataIndex: 'uv', key: 'uv',
      align: 'right',
      render: (v) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCompact(v)}</span>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-2)' }}>
          共 <b>{versions.length}</b> 个版本，已分配流量 <b style={{ color: tw.total >= 100 ? 'var(--warning)' : 'var(--text-1)' }}>{tw.total}%</b>
        </span>
        <Space>
          <Button icon={<PieChartOutlined />} onClick={onEditWeight}>编辑流量</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddVersion}>
            新增版本
          </Button>
        </Space>
      </div>
      <Table
        dataSource={versions}
        rowKey={(row) => row.version}
        columns={columns}
        pagination={false}
      />
    </div>
  );
}

/* ============================================================
 * Tab 4: 指标管理
 * ============================================================ */
function TargetsTab({ targets, rateData, defaultValue, onAddTarget }) {
  // aggregate from rate data
  const aggMap = React.useMemo(() => {
    if (!rateData || rateData.error) return {};
    const { targets: rateTargets = [], versions: rawVersions = [] } = rateData;
    const rows = parseRateData(rawVersions, rateTargets, defaultValue);
    const map = {};
    let totalUV = 0;
    for (const row of rows) totalUV += row.uv || 0;
    for (const tName of rateTargets) {
      let count = 0, user = 0;
      for (const row of rows) {
        const t = row.targets[tName];
        if (t) { count += t.count || 0; user += t.user || 0; }
      }
      map[tName] = { count, user, rate: totalUV > 0 ? (user / totalUV) * 100 : 0 };
    }
    return map;
  }, [rateData, defaultValue]);

  const columns = [
    {
      title: '指标名称', dataIndex: 'target_name', key: 'target_name',
      render: (v) => <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 13 }}>{v}</span>,
    },
    {
      title: <Tooltip title="所有版本的指标触发值之和">触发总量</Tooltip>,
      key: 'count',
      align: 'right',
      render: (_, row) => {
        const agg = aggMap[row.target_name];
        const v = agg ? agg.count : null;
        return v != null ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCompact(v)}</span> : <span style={{ color: 'var(--text-3)' }}>-</span>;
      },
    },
    {
      title: <Tooltip title="所有版本触发该指标的独立用户数之和">转化人数</Tooltip>,
      key: 'user',
      align: 'right',
      render: (_, row) => {
        const agg = aggMap[row.target_name];
        const v = agg ? agg.user : null;
        return v != null ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span> : <span style={{ color: 'var(--text-3)' }}>-</span>;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddTarget}>
          新增指标
        </Button>
      </div>
      <Table
        dataSource={targets}
        rowKey={(row) => row.target_name}
        columns={columns}
        pagination={false}
        size="middle"
      />
      {!rateData && (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 16 }}>
          访问「转化率」Tab 加载数据后，此处将展示各指标的聚合统计
        </p>
      )}
    </div>
  );
}
