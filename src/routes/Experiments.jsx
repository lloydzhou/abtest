/**
 * 实验列表页
 * - 按 Layer 分组的折叠面板（卡片视图）
 * - 平铺表格视图（带搜索、状态筛选、Layer 筛选）
 * 两种视图通过顶部切换器切换，筛选条件对两种视图同时生效
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Collapse, Tag, Space, Tooltip, Input, Select,
  Table, Segmented,
} from 'antd';
import {
  PlusOutlined, PieChartOutlined, PlusCircleOutlined, SearchOutlined,
  AppstoreOutlined, UnorderedListOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import { useApp } from '../store/AppContext';
import { getStatusConfig } from '../constants';
import NewTestModal from '../components/NewTestModal';
import EditWeightModal from '../components/EditWeightModal';
import NewVersionModal from '../components/NewVersionModal';
import TrafficBar from '../components/TrafficBar';
import { ExperimentsSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

// 状态筛选下拉项
const STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '运行中', value: 'running' },
  { label: '已停止', value: 'stoped' },
  { label: '未启动', value: 'init' },
  { label: '已删除', value: 'deleted' },
];

// 状态徽章：圆点 + 文字
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`status-dot is-${cfg.tone}`} style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}22` }} />
  );
}

export default function Experiments() {
  const navigate = useNavigate();
  const {
    tests, layers, versions, targets, layerWeight, testWeight,
    loading,
  } = useApp();

  const [showNewTest, setShowNewTest] = useState(false);
  const [defaultLayer, setDefaultLayer] = useState(null);
  const [editWeightVar, setEditWeightVar] = useState(null);
  const [newVersionExp, setNewVersionExp] = useState(null);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [layerFilter, setLayerFilter] = useState('all');
  const [view, setView] = useState('card'); // 'card' | 'table'

  const openNewTest = (layer) => {
    setDefaultLayer(layer || null);
    setShowNewTest(true);
  };

  /* ==================== 筛选后的实验列表 ==================== */
  const filteredTests = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return tests.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (layerFilter !== 'all' && t.layer !== layerFilter) return false;
      if (kw) {
        const hay = `${t.name || ''} ${t.var_name || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [tests, keyword, statusFilter, layerFilter]);

  // 按 Layer 分组实验（基于筛选后的结果）
  const groupedTests = useMemo(() => {
    const map = {};
    for (const test of filteredTests) {
      if (!map[test.layer]) map[test.layer] = [];
      map[test.layer].push(test);
    }
    return map;
  }, [filteredTests]);

  // 是否有任何筛选条件生效
  const hasFilter = keyword.trim() !== '' || statusFilter !== 'all' || layerFilter !== 'all';

  /* ==================== 卡片视图：Collapse 折叠面板 ==================== */
  const collapseItems = useMemo(() => {
    if (layers.length === 0 && filteredTests.length === 0) return [];
    // 无筛选时展示所有层（含空层，便于新建实验）；有筛选时只展示仍命中的层
    const visibleLayers = hasFilter
      ? Object.keys(groupedTests)
      : [...new Set([...layers, ...Object.keys(groupedTests)])];
    return visibleLayers.map((layer) => {
      const layerTests = groupedTests[layer] || [];
      const lw = layerWeight[layer] || { total: 0, weight: [] };

      return {
        key: layer,
        label: (
          <div className="layer-header" onClick={(e) => e.stopPropagation()}>
            <span className="layer-header-name">{layer}</span>
            <Tag style={{ borderRadius: 6 }}>{layerTests.length} 个实验</Tag>
            <div className="layer-header-bar">
              <TrafficBar
                segments={lw.weight.map((w) => ({ label: w.name || w.var_name, weight: w.weight }))}
                height={20}
              />
            </div>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openNewTest(layer)}>
              新建实验
            </Button>
          </div>
        ),
        children: (
          <div className="exp-grid">
            {layerTests.length === 0 ? (
              <EmptyState icon="🔍" title="该层暂无实验" />
            ) : (
              layerTests.map((test) => (
                <ExperimentCard
                  key={test.var_name}
                  test={test}
                  versions={versions}
                  targets={targets}
                  testWeight={testWeight}
                  onNavigate={(vn) => navigate(`/experiments/${vn}`)}
                  onEditWeight={(vn) => setEditWeightVar(vn)}
                  onAddVersion={(payload) => setNewVersionExp(payload)}
                />
              ))
            )}
          </div>
        ),
      };
    });
  }, [layers, groupedTests, layerWeight, testWeight, targets, versions, navigate, filteredTests.length, hasFilter]);

  /* ==================== 表格视图 ==================== */
  const tableColumns = useMemo(() => {
    const cols = [
      {
        title: '实验名称',
        dataIndex: 'name',
        key: 'name',
        render: (name, row) => (
          <a onClick={() => navigate(`/experiments/${row.var_name}`)} style={{ fontWeight: 600 }}>
            {name}
          </a>
        ),
      },
      {
        title: '变量名',
        dataIndex: 'var_name',
        key: 'var_name',
        width: 180,
        render: (v) => (
          <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 12, color: 'var(--text-2)' }}>
            {v}
          </span>
        ),
      },
      {
        title: '流量层',
        dataIndex: 'layer',
        key: 'layer',
        width: 110,
        render: (v) => (
          <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 12, color: 'var(--text-2)' }}>
            {v}
          </span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status) => {
          const cfg = getStatusConfig(status);
          return (
            <span>
              <StatusBadge status={status} />
              <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{cfg.label}</span>
            </span>
          );
        },
      },
      {
        title: '流量层占比',
        key: 'layerWeight',
        width: 160,
        render: (_, row) => {
          const w = row.weight || 0;
          return <TrafficBar segments={[{ weight: w }]} height={18} />;
        },
      },
      {
        title: '版本数',
        key: 'versions',
        width: 90,
        align: 'center',
        render: (_, row) => {
          const tw = testWeight[row.var_name] || { weight: [] };
          return <span style={{ fontWeight: 600 }}>{tw.weight.length}</span>;
        },
      },
      {
        title: '指标数',
        key: 'targets',
        width: 90,
        align: 'center',
        render: (_, row) => targets.filter((t) => t.var_name === row.var_name).length,
      },
      {
        title: '操作',
        key: 'action',
        width: 140,
        render: (_, row) => (
          <Space onClick={(e) => e.stopPropagation()}>
            <Tooltip title="编辑版本流量">
              <Button
                size="small"
                icon={<PieChartOutlined />}
                onClick={() => setEditWeightVar(row.var_name)}
              />
            </Tooltip>
            <Tooltip title="新增版本">
              <Button
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() =>
                  setNewVersionExp({
                    var_name: row.var_name,
                    name: row.name,
                    weight: (testWeight[row.var_name] || { total: 0 }).total,
                  })
                }
              />
            </Tooltip>
          </Space>
        ),
      },
    ];
    return cols;
  }, [navigate, testWeight, targets]);

  const hasData = tests.length > 0 || layers.length > 0;

  return (
    <div className="page-container">
      {loading ? (
        <ExperimentsSkeleton />
      ) : !hasData ? (
        <EmptyState
          icon={<ExperimentOutlined />}
          title="暂无实验数据"
          description="创建你的第一个 A/B 测试实验，开始管理版本流量和追踪转化率"
          action={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openNewTest()}>
              创建第一个实验
            </Button>
          }
        />
      ) : (
          <>
            {/* ====== 工具栏 ====== */}
            <div className="toolbar">
              <div className="toolbar-left">
                <Input
                  allowClear
                  className="toolbar-search"
                  size="middle"
                  prefix={<SearchOutlined style={{ color: 'var(--text-3)' }} />}
                  placeholder="搜索实验名称或变量名"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Select
                  style={{ width: 130 }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUS_OPTIONS}
                />
                <Select
                  style={{ width: 150 }}
                  value={layerFilter}
                  onChange={setLayerFilter}
                  options={[
                    { label: '全部流量层', value: 'all' },
                    ...layers.map((l) => ({ label: l, value: l })),
                  ]}
                />
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
                  共 {filteredTests.length} 个实验
                </span>
              </div>

              <div className="toolbar-right">
                <Segmented
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'card', icon: <AppstoreOutlined />, label: '卡片' },
                    { value: 'table', icon: <UnorderedListOutlined />, label: '列表' },
                  ]}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openNewTest()}>
                  新建实验
                </Button>
              </div>
            </div>

            {/* ====== 主体内容 ====== */}
            {filteredTests.length === 0 ? (
              <EmptyState icon="🔍" title="没有符合筛选条件的实验" description="调整搜索关键词或状态筛选" />
            ) : view === 'card' ? (
              <Collapse
                defaultActiveKey={layers.length > 0 ? [layers[0]] : Object.keys(groupedTests)}
                items={collapseItems}
                className="layer-collapse"
              />
            ) : (
              <Table
                dataSource={filteredTests}
                rowKey="var_name"
                columns={tableColumns}
                pagination={false}
                size="middle"
              />
            )}
          </>
        )}

      <NewTestModal
        open={showNewTest}
        defaultLayer={defaultLayer}
        onClose={() => setShowNewTest(false)}
      />
      <EditWeightModal
        open={!!editWeightVar}
        varName={editWeightVar}
        onClose={() => setEditWeightVar(null)}
      />
      <NewVersionModal
        open={!!newVersionExp}
        experiment={newVersionExp}
        onClose={() => setNewVersionExp(null)}
      />
    </div>
  );
}

/* ============================================================
 * 实验卡片
 * ============================================================ */
function ExperimentCard({
  test, versions, targets, testWeight, onNavigate, onEditWeight, onAddVersion,
}) {
  const cfg = getStatusConfig(test.status);
  const tw = testWeight[test.var_name] || { weight: [], total: 0 };
  const testTargets = targets.filter((t) => t.var_name === test.var_name);

  return (
    <div className="exp-card" onClick={() => onNavigate(test.var_name)}>
      <div className="exp-card-header">
        <div className="exp-card-title">
          <span className="exp-card-name">{test.name}</span>
          <Tag color={cfg.color}>
            <span className={`status-dot is-${cfg.tone}`} style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}22`, marginRight: 4 }} />
            {cfg.label}
          </Tag>
        </div>
        <span className="exp-card-var">{test.var_name}</span>
      </div>

      <div className="exp-card-body">
        <div className="exp-card-row">
          <span className="exp-card-label">类型</span>
          <span>{test.var_type}</span>
          <span className="exp-card-label" style={{ marginLeft: 16 }}>默认值</span>
          <span>{test.default_value}</span>
          {test.condition ? (
            <>
              <span className="exp-card-label" style={{ marginLeft: 16 }}>条件</span>
              <span className="exp-card-condition">{test.condition}</span>
            </>
          ) : null}
        </div>

        <div className="exp-card-versions">
          <div className="exp-card-label">
            版本流量（{tw.weight.length} 个版本，已分配 {tw.total}%）
          </div>
          <div className="version-bars">
            {tw.weight.map(({ value, name, weight }) => {
              const ver = versions.find(
                (v) => v.var_name === test.var_name && v.value === value,
              );
              return (
                <Tooltip
                  key={value}
                  title={
                    (name === value ? `${value}` : `${name}(${value})`) +
                    `: ${weight}%` +
                    (ver ? `, pv: ${ver.pv || '-'}, uv: ${ver.uv || '-'}` : '')
                  }
                >
                  <div className="version-bar-item">
                    <div
                      className="version-bar-fill"
                      style={{ width: '100%', opacity: weight > 0 ? 1 : 0.35 }}
                    >
                      <span>{weight}%</span>
                    </div>
                    <span className="version-bar-label">
                      {name === value ? value : name}
                    </span>
                  </div>
                </Tooltip>
              );
            })}
            {tw.weight.length === 0 && (
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>暂未配置版本</span>
            )}
          </div>
        </div>

        {testTargets.length > 0 && (
          <div className="exp-card-targets">
            <span className="exp-card-label">指标</span>
            {testTargets.map(({ target_name, count, rate }) => (
              <Tag key={target_name} style={{ marginBottom: 4, borderRadius: 6 }}>
                {target_name}
                {count ? (rate ? ` (${rate}%)` : ` (${count})`) : ''}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className="exp-card-footer" onClick={(e) => e.stopPropagation()}>
        <Space>
          <Tooltip title="编辑版本流量">
            <Button
              size="small"
              icon={<PieChartOutlined />}
              onClick={() => onEditWeight(test.var_name)}
            />
          </Tooltip>
          <Tooltip title="新增版本">
            <Button
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() =>
                onAddVersion({
                  var_name: test.var_name,
                  name: test.name,
                  weight: tw.total,
                })
              }
            />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
}
