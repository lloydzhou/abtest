/**
 * 自定义空状态
 * 替代 antd 默认 <Empty>，带图标 + 说明 + 操作引导
 */
import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'rgba(99, 102, 241, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        color: '#6366f1',
        fontSize: 28,
      }}>
        {icon || '📭'}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
