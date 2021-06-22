import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  Layout, Menu, Breadcrumb, Table, Button, Progress, Radio, Input, Slider,
  Form, Modal, Select, message, Icon, Dropdown, Tooltip,
} from 'antd';
import { editTestWeight } from '../services/common';
import { getZPercent, ZScore, realMeanStd } from '../utils/utils';
import {
   Chart,
   Geom,
   Tooltip as BTooltip,
   Axis,
   Legend,
 } from "bizcharts";
import ConditionBuilder from '../components/ConditionBuilder'


const { Header, Content, Footer } = Layout;
const FormItem = Form.Item;
const Option = Select.Option;


const NewTestFrom = Form.create()(({ attributes=[], layers=[], visible, layerWeight={}, dispatch, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title="新增实验"
      visible={visible}
      key="NewTestFrom"
      width={700}
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
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="属性"
        >
          {getFieldDecorator('condition', {
            rules: [
              { required: false, message: '变量默认值' },
            ],
          })(
            <ConditionBuilder attributes={attributes} />
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
        const total = weights.map(({ value, weight}) => editTest[value] !== undefined ? editTest[value] : weight).reduce((s, i) => s + i)
        if (total > 100) {
          message.error("总流量超出")
        } else {
          const changes = weights.filter(({ value, weight}) => editTest[value] !== undefined && weight !== editTest[value])
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
      title={`给${newVersion ? newVersion.name : ''}新增版本`}
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
      render(version, row) {
        return `${version}(${row.weight}%)`
      }
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
      title: (<Tooltip title={<div>转化率：转化人数／实验UV <br /> 转化人数：累计指标触发人数<br />总值：累计上报指标数<br />均值：指标总值／实验UV</div>}>
        {target}<Icon type="exclamation-circle" />
      </Tooltip>),
      dataIndex: target,
      key: target,
      width: 200,
      render(value, row) {
        const defaultValue = dataSource.find(item => item.value === showTestRate.default_value)
        console.log(showTestRate, defaultValue)
        const { user: duser, mean: dmean, std: dstd } = (defaultValue || {})[target] || {}
        const { count, user, min:tmin, max:tmax, mean:tmean, std:tstd } = value
        const { pv, uv, min, max, mean, std } = row
        console.log(`count: ${count}, user: ${user}, pv: ${pv}, uv: ${uv}`)
        console.log(`user min: ${min}, max: ${max}, mean: ${mean}, std: ${std}`)
        console.log(`target min: ${tmin}, max: ${tmax}, mean: ${tmean}, std: ${tstd}`)
        const [drealmean, drealstd, drealcount] = realMeanStd(dmean, dstd, duser, defaultValue.uv)
        const [trealmean, trealstd, trealcount] = realMeanStd(tmean, tstd, user, uv)
        console.log(target, trealmean, trealstd, trealcount, drealmean, drealstd, drealcount)
        // const zscore = ZScore(tmean, tstd, user||0, dmean, dstd, duser||1)
        const zscore = ZScore(trealmean, trealstd, trealcount, drealmean, drealstd, drealcount)
        // http://www.statskingdom.com/120MeanNormal2.html
        const pvalue = 2 * getZPercent(-Math.abs(zscore))
        console.log(`pvalue: ${pvalue}, zscore: ${zscore}, tmean: ${tmean}, tstd: ${tstd}, tuser: ${user}, dmean: ${dmean}, dstd: ${dstd}, duser: ${duser}`)
        return <div>
          <div>转化率：{(user/(uv||1) * 100).toFixed(2)}%</div>
          <div>转化人数：{user}</div>
          <div>总值：{count}</div>
          <div>均值：{trealmean.toFixed(2)}</div>
          <div>标准差：{(trealstd).toFixed(3)}</div>
          {row.value !== showTestRate.default_value ? <div>ZScore：{isNaN(zscore) ? '-' : zscore.toFixed(3)}</div> : null}
          {row.value !== showTestRate.default_value ? <div>p-value：{isNaN(pvalue) ? '-' : pvalue.toFixed(3)}</div> : null}
        </div>
      }
    })
  }
  const preIndex = 10
  const dataSource = rateVersions.chunk(rateTargets.length * 6 + preIndex).map(item => {
    // eslint-disable-next-line
    const [value, var_name, weight, name, pv, uv, min, max, mean, std] = item
    const res = {
      value, var_name,
      version: name,
      weight: parseFloat(weight),
      pv: parseFloat(pv) || 0,
      uv: parseFloat(uv) || 0,
      min: parseFloat(min) || 0,
      max: parseFloat(max) || 0,
      mean: parseFloat(mean) || 0,
      std: parseFloat(std) || 0,
    } 
    for (let index = 0; index < rateTargets.length; index++) {
      res[rateTargets[index]] = {
        count: parseFloat(item[preIndex + index * 6]) || 0,
        user:  parseFloat(item[1 + preIndex + index * 6]) || 0,
        min:   parseFloat(item[2 + preIndex + index * 6]) || 0,
        max:   parseFloat(item[3 + preIndex + index * 6]) || 0,
        mean:  parseFloat(item[4 + preIndex + index * 6]) || 0,
        std:   parseFloat(item[5 + preIndex + index * 6]) || 0,
      }
    }
    return res
  }).sort((a,b) => a.value === showTestRate.default_value ? -1 : 1)
  const width = 300 + rateTargets.length * 200
  return (
    <Modal
      title={`${showTestRate ? showTestRate.name : '-'}转化率`}
      visible={!!showTestRate}
      key={showTestRate && showTestRate.name || 'TestRateInfo'}
      width={width}
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


const TestTrafficInfo = ({ versions=[], showTestTraffic, trafficTargets, trafficValues, trafficTraffic, dispatch }) => {
  const columns = [
    {
      title: '日期',
      dataIndex: 'day',
      key: 'day',
    },
  ]
  for (const value of trafficValues) {
    const version = versions.find(i => i.var_name === showTestTraffic.var_name && i.value === value)
    const name = version ? version.name : value
    columns.push({
      title: name,
      dataIndex: value,
      key: value,
      width: 120,
    })
    for (const target of trafficTargets) {
      const key = `${value}:${target}`
      columns.push({
        title: `${name}:${target}`,
        dataIndex: key,
        key: key,
        width: 120,
      })
    }
  }
  const preIndex = 1
  const length = trafficValues.length * (trafficTargets.length + 1)
  const dataSource = trafficTraffic.chunk(length + preIndex).map(item => {
    // eslint-disable-next-line
    const ts = item.shift()
    const res = {
      // day: new Date(item[0]),
      day: ts,
      // day: `${new Date(ts * 1000)}`.split(' ').slice(0, 4).join(' ')
    } 
    item.chunk(1 + trafficTargets.length).map((data, index) => {
      res[`${trafficValues[index]}`] = parseFloat(data.shift()) || 0
      return data.map((v, tindex) => {
        return res[`${trafficValues[index]}:${trafficTargets[tindex]}`] = parseFloat(v) || 0
      })
    })
    return res
  })
  const width = 300 + length * 120
  // console.log(dataSource)
  return (
    <Modal
      title={`${showTestTraffic ? showTestTraffic.name : '-'}流量`}
      visible={!!showTestTraffic}
      key={showTestTraffic && showTestTraffic.name || 'TestTrafficInfo'}
      width={width > 1000 ? 1000 : width}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {showTestTraffic: false } })
      }}
      footer={<Button onClick={e => {
        dispatch({ type: 'common/save', payload: {showTestTraffic: false } })
      }}>关闭</Button>}
    >
      <Chart height={300} data={dataSource.reverse()} forceFit={true} scale={{sales: {type:"linear", min: 0, max: 1000, tickCount: 10}}}>
        <Axis name="day" />
        {columns.slice(1).map(({dataIndex}, i) => {
          return <Axis position="left" name={dataIndex} visible={false}/>
        })}
        <Legend />
        <BTooltip />
        {columns.slice(1).map(({dataIndex}) => {
          return <Geom type="line" position={`day*${dataIndex}`} shape="smooth" />
        })}
      </Chart>
      <Table dataSource={dataSource} rowKey={row => row.day} columns={columns} pagination={false} />
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
      attributes=[],
      tests=[], layers=[], versions=[], layerWeight={}, testWeight={},
      newTargetVarName, newVersion, env,
      showTestRate, rateTargets=[], rateVersions=[],
      showTestTraffic, trafficValues=[], trafficTargets=[], trafficTraffic=[],
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
            <Menu.Item key="users"><Link to="/users">用户</Link></Menu.Item>
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
          <NewTestFrom dispatch={dispatch} visible={showNewTestForm} layers={layers} layerWeight={layerWeight} attributes={attributes} />
          <TestWeightFrom editTest={editTest} dispatch={dispatch} testWeight={testWeight[editTest && editTest._var_name]}/>
          <NewTargetFrom newTargetVarName={newTargetVarName} dispatch={dispatch} />
          <NewVersionFrom newVersion={newVersion} testWeight={testWeight} dispatch={dispatch} />
          <TestRateInfo showTestRate={showTestRate} rateTargets={rateTargets} rateVersions={rateVersions} dispatch={dispatch} />
          <TestTrafficInfo
            showTestTraffic={showTestTraffic}
            trafficValues={trafficValues}
            trafficTargets={trafficTargets}
            trafficTraffic={trafficTraffic}
            versions={versions}
            dispatch={dispatch}
          />
          <div style={{ background: '#fff', padding: 24, minHeight: 600 }}>
            <Table dataSource={tests} rowKey={row => row.var_name} columns={[
              {
                title: '流量层',
                dataIndex: 'layer',
                key: 'layer',
                render(val, row) {
                  return `${val}(${row.weight || 0}/100)`
                }
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
                title: '过滤属性',
                dataIndex: 'condition',
                key: 'condition',
                width: 150,
              },
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
                      {status === 'init' || status === 'stoped' ? <Button onClick={e => testAction(row.var_name, 'running', '启动实验')} type="primary">启动</Button> : null}
                      {status === 'running' ? <Button onClick={e => testAction(row.var_name, 'stoped', '停止实验')} type="danger">停止</Button> : null}
                      {status === 'stoped' || status === 'init' ? <Button onClick={e => testAction(row.var_name, 'deleted', '删除实验')} type="danger">删除</Button> : null}
                      <Button type="primary" icon="bar-chart" onClick={e => {
                        dispatch({ type: 'common/getTestTraffic', var_name: row.var_name, name: row.name, default_value: row.default_value })
                      }}/>
                      <Button type="primary" icon="deployment-unit" onClick={e => {
                        dispatch({ type: 'common/getTestRate', var_name: row.var_name, name: row.name, default_value: row.default_value })
                      }}/>
                    </Button.Group>
                  </div>
                }
              },
            ]} pagination={false} />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>lloydzhou@gmail.com ©2021</Footer>
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

