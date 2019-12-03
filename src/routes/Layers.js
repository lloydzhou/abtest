import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Layout, Menu, Breadcrumb, Table, Button, Slider, Progress } from 'antd';

const { Header, Content, Footer } = Layout;

class Layers extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  
  render() {
    const { tests=[], layers=[], layerWeight={} } = this.props
    const dataSource = layers.map(layer => {
      return {
        name: layer,
        weight: layerWeight[layer] ? layerWeight[layer].total : 0,
      }
    })
    return (
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['layers']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="layers">流量层</Menu.Item>
            <Menu.Item key="tests"><Link to="/tests">实验</Link></Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>流量层</Breadcrumb.Item>
          </Breadcrumb>
          <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
            <Table dataSource={dataSource} columns={[
              {
                title: '流量层名称',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '已分配流量',
                dataIndex: 'weight',
                key: 'weight',
                render(value) {
                  return <Progress percent={value} />
                }
              },
              {
                title: (<div>操作
                  <Button style={{marginLeft: '20px'}} type="primary">新增流量层</Button>
                </div>),
                dataIndex: 'status',
                key: 'status',
                render(status) {
                  return <div>
                    {status}
                    <br />
                    <Button.Group>
                      <Button>编辑</Button>
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

Layers.propTypes = {
};

export default connect(({ common }) => {
  return {
    ...common,
  }
})(Layers);

