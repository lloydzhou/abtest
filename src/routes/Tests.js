import React, { Component } from 'react';
import { connect } from 'dva';
import { Layout, Menu, Breadcrumb, Table } from 'antd';

const { Header, Content, Footer } = Layout;

class Tests extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  
  render() {
    const { tests=[], layers=[] } = this.props
    return (
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="1">首页</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Test</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
            <Table dataSource={tests} columns={[
              {
                title: '测试名称',
                dataIndex: 'name',
                key: 'name',
              },              
            ]} pagination={false} />;
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>quzhaopinapp.com ©2019</Footer>
      </Layout>
    )
  }
}

Tests.propTypes = {
};

export default connect(({ common }) => {
  return {
    ...common,
  }
})(Tests);

