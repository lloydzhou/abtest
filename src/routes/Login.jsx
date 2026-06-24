/**
 * 登录页
 * 使用 Basic Auth 验证，凭证存 localStorage
 */
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { setAuth } from '../utils/auth';
import request from '../utils/request';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    const { username, password } = values;

    // 先保存凭证，再发一个测试请求验证
    setAuth(username, password);
    const { err } = await request('/ab/layers');

    if (err) {
      message.error('用户名或密码错误');
      setLoading(false);
      return;
    }

    message.success('登录成功');
    onLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        width: 380,
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 16,
          }}>
            A
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1f2933' }}>
            Hawkeye AB
          </h1>
          <p style={{ margin: '8px 0 0', color: '#98a2b3', fontSize: 14 }}>
            A/B 测试管理平台
          </p>
        </div>

        <Form onFinish={handleSubmit} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#98a2b3' }} />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#98a2b3' }} />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
