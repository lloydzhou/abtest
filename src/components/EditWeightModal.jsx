/**
 * 编辑版本流量弹窗 —— 使用 TrafficAllocator 组件
 */
import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { useApp } from '../store/AppContext';
import TrafficAllocator from './TrafficAllocator';

export default function EditWeightModal({ open, varName, onClose }) {
  const { testWeight, editVersionWeight } = useApp();
  const [weights, setWeights] = useState({});

  const tw = testWeight[varName] || { weight: [], total: 0 };
  const versionWeights = tw.weight;

  useEffect(() => {
    if (open && varName) {
      const init = {};
      versionWeights.forEach(({ value, weight }) => {
        init[value] = weight;
      });
      setWeights(init);
    }
  }, [open, varName]); // eslint-disable-line

  // 构建分配器 items
  const allocatorItems = versionWeights.map(({ value, name, weight }) => ({
    key: value,
    label: name === value ? value : `${name}(${value})`,
    weight: weights[value] ?? weight,
  }));

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
      width={640}
      onCancel={onClose}
      onOk={handleOk}
      destroyOnHidden
    >
      {allocatorItems.length > 0 && (
        <TrafficAllocator
          items={allocatorItems}
          onChange={(newWeights) => setWeights(newWeights)}
        />
      )}
    </Modal>
  );
}
