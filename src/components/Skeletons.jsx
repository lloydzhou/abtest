/**
 * 骨架屏组件
 * 用于页面加载时的占位，匹配最终布局形状
 */
import React from 'react';
import { Skeleton } from 'antd';

/** 实验列表骨架屏 */
export function ExperimentsSkeleton() {
  return (
    <div>
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: 12,
            marginBottom: 14,
            padding: '20px 20px 4px',
          }}
        >
          <Skeleton
            active
            title={{ width: '30%' }}
            paragraph={{ rows: 1, width: ['15%'] }}
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 14, paddingBottom: 16 }}>
            {[1, 2].map((j) => (
              <div key={j} style={{ background: '#f8fafc', borderRadius: 12, padding: 18 }}>
                <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 3, width: ['60%', '80%', '50%'] }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 详情页骨架屏 */
export function DetailSkeleton() {
  return (
    <div style={{ padding: '28px 32px 48px' }}>
      <Skeleton active title={{ width: '25%' }} paragraph={{ rows: 1, width: ['40%'] }} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 18 }}>
            <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 1, width: ['70%'] }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 24 }}>
        <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 4, width: ['100%', '100%', '80%', '60%'] }} />
      </div>
    </div>
  );
}

/** 表格骨架屏 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: 24 }}>
      <Skeleton active title={{ width: '100%' }} paragraph={{ rows, width: Array(rows).fill('100%') }} />
    </div>
  );
}
