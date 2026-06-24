/**
 * 流量层管理页
 * 表格展示所有流量层、流量分配、实验数
 */
import React, { useState, useMemo } from 'react';
import { Button, Table, Progress, Space, Tooltip } from 'antd';
import { PlusOutlined, PieChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import NewLayerModal from '../components/NewLayerModal';
import EditLayerWeightModal from '../components/EditLayerWeightModal';

export default function Layers() {
  const navigate = useNavigate();
  const { layers, layerWeight, tests, loading } = useApp();
  const [showNewLayer, setShowNewLayer] = useState(false);
  const [editLayer, setEditLayer] = useState(null);

  const dataSource = useMemo(() => layers.map((layer) => {
    const lw = layerWeight[layer] || { total: 0, weight: [] };
    const layerTests = tests.filter((t) => t.layer === layer);
    return {
      key: layer,
      name: layer,
      weight: lw.total,
      var_count: lw.weight.length,
      test_count: layerTests.length,
      running_count: layerTests.filter((t) => t.status === 'running').length,
    };
  }), [layers, layerWeight, tests]);

  const columns = [
    {
      title: '流量层',
      dataIndex: 'name',
      key: 'name',
      render: (v) => (
        <span style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontWeight: 600 }}>
          {v}
        </span>
      ),
    },
    {
      title: '已分配流量',
      dataIndex: 'weight',
      key: 'weight',
      width: 240,
      render: (v) => (
        <Progress
          percent={v}
          size="small"
          status={v >= 100 ? 'exception' : 'normal'}
          format={(p) => `${p}%`}
        />
      ),
    },
    {
      title: '实验数',
      key: 'test_count',
      width: 120,
      align: 'center',
      render: (_, row) => (
        <Space>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.test_count}</span>
          {row.running_count > 0 && (
            <span style={{ fontSize: 12, color: 'var(--success)' }}>
              · {row.running_count} 运行
            </span>
          )}
        </Space>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>操作</span>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setShowNewLayer(true)}>
            新增流量层
          </Button>
        </div>
      ),
      key: 'action',
      width: 160,
      render: (_, row) => (
        <Space>
          <Tooltip title="编辑该层的实验流量分配">
            <Button
              size="small"
              icon={<PieChartOutlined />}
              disabled={row.var_count === 0}
              onClick={() => setEditLayer(row.name)}
            >
              编辑流量
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 16px' }}>
        流量层之间互不干扰，同一用户在不同层可被分配到不同实验版本
      </p>

      <Table
        dataSource={dataSource}
        rowKey="name"
        loading={loading}
        pagination={false}
        columns={columns}
        size="middle"
      />

      <NewLayerModal open={showNewLayer} onClose={() => setShowNewLayer(false)} />
      <EditLayerWeightModal
        open={!!editLayer}
        layer={editLayer}
        onClose={() => setEditLayer(null)}
      />
    </div>
  );
}
