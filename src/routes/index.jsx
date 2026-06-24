import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider } from '../store/AppContext';
import { isLoggedIn } from '../utils/auth';
import Login from './Login';
import AppLayout from './AppLayout';
import Experiments from './Experiments';
import ExperimentDetail from './ExperimentDetail';
import Layers from './Layers';

/** 路由守卫：未登录跳转到登录页 */
function RequireAuth({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RouterConfig() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  if (!loggedIn) {
    return (
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <Login onLogin={() => setLoggedIn(true)} />
              } />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
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
