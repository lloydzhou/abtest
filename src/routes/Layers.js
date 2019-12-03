import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Layout, Menu, Breadcrumb, Table, Button, Slider, Progress, Form, Modal, Input, message } from 'antd';
import { editLayerWeight } from '../services/common';

const { Header, Content, Footer } = Layout;
const FormItem = Form.Item


const NewLayerFrom = Form.create()(({ visible, dispatch, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title="新增流量层"
      visible={visible}
      key="NewLayerFrom"
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {showNewLayerForm: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          if (!err) {
            dispatch({ type: 'common/addLayer', layer: values.layer })
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

const LayerWeightFrom = ({ editLayer, dispatch, layerWeight={} }) => {
  const { weight: weights = [], total=0} = layerWeight
  return (
    <Modal
      title="编辑层流量"
      visible={!!editLayer}
      key={editLayer && editLayer.layer || 'LayerWeightFrom'}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {editLayer: null } })
      }}
      onOk={e => {        
        const total = weights.map(({ var_name, weight}) => editLayer[var_name] ? editLayer[var_name] : weight).reduce((s, i) => s + i)
        if (total > 100) {
          message.error("总流量超出")
        } else {
          const changes = weights.filter(({ var_name, weight}) => editLayer[var_name] && weight != editLayer[var_name])
          if (changes.length) {
            Promise.all(changes.map(({ var_name }) => editLayerWeight(editLayer.layer, var_name, editLayer[var_name]))).then(res => {
              console.log(res)
              dispatch({ type: 'common/getLayerWeight', layer: editLayer.layer })
              dispatch({ type: 'common/save', payload: {editLayer: null } })
            })
          } else {
            dispatch({ type: 'common/save', payload: {editLayer: null } })
          }      
        }
      }}
    >
      {weights.map(({var_name, weight}) => {
        return <Slider key={var_name} defaultValue={weight} onChange={(e) => {
          // console.log(e, var_name, weight, total)
          editLayer[var_name] = e
          dispatch({ type: 'save', payload: {editLayer: {...editLayer}}})
          // return false
        }} tooltipVisible tipFormatter={(value) => `${var_name}: ${value}`} />
      })}
    </Modal>
  )
}

class Layers extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }
  
  render() {
    const { tests=[], layers=[], layerWeight={}, showNewLayerForm=false, editLayer, dispatch } = this.props
    const dataSource = layers.map(layer => {
      return {
        name: layer,
        weight: layerWeight[layer] ? layerWeight[layer].total : 0,
        var_count: layerWeight[layer] ? layerWeight[layer].weight.length : 0,
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
          <NewLayerFrom visible={showNewLayerForm} dispatch={dispatch} />
          <LayerWeightFrom editLayer={editLayer} dispatch={dispatch} layerWeight={layerWeight[editLayer && editLayer.layer]}/>
          <div style={{ background: '#fff', padding: 24, minHeight: 600 }}>
            <Table dataSource={dataSource} rowKey={row => row.name} columns={[
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
                  <Button style={{marginLeft: '20px'}} type="primary" onClick={e => {
                    dispatch({ type: 'common/save', payload: {showNewLayerForm: true} })
                  }}>新增流量层</Button>
                </div>),
                dataIndex: 'name',
                key: 'action',
                render(layer, row) {
                  return <div>
                    <Link to="/tests">添加实验</Link>
                    {row.var_count
                    ? <Button style={{marginLeft: '20px'}} onClick={e => {
                      dispatch({ type: 'common/save', payload: { editLayer: {layer} }})
                    }}>编辑</Button>
                    : null }
                  </div>
                }
              },
            ]} pagination={false} />
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

