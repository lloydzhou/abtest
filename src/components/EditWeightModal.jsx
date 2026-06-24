/**
 * 编辑版本流量弹窗
 */
import React, { useState, useEffect } from 'react';
import { Modal, Slider, message } from 'antd';
import { useApp } from '../store/AppContext';

export default function EditWeightModal({ open, varName, onClose }) {
  const { testWeight, editVersionWeight } = useApp();
  const [weights, setWeights] = useState({});

  const tw = testWeight[varName] || { weight: [], total: 0 };
  const versionWeights = tw.weight;

  // 弹窗打开时初始化
  useEffect(() => {
    if (open && varName) {
      const init = {};
      versionWeights.forEach(({ value, weight }) => {
        init[value] = weight;
      });
      setWeights(init);
    }
  }, [open, varName]); // eslint-disable-line

  const handleOk = async () => {
    const total = Object.values(weights).reduce((s, i) => s + i, 0);
    if (total > 100) {
      message.error('总流量超出 100%');
      return;
    }

    const changes = versionWeights.filter(
      ({ value, weight }) => weights[value] !== undefined && weights[value] !== weight,
    );

    if (changes.length === 0) {
      onClose();
      return;
    }

    await Promise.all(
      changes.map(({ value, name }) =>
        editVersionWeight(varName, value, weights[value], name),
      ),
    );
    onClose();
  };

  return (
    <Modal
      title="编辑版本流量"
      open={open}
      width={600}
      onCancel={onClose}
      onOk={handleOk}
      destroyOnHidden
    >
      {versionWeights.map(({ value, name, weight }) => (
        <div key={value} style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 8, color: '#667085', fontSize: 13 }}>
            {name === value ? name : `${name}(${value})`}：{weights[value] ?? weight}%
          </div>
          <Slider
            min={0}
            max={100}
            defaultValue={weight}
            onChange={(v) => setWeights((prev) => ({ ...prev, [value]: v }))}
            tooltip={{ open: true, formatter: (v) => `${v}%`, getPopupContainer: (n) => n.parentElement }}
          />
        </div>
      ))}
    </Modal>
  );
}
