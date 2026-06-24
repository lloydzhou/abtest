/**
 * 共享布局 —— 侧边栏 + 顶栏 + 内容区
 * 所有页面共用，替代之前每个页面各自渲染 Layout/Header/Menu
 *
 * 视觉风格：Indigo（紫蓝）主题，分组式侧边栏，悬浮状态圆点
 */
import React, { useState, useMemo } from 'react';
import { Layout, Menu, Breadcrumb, Button, Space, Tooltip, Dropdown, Avatar, theme, message } from 'antd';
import {
  ExperimentOutlined,
  BlockOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { removeAuth, getUsername } from '../utils/auth';
import { getStatusConfig } from '../constants';

const { Sider, Header, Content } = Layout;

// Hawkeye AB 自绘 SVG Logo
function AppLogo({ collapsed }) {
  return (
    <div
      style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '0 18px' : '0 20px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div className="app-logo-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L3 7v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V7l-9-5z"
            fill="rgba(255,255,255,0.22)"
          />
          <path
            d="M12 6.5L7 9.2v3.3c0 2.9 2.1 5.5 5 6.4 2.9-.9 5-3.5 5-6.4V9.2L12 6.5z"
            fill="white"
            fillOpacity="0.95"
          />
          <circle cx="12" cy="12.5" r="2" fill="#6366f1" />
        </svg>
      </div>
      {!collapsed && (
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.01em',
          }}
        >
          Hawkeye<span style={{ color: 'var(--brand)', marginLeft: 4 }}>AB</span>
        </span>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { refreshAll, loading, tests } = useApp();

  const handleRefresh = async () => {
    const minDelay = new Promise((r) => setTimeout(r, 600));
    await Promise.all([refreshAll(), minDelay]);
    message.success('数据已刷新', 1.5);
  };

  // 判断当前路由
  const isLayers = location.pathname.startsWith('/layers');
  const isDetail = location.pathname.startsWith('/experiments/');
  const selectedKey = isLayers ? 'layers' : 'experiments';

  // 详情页的 varName
  const varName = isDetail
    ? location.pathname.replace('/experiments/', '')
    : null;

  // 查找实验名称
  const currentTest = useMemo(
    () => (varName ? tests.find((t) => t.var_name === varName) : null),
    [varName, tests],
  );

  // 运行中实验计数，显示在菜单徽标
  const runningCount = useMemo(
    () => tests.filter((t) => t.status === 'running').length,
    [tests],
  );

  // 面包屑
  const breadcrumbItems = useMemo(() => {
    if (isLayers) {
      return [{ title: '流量层' }];
    }
    if (isDetail) {
      return [
        { title: <a onClick={() => navigate('/')}>实验管理</a> },
        { title: currentTest ? currentTest.name : varName },
      ];
    }
    return [{ title: '实验管理' }];
  }, [isLayers, isDetail, currentTest, varName, navigate]);

  const menuItems = [
    {
      key: 'group-workspace',
      label: '工作台',
      type: 'group',
      children: [
        {
          key: 'experiments',
          icon: <ExperimentOutlined />,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>实验管理</span>
              {runningCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--brand-hover)',
                    background: 'var(--brand-soft)',
                    padding: '0 7px',
                    borderRadius: 999,
                    lineHeight: '18px',
                  }}
                >
                  {runningCount}
                </span>
              )}
            </span>
          ),
        },
      ],
    },
    {
      key: groupKey('config'),
      label: '配置',
      type: 'group',
      children: [
        {
          key: 'layers',
          icon: <BlockOutlined />,
          label: '流量层',
        },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={232}
        collapsedWidth={72}
        style={{
          borderRight: '1px solid var(--border-light)',
          zIndex: 20,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <AppLogo collapsed={collapsed} />

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key === 'experiments' ? '/' : '/layers')}
          items={menuItems}
          style={{ borderInlineEnd: 'none', padding: '8px 0', background: 'transparent' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            minHeight: 60,
            height: 60,
          }}
        >
          {/* 左：折叠按钮 + 面包屑 */}
          <Space size="middle" align="center">
            <Button
              type="text"
              shape="circle"
              onClick={() => setCollapsed(!collapsed)}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            <Breadcrumb items={breadcrumbItems} />
          </Space>

          {/* 右：刷新按钮 */}
          <Space size="middle">
            <Tooltip title="刷新数据">
              <Button
                type="text"
                shape="circle"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={handleRefresh}
              />
            </Tooltip>
            <Dropdown trigger={['click']} menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    removeAuth();
                    window.location.reload();
                  },
                },
              ],
            }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" style={{ background: '#6366f1', fontSize: 13 }}>
                  {(getUsername() || '?').slice(0, 2).toUpperCase()}
                </Avatar>
                <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                  {getUsername()}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

// 菜单分组 key 辅助
function groupKey(name) {
  return `group-${name}`;
}
