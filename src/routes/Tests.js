import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Layout, Menu, Breadcrumb, Table, Button, Progress, Radio, Input, Slider, Form, Modal, Select } from 'antd';
import { call } from 'redux-saga/effects';

const { Header, Content, Footer } = Layout;
const FormItem = Form.Item;
const Option = Select.Option;


const NewTestFrom = Form.create()(({ layers=[], visible, layerWeight={}, dispatch, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title="新增实验"
      visible={visible}
      key="NewTestFrom"
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {showNewTestFrom: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          //layer, layer_weight, var_name, test_name, var_type, default_value
          console.log(err, values)
          if (!err) {
            dispatch({ type: 'common/addTest', ...values })
          }
        })
      }}>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="流量层名称"
        >
          {getFieldDecorator('layer', {
            rules: [
              { required: true, message: '流量层名称' },
            ],
          })(
            <Select>
              {layers.map(layer => <Option key={layer}>{layer}</Option>)}
            </Select>
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="使用流量层流量"
        >
          {getFieldDecorator('layer_weight', {
            rules: [
              { validator: (rule, value, callback) => {
                const layer = form.getFieldValue('layer')
                const weight = layerWeight[layer]
                console.log(rule, value, form, layer)
                if (layer && weight) {
                  if (value <= 100 - weight.total) {
                    return callback()
                  } else {
                    return callback(`流量超出剩余: ${100 - weight.total}`)
                  }
                }else{
                  callback('请选择正确地流量层')
                }
                console.log(layer, weight)
              }},
            ],
          })(
            <Slider tooltipVisible />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="实验名称"
        >
          {getFieldDecorator('test_name', {
            rules: [
              { required: true, message: '实验名称' },
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="变量名称"
        >
          {getFieldDecorator('var_name', {
            rules: [
              { required: true, message: '变量名称' },
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="变量类型"
        >
          {getFieldDecorator('var_type', {
            rules: [
              { required: true, message: '变量名称' },
            ],
          })(
            <Radio.Group>
              <Radio value="number">数字</Radio>
              <Radio value="string">字符串</Radio>
            </Radio.Group>
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="变量默认值"
        >
          {getFieldDecorator('default_value', {
            rules: [
              { required: true, message: '变量默认值' },
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          wrapperCol={{ span: 4, offset: 20 }}
        >
          <Button type="primary" htmlType="submit">保存</Button>
        </FormItem>
      </Form>
    </Modal>
  )
})

class Tests extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  
  render() {
    const { tests=[], layers=[], layerWeight={}, testWeight={}, showNewTestFrom=false, dispatch } = this.props
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
          <NewTestFrom dispatch={dispatch} visible={showNewTestFrom} layers={layers} layerWeight={layerWeight} />
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
                  <Button style={{marginLeft: '20px'}} type="primary" onClick={e => {
                    dispatch({ type: 'common/save', payload: {showNewTestFrom: true}})
                  }}>新增实验</Button>
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

