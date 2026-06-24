import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider } from '../store/AppContext';
import AppLayout from './AppLayout';
import Experiments from './Experiments';
import ExperimentDetail from './ExperimentDetail';
import Layers from './Layers';

function RouterConfig() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          colorPrimaryHover: '#4f46e5',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          colorLink: '#6366f1',
          colorBgLayout: '#f8fafc',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
          colorTextTertiary: '#94a3b8',
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          borderRadius: 10,
          fontSize: 14,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
        components: {
          Layout: {
            siderBg: '#ffffff',
            headerBg: '#ffffff',
            headerHeight: 60,
            bodyBg: '#f8fafc',
          },
          Menu: {
            itemSelectedBg: 'rgba(99,102,241,0.10)',
            itemSelectedColor: '#4f46e5',
            itemActiveBg: 'rgba(99,102,241,0.06)',
            itemBorderRadius: 8,
            itemMarginInline: 10,
            itemHeight: 40,
            iconSize: 16,
          },
          Card: {
            borderRadiusLG: 12,
            defaultBorderColor: '#f1f5f9',
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            headerSplitColor: 'transparent',
            rowHoverBg: '#f8fafc',
            borderColor: '#f1f5f9',
            cellPaddingBlock: 14,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            controlHeightSM: 30,
          },
          Modal: {
            borderRadiusLG: 14,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Tabs: {
            inkBarColor: '#6366f1',
            itemActiveColor: '#4f46e5',
            itemSelectedColor: '#4f46e5',
            horizontalItemPadding: '14px 0',
          },
          Tooltip: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AntdApp>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Experiments />} />
                <Route path="/experiments/:varName" element={<ExperimentDetail />} />
                <Route path="/layers" element={<Layers />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default RouterConfig;
