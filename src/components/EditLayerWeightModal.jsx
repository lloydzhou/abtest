/**
 * 编辑层流量弹窗
 */
import React, { useState, useEffect } from 'react';
import { Modal, Slider, message } from 'antd';
import { useApp } from '../store/AppContext';

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
      width={600}
      onCancel={onClose}
      onOk={handleOk}
      destroyOnHidden
    >
      {lw.weight.map(({ var_name, name, weight }) => (
        <div key={var_name} style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 8, color: '#667085', fontSize: 13 }}>
            {name}({var_name})：{weights[var_name] ?? weight}%
          </div>
          <Slider
            min={0}
            max={100}
            defaultValue={weight}
            onChange={(v) => setWeights((prev) => ({ ...prev, [var_name]: v }))}
            tooltip={{ open: true, formatter: (v) => `${v}%`, getPopupContainer: (n) => n.parentElement }}
          />
        </div>
      ))}
    </Modal>
  );
}
