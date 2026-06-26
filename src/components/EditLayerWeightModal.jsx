/**
 * 编辑层流量弹窗 —— 使用 TrafficAllocator 组件
 */
import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { useApp } from '../store/AppContext';
import TrafficAllocator from './TrafficAllocator';

export default function EditLayerWeightModal({ open, layer, onClose }) {
  const { layerWeight, editLayerWeight } = useApp();
  const [weights, setWeights] = useState({});

  const lw = layer ? layerWeight[layer] || { weight: [], total: 0 } : { weight: [], total: 0 };

  useEffect(() => {
    if (open && layer) {
      const init = {};
      lw.weight.forEach(({ var_name, weight }) => {
        init[var_name] = weight;
      });
      setWeights(init);
    }
  }, [open, layer]); // eslint-disable-line

  const allocatorItems = lw.weight.map(({ var_name, name, weight }) => ({
    key: var_name,
    label: `${name}(${var_name})`,
    weight: weights[var_name] ?? weight,
  }));

  const handleOk = async () => {
    const total = Object.values(weights).reduce((s, i) => s + i, 0);
    if (total > 100) {
      message.error('总流量超出 100%');
      return;
    }

    const changes = lw.weight.filter(
      ({ var_name, weight }) => weights[var_name] !== undefined && weights[var_name] !== weight,
    );

    if (changes.length > 0) {
      await Promise.all(
        changes.map(({ var_name }) => editLayerWeight(layer, var_name, weights[var_name])),
      );
    }
    onClose();
  };

  return (
    <Modal
      title={`编辑 ${layer} 流量`}
      open={open}
      width={640}
      onCancel={onClose}
      onOk={handleOk}
      destroyOnHidden
      maskClosable={false}
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
