/**
 * TrafficAllocator - 流量分配器
 *
 * 可视化分段拖拽条，用于层流量分配和版本流量分配。
 * 解决 0% 段 handle 重叠问题：奇偶 handle 交替分布在条的上下方。
 *
 * Props:
 *   items: [{ key, label, weight, color }]
 *   allowUnallocated: boolean  是否显示"未分配"灰色段
 *   onChange: (weights: { [key]: number }) => void
 */
import React, { useRef, useState, useEffect } from 'react';

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#4f46e5', '#7c3aed'];

export default function TrafficAllocator({
  items,
  allowUnallocated = true,
  onChange,
}) {
  const barRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  // 计算总流量和未分配
  const total = items.reduce((s, i) => s + (i.weight || 0), 0);
  const unallocated = Math.max(0, 100 - total);

  // 构建显示用的段列表（包含未分配段）
  const segments = items.map((it, i) => ({
    ...it,
    color: it.color || COLORS[i % COLORS.length],
  }));
  if (allowUnallocated && unallocated > 0) {
    segments.push({
      key: '__unallocated',
      label: '未分配',
      weight: unallocated,
      color: '#e2e8f0',
      unallocated: true,
    });
  } else if (allowUnallocated && unallocated === 0) {
    // 即使没有未分配，也加一个 0 宽度的段用于右边界 handle
    segments.push({
      key: '__unallocated',
      label: '未分配',
      weight: 0,
      color: '#e2e8f0',
      unallocated: true,
    });
  }

  // 计算每个段的起止百分比
  let cursor = 0;
  const segPositions = segments.map((seg) => {
    const start = cursor;
    cursor += seg.weight;
    return { ...seg, start, end: cursor };
  });

  // 拖拽逻辑
  const startDrag = (e, segIdx) => {
    // segIdx: 正在拖拽 segPositions[segIdx-1] 和 segPositions[segIdx] 之间的边界
    e.preventDefault();
    e.stopPropagation();
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();

    const onMove = (ev) => {
      const x = ev.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));

      // 当前边界位置
      const leftSeg = segPositions[segIdx - 1];
      const rightSeg = segPositions[segIdx];
      if (!leftSeg || !rightSeg) return;

      const oldPos = leftSeg.end;
      const delta = pct - oldPos;
      if (Math.abs(delta) < 0.1) return;

      // 构建新的权重数组（副本）
      const newItems = items.map((it) => ({ ...it }));

      // 找到对应的 items 索引（排除 unallocated）
      // segIdx 是 segments 数组的索引，需要映射回 items
      // segments[0..items.length-1] = items, segments[items.length] = unallocated
      const leftItemIdx = segIdx - 1;
      const rightItemIdx = segIdx;

      if (delta > 0) {
        // 向右拖：左边增大，右边减小
        const leftCanGrow = leftSeg.unallocated ? 0 : (100 - (newItems[leftItemIdx]?.weight || 0));
        const rightCanShrink = rightSeg.unallocated ? rightSeg.weight : (newItems[rightItemIdx]?.weight || 0);
        const actual = Math.min(delta, leftCanGrow, rightCanShrink);
        if (actual <= 0) return;

        if (!leftSeg.unallocated && newItems[leftItemIdx]) {
          newItems[leftItemIdx].weight = Math.round((newItems[leftItemIdx].weight + actual) * 10) / 10;
        }
        if (!rightSeg.unallocated && newItems[rightItemIdx]) {
          newItems[rightItemIdx].weight = Math.round((newItems[rightItemIdx].weight - actual) * 10) / 10;
        }
      } else {
        // 向左拖：左边减小，右边增大
        const leftCanShrink = leftSeg.unallocated ? 0 : (newItems[leftItemIdx]?.weight || 0);
        const rightCanGrow = rightSeg.unallocated ? 0 : (100 - (newItems[rightItemIdx]?.weight || 0));
        const actual = Math.min(-delta, leftCanShrink, rightCanGrow);
        if (actual <= 0) return;

        if (!leftSeg.unallocated && newItems[leftItemIdx]) {
          newItems[leftItemIdx].weight = Math.round((newItems[leftItemIdx].weight - actual) * 10) / 10;
        }
        if (!rightSeg.unallocated && newItems[rightItemIdx]) {
          newItems[rightItemIdx].weight = Math.round((newItems[rightItemIdx].weight + actual) * 10) / 10;
        }
      }

      const weights = {};
      newItems.forEach((it) => { weights[it.key] = it.weight; });
      onChange(weights);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setDragIndex(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    setDragIndex(segIdx);
  };

  // 可拖拽的边界（排除最左 0% 和最右 100%）
  const draggables = [];
  for (let i = 1; i < segPositions.length; i++) {
    const left = segPositions[i - 1];
    const right = segPositions[i];
    // 如果左右都是 unallocated，跳过
    if (left.unallocated && right.unallocated) continue;
    draggables.push({
      index: i,
      pos: right.start, // 百分比位置
      onTop: i % 2 === 1, // 奇数在上，偶数在下
      leftSeg: left,
      rightSeg: right,
    });
  }

  return (
    <div className="traffic-allocator">
      {/* 拖拽条 */}
      <div className="ta-bar-wrapper" ref={barRef}>
        {/* 分段条 */}
        <div className="ta-bar">
          {segPositions.map((seg) => {
            const width = seg.end - seg.start;
            if (width <= 0 && !seg.unallocated) return null;
            return (
              <div
                key={seg.key}
                className={`ta-segment ${seg.unallocated ? 'ta-segment-unallocated' : ''}`}
                style={{
                  width: `${width}%`,
                  background: seg.color,
                  minWidth: width > 0 ? undefined : 0,
                }}
                title={`${seg.label}: ${seg.weight}%`}
              >
                {width >= 8 && (
                  <span className="ta-segment-label">{seg.weight}%</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 拖拽 handle */}
        {draggables.map((d) => {
          const isLeftUnalloc = d.leftSeg.unallocated;
          const isRightUnalloc = d.rightSeg.unallocated;
          // 如果其中一段是 unallocated 且为 0 宽度，仍可拖
          return (
            <div
              key={d.index}
              className={`ta-handle ${d.onTop ? 'ta-handle-top' : 'ta-handle-bottom'} ${dragIndex === d.index ? 'ta-handle-active' : ''}`}
              style={{ left: `${d.pos}%` }}
              onMouseDown={(e) => startDrag(e, d.index)}
            >
              <div className="ta-handle-grip" />
              <div className="ta-handle-line" />
            </div>
          );
        })}
      </div>

      {/* 各段信息 */}
      <div className="ta-legend">
        {items.map((it, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={it.key} className="ta-legend-item">
              <span className="ta-legend-dot" style={{ background: color }} />
              <span className="ta-legend-label">{it.label}</span>
              <input
                type="number"
                className="ta-legend-input"
                min={0}
                max={100}
                value={it.weight}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  onChange({ ...items.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.weight }), {}), [it.key]: val });
                }}
              />
              <span className="ta-legend-percent">%</span>
            </div>
          );
        })}
        {allowUnallocated && (
          <div className="ta-legend-item ta-legend-unallocated">
            <span className="ta-legend-dot" style={{ background: '#e2e8f0' }} />
            <span className="ta-legend-label">未分配</span>
            <span className="ta-legend-value">{unallocated}%</span>
          </div>
        )}
        <div className="ta-legend-total">
          合计：<strong className={total > 100 ? 'ta-total-over' : ''}>{total}%</strong>
          {total < 100 && allowUnallocated && <span className="ta-total-remain">（剩余 {100 - total}%）</span>}
        </div>
      </div>
    </div>
  );
}
