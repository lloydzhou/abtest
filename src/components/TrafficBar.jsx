/**
 * TrafficBar - 流量分配迷你条
 * 展示各段占比 + 未分配斜纹段，用于表格、卡片等紧凑场景
 *
 * Props:
 *   segments: [{ label?, weight, color? }]  各段权重
 *   showLabel: boolean  是否在条上显示百分比
 *   height: number  条高度
 */
import React from 'react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function TrafficBar({ segments = [], height = 24, showLabel = false }) {
  const total = segments.reduce((s, seg) => s + (seg.weight || 0), 0);
  const unallocated = Math.max(0, 100 - total);

  return (
    <div className="traffic-bar" style={{ height }}>
      {segments.map((seg, i) => {
        if (!seg.weight) return null;
        return (
          <div
            key={i}
            className="traffic-bar-seg"
            style={{
              width: `${seg.weight}%`,
              background: seg.color || COLORS[i % COLORS.length],
            }}
            title={seg.label ? `${seg.label}: ${seg.weight}%` : `${seg.weight}%`}
          >
            {showLabel && seg.weight >= 8 && (
              <span className="traffic-bar-label">{seg.weight}%</span>
            )}
          </div>
        );
      })}
      {unallocated > 0 && (
        <div
          className="traffic-bar-seg traffic-bar-unallocated"
          style={{ width: `${unallocated}%` }}
          title={`未分配: ${unallocated}%`}
        >
          {showLabel && unallocated >= 8 && (
            <span className="traffic-bar-label traffic-bar-label-muted">{unallocated}%</span>
          )}
        </div>
      )}
    </div>
  );
}
