import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  Layout, Menu, Breadcrumb, Table, Button, Progress, Radio, Input, Slider,
  Form, Modal, Select, message, Icon, Dropdown, Tooltip,
} from 'antd';
import { editTestWeight } from '../services/common';

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
        dispatch({ type: 'common/save', payload: {showNewTestForm: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          //layer, layer_weight, var_name, test_name, var_type, default_value
          // console.log(err, values)
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
                const weight = layerWeight[layer] || {total: 0}
                // console.log(rule, value, form, layer)
                if (layer) {
                  if (value <= 100 - weight.total) {
                    return callback()
                  } else {
                    return callback(`流量超出剩余: ${100 - weight.total}`)
                  }
                }else{
                  callback('请选择正确地流量层')
                }
                // console.log(layer, weight)
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


const TestWeightFrom = ({ editTest, dispatch, testWeight={} }) => {
  const { weight: weights = []} = testWeight
  return (
    <Modal
      title="编辑实验流量"
      visible={!!editTest}
      key={editTest && editTest._var_name || 'TestWeightFrom'}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {editTest: null } })
      }}
      onOk={e => {
        const total = weights.map(({ value, weight}) => editTest[value] ? editTest[value] : weight).reduce((s, i) => s + i)
        if (total > 100) {
          message.error("总流量超出")
        } else {
          const changes = weights.filter(({ value, weight}) => editTest[value] && weight !== editTest[value])
          if (changes.length) {
            Promise.all(changes.map(({ value, name }) => editTestWeight(
              editTest._var_name, value, editTest[value], name,
            ))).then(res => {
              // console.log(res)
              dispatch({ type: 'common/getVersions' })
              dispatch({ type: 'common/save', payload: {editTest: null } })
            })
          }else{
            dispatch({ type: 'common/save', payload: {editTest: null } })
          } 
        }
      }}
    >
      {weights.map(({value, name, weight}) => {
        return <Slider style={{marginBottom: 50}} key={value} defaultValue={weight} onChange={(e) => {
          // console.log(e, value, weight, total)
          editTest[value] = e
          dispatch({ type: 'save', payload: {editTest: {...editTest}}})
          // return false
        }} tooltipVisible tipFormatter={(v) => `${name}(${value}): ${v}`} />
      })}
    </Modal>
  )
}

const NewTargetFrom = Form.create()(({ newTargetVarName, dispatch, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title={`给${newTargetVarName}新增指标`}
      visible={!!newTargetVarName}
      key={newTargetVarName}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {newTargetVarName: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          if (!err) {
            dispatch({ type: 'common/addTarget', var_name: newTargetVarName, target: values.target })
          }
        })

      }}>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="指标名称"
        >
          {getFieldDecorator('target', {
            rules: [
              { required: true, message: '指标名称' },
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

const NewVersionFrom = Form.create()(({ newVersion, dispatch, testWeight, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title={`给${newVersion ? newVersion.name : ''}新增指标`}
      visible={!!newVersion}
      key={newVersion && newVersion.var_name || 'NewVersionFrom'}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {newVersion: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          if (!err) {
            const {value, weight, name=''} = values
            dispatch({
              type: 'common/editTestWeight', var_name: newVersion.var_name,
              value, weight, name: name || value,
            })
          }
        })

      }}>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="变量取值（版本）"
        >
          {getFieldDecorator('value', {
            rules: [
              { required: true, message: '变量取值' },
              { validator: (rule, value, callback) => {
                const weights = testWeight[newVersion.var_name] ? testWeight[newVersion.var_name].weight : []
                if (weights.map(({value}) => value).indexOf(value) > -1) {
                  return callback('变量取值重复')
                }
                callback()
              }}
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="使用实验流量"
        >
          {getFieldDecorator('weight', {
            rules: [
              { validator: (rule, value, callback) => {
                const weight = newVersion.weight
                if (value <= 100 - weight) {
                  return callback()
                } else {
                  return callback(`流量超出剩余: ${100 - weight}`)
                }
              }},
            ],
          })(
            <Slider tooltipVisible />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="版本名称"
        >
          {getFieldDecorator('name', {
            rules: [],
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

const TestRateInfo = ({ showTestRate, rateTargets, rateVersions, dispatch }) => {
  const columns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '实验PV',
      dataIndex: 'pv',
      key: 'pv',
    },
    {
      title: '实验UV',
      dataIndex: 'uv',
      key: 'uv',
    },
  ]
  for (const target of rateTargets) {
    columns.push({
      title: target,
      dataIndex: target,
      key: target,
      render(value, row) {
        const { count, user } = value
        const { pv, uv } = row
        return `count: ${count}, user: ${user}, pv: ${pv}, uv: ${uv}`
      }
    })
  }
  const dataSource = rateVersions.chunk(rateTargets.length * 2 + 5).map(item => {
    // eslint-disable-next-line
    const [value, var_name, name, pv, uv] = item
    const res = {
      version: name,
      pv: parseFloat(pv) || 0,
      uv: parseFloat(uv) || 0,
    } 
    for (let index = 0; index < rateTargets.length; index++) {
      res[rateTargets[index]] = {
        count: parseFloat(item[5 + index * 2]) || 0,
        user: parseFloat(item[1 + 5 + index * 2]) || 0,
      }
    }
    return res
  })
  return (
    <Modal
      title={`${showTestRate ? showTestRate.name : '-'}转化率`}
      visible={!!showTestRate}
      key={showTestRate && showTestRate.name || 'TestRateInfo'}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {showTestRate: false } })
      }}
      footer={<Button onClick={e => {
        dispatch({ type: 'common/save', payload: {showTestRate: false } })
      }}>关闭</Button>}
    >
      <Table dataSource={dataSource} rowKey={row => row.version} columns={columns} pagination={false} />
    </Modal>
  )
}

class Tests extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  testAction(var_name, action, title) {
    const { dispatch } = this.props
    Modal.confirm({
      title: title || '确定更新状态',
      content: `确定将实验状态更新为：${action}`,
      onOk() {
        dispatch({ type: 'common/testAction', var_name, action })
      }
    })
  }
  
  render() {
    const {
      tests=[], layers=[], versions=[], layerWeight={}, testWeight={},
      newTargetVarName, newVersion, env,
      showTestRate, rateTargets=[], rateVersions=[],
      showNewTestForm=false, editTest, targets=[], dispatch
    } = this.props
    const testAction = this.testAction.bind(this)
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
            <Breadcrumb.Item>
              <Dropdown overlay={<Menu onClick={({key}) => {
                dispatch({ type: 'common/changeEnv', env: key })
              }}>
                <Menu.Item key="dev">
                  测试环境
                </Menu.Item>
                <Menu.Item key="production">
                  正式环境
                </Menu.Item>
              </Menu>}>
                <span className="ant-dropdown-link">
                  {env === 'production' ? '正式环境' : '测试环境'}<Icon type="down" />
                </span>
              </Dropdown>
            </Breadcrumb.Item>
            <Breadcrumb.Item>实验</Breadcrumb.Item>
          </Breadcrumb>
          <NewTestFrom dispatch={dispatch} visible={showNewTestForm} layers={layers} layerWeight={layerWeight} />
          <TestWeightFrom editTest={editTest} dispatch={dispatch} testWeight={testWeight[editTest && editTest._var_name]}/>
          <NewTargetFrom newTargetVarName={newTargetVarName} dispatch={dispatch} />
          <NewVersionFrom newVersion={newVersion} testWeight={testWeight} dispatch={dispatch} />
          <TestRateInfo showTestRate={showTestRate} rateTargets={rateTargets} rateVersions={rateVersions} dispatch={dispatch} />
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
              // {
              //   title: '默认值',
              //   dataIndex: 'default_value',
              //   key: 'default_value',
              // },
              {
                title: '流量',
                dataIndex: 'var_name',
                key: 'weight',
                render(var_name, row) {
                  const weights = testWeight[var_name] ? testWeight[var_name].weight : []
                  const percent = testWeight[var_name] ? testWeight[var_name].total : 0
                  return <div>
                    <div>
                    共{weights.length}个版本已分配流量{percent}:
                    <Button.Group style={{float: 'right'}}>
                      <Button type="primary" size="small" icon="edit" onClick={e => {
                        dispatch({ type: 'common/save', payload: { editTest: {_var_name: row.var_name} }})
                      }} title="编辑版本流量"/>
                      <Button type="primary" size="small" icon="plus-circle" title="添加版本" onClick={e => {
                        dispatch({
                          type: 'common/save',
                          payload: {
                            newVersion: {
                              var_name: row.var_name,
                              name: row.name,
                              weight: testWeight[var_name] ? testWeight[var_name].total : 0
                            }
                          }
                        })
                      }}/>
                    </Button.Group>
                    </div>
                    <Progress percent={percent} />
                    <div>各版本流量分配情况：</div>
                    {weights.map(({value, name, weight}) => {
                      const current_version = versions.find(i => i.var_name === row.var_name && i.value === value)
                      return <Tooltip title={
                        (name === value ? `${value}: ${weight}%` : `${name}(${value}): ${weight}%`) +
                        (current_version ? `, pv: ${current_version.pv || '-'}, uv: ${current_version.uv || '-'}` : '')
                      } key={value}>
                        <Progress percent={weight} />
                      </Tooltip>
                    })}
                  </div>
                }
              },
              {
                title: '指标',
                dataIndex: 'var_name',
                key: 'target',
                render(var_name, row) {
                  const target = targets.filter(t => t.var_name === var_name)
                  return <div>
                    <div>共{target.length}个指标:
                      <Button type="primary" size="small" icon="plus-circle" title="添加指标" style={{marginLeft: 30}} onClick={e => {
                        dispatch({ type: 'common/save', payload: { newTargetVarName: row.var_name }})
                      }}/>
                    </div>
                    {target.map(({target_name, count, rate}) => {
                      return <div key={target_name}>
                        {target_name}
                        {count ? rate ? ` (${count}: ${rate}%)` : ` (${count})`: ' -'}
                      </div>
                    })}
                  </div>
                }
              },
              {
                title: (<div>状态
                  <Button style={{marginLeft: '20px'}} type="primary" onClick={e => {
                    dispatch({ type: 'common/save', payload: {showNewTestForm: true}})
                  }}>新增实验</Button>
                </div>),
                dataIndex: 'status',
                key: 'status',
                render(status, row) {
                  return <div>
                    {status}
                    <br />  
                    <Button.Group>
                      {status === 'init' || status === 'deleted' ? <Button onClick={e => testAction(row.var_name, 'running', '启动实验')} type="primary">启动</Button> : null}
                      {status === 'running' ? <Button onClick={e => testAction(row.var_name, 'stoped', '停止实验')} type="danger">停止</Button> : null}
                      {status === 'stoped' ? <Button onClick={e => testAction(row.var_name, 'deleted', '删除实验')} type="danger">删除</Button> : null}
                      <Button type="primary" icon="exclamation-circle" onClick={e => {
                        dispatch({ type: 'common/getTestRate', var_name: row.var_name, name: row.name })
                      }}/>
                    </Button.Group>
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

Tests.propTypes = {
};

export default connect(({ common }) => {
  return {
    ...common,
  }
})(Tests);

