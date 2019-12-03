import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Layout, Menu, Breadcrumb, Table, Button, Progress } from 'antd';

const { Header, Content, Footer } = Layout;

class Tests extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  
  render() {
    const { tests=[], layers=[], testWeight={} } = this.props
    return (
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['tests']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="layers"><Link to="/layers">流量</Link></Menu.Item>
            <Menu.Item key="tests">实验</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>实验</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ background: '#fff', padding: 24, minHeight: 600 }}>
            <Table dataSource={tests} rowKey={row => row.var_name} columns={[
              {
                title: '流量层',
                dataIndex: 'layer',
                key: 'layer',
              },
              {
                title: '测试名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '变量名称',
                dataIndex: 'var_name',
                key: 'var_name',
              },
              {
                title: '变量类型',
                dataIndex: 'var_type',
                key: 'var_type',
              },
              {
                title: '默认值',
                dataIndex: 'default_value',
                key: 'default_value',
              },
              {
                title: '已分配流量',
                dataIndex: 'var_name',
                key: 'weight',
                render(var_name) {
                  const percent = testWeight[var_name] ? testWeight[var_name].total : 0
                  return <Progress percent={percent} />
                }
              },
              {
                title: (<div>状态
                  <Button style={{marginLeft: '20px'}} type="primary">新增实验</Button>
                </div>),
                dataIndex: 'status',
                key: 'status',
                render(status) {
                  return <div>
                    {status}
                    <br />
                    <Button.Group>
                      <Button>编辑</Button>
                      {status === 'init' ? <Button type="primary">启动</Button> : null}
                      {status === 'running' ? <Button type="danger">停止</Button> : null}
                      {status === 'stoped' ? <Button type="danger">删除</Button> : null}
                    </Button.Group>
                  </div>
                }
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

