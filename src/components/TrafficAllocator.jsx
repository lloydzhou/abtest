/**
 * TrafficAllocator - 流量分配器
 *
 * 基于 antd Slider，每个段的 max 动态计算为 100 - 其他段总和，
 * 天然防止总量超过 100%，无需额外约束逻辑。
 *
 * Props:
 *   items: [{ key, label, weight }]
 *   onChange: (weights: { [key]: number }) => void
 */
import React from 'react';
import { Slider } from 'antd';
import { chunk } from '../utils/chunk';

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4f46e5', '#7c3aed'];

export default function TrafficAllocator({ items, onChange }) {
  const weights = {};
  items.forEach((it) => { weights[it.key] = it.weight; });

  const total = items.reduce((s, it) => s + it.weight, 0);
  const unallocated = Math.max(0, 100 - total);

  const handleChange = (key, val) => {
    onChange({ ...weights, [key]: val });
  };

  return (
    <div className="traffic-allocator">
      {/* 总览条 */}
      <div className="ta-overview">
        <div className="ta-overview-bar">
          {items.map((it, i) => (
            <div
              key={it.key}
              className="ta-overview-seg"
              style={{
                width: `${it.weight}%`,
                background: COLORS[i % COLORS.length],
              }}
            />
          ))}
          {unallocated > 0 && (
            <div
              className="ta-overview-seg ta-overview-unallocated"
              style={{ width: `${unallocated}%` }}
            />
          )}
        </div>
        <div className="ta-overview-info">
          <span>合计 <strong>{total}%</strong></span>
          {unallocated > 0 && <span className="ta-overview-remain">未分配 {unallocated}%</span>}
        </div>
      </div>

      {/* 各段 slider */}
      <div className="ta-sliders">
        {items.map((it, i) => {
          // 关键：max = 100 - 其他所有段的总和
          const othersSum = total - it.weight;
          const maxForThis = 100 - othersSum;

          return (
            <div key={it.key} className="ta-slider-row">
              <div className="ta-slider-header">
                <span className="ta-slider-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="ta-slider-label">{it.label}</span>
                <span className="ta-slider-value">{it.weight}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                value={it.weight}
                onChange={(v) => handleChange(it.key, Math.min(v, maxForThis))}
                tooltip={{ formatter: (v) => `${v}%` }}
                style={{ margin: '0 2px' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
