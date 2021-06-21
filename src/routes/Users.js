import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  Layout, Menu, Breadcrumb, Table, Button, Input,
  Form, Modal, Select, Icon, Dropdown,
  Tabs,
  Card, Switch, Tag,
} from 'antd';
import { ANDCondition, ORCondition, Condition, NOTCondition } from '../lib/condition'


const { TabPane } = Tabs;
const { Header, Content, Footer } = Layout;
const FormItem = Form.Item;
const Option = Select.Option;
const InputGroup = Input.Group;


const ATTRIBUTE_OPS = 'EQ,LT,GT,LE,GE,NE,LIKE,STARTWITH,ENDWITH,NOTLIKE,NOTSTARTWITH,NOTENDWITH,ISNULL,NOTNULL'.split(',')
const LOGIC_OPS = 'AND,OR,NOT'.split(',')

const AttributeConditionComponent = ({ condition, attributes, onChange }) => {
  const { op, target=[] } = condition
  return (
    <InputGroup compact>
      <Select value={target[0]} style={{width: 120}} onChange={e => {
        console.log('change attribute', e)
        onChange(condition, 'ATTRIBUTE', e)
      }}>
        {attributes.map(({attribute, name, type}) => {
          return <Option key={attribute}>{name}</Option>
        })}
      </Select>
      <Select value={op} style={{width: 100}} onChange={e => {
        console.log('change attribute op', e)
        onChange(condition, e)
      }}>
        {ATTRIBUTE_OPS.map(i => <Option key={i}>{i}</Option>)}
      </Select>
      <Input style={{ width: '50%' }} onChange={e => {
        console.log('change value', e.target.value)
        onChange(condition, 'VALUE', e.target.value)
      }} />
      <Button shape="circle" icon="close" onClick={e => onChange(condition, 'DELETE')}></Button>
    </InputGroup>
  )
}

const ConditionComponent = ({ condition, attributes, onChange, isRoot }) => {
  const { op: currentOp } = condition
  const not = currentOp === 'NOT'

  const currentCondition = not ? condition.target[0] : condition
  const { op, target=[] } = currentCondition

  return (
    <Card size="small"
      title={<span>
        <Switch onChange={e => {
          console.log('Switch not', e)
          onChange(condition, 'NOT')
        }} checked={not} checkedChildren="NOT" unCheckedChildren="NOT" style={{float: 'left', marginTop: 4}} />
        <InputGroup compact style={{marginLeft: 60}}>
        <Select value={op} style={{width: 70}} onChange={e => {
          console.log('change AND OR', e)
          onChange(currentCondition, e)
        }}>
          <Option value="AND">AND</Option>
          <Option value="OR">OR</Option>
        </Select>
        <Button onClick={e => onChange(currentCondition, 'ADDRULE')}>+Rule</Button>
        <Button onClick={e => onChange(currentCondition, 'ADDGROUP')}>+Group</Button>
        </InputGroup>
      </span>}
      extra={!isRoot && <Button shape="circle" icon="close" onClick={e => onChange(condition, 'DELETE')}></Button>}
    >
      {target.map((item, index) => {
        // console.log('op', op, ATTRIBUTE_OPS.indexOf(op), LOGIC_OPS.indexOf(op), item, index)
        return (
          <div key={index}>
            {index > 0 ? <Tag color="#108ee9" style={{margin: "10px 0"}}>{op}</Tag> : null}
            {ATTRIBUTE_OPS.indexOf(item.op) > -1
              ? <AttributeConditionComponent condition={item} attributes={attributes} onChange={onChange} />
              : LOGIC_OPS.indexOf(item.op) > -1 ? <ConditionComponent condition={item} attributes={attributes} onChange={onChange} /> : item.toString()}
          </div>
        )
      })}
    </Card>
  )
}


class AdvanceFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      condition: new ANDCondition(new ORCondition(new Condition('EQ', 'user_id', '')))
    }
  }
  onChange(condition, op, target) {
    console.log('onChange', condition, op, target)
    const { condition: rootCondition } = this.state
    const newCondition = this.walk(rootCondition, condition, op, target)
    console.log(newCondition, newCondition.toString())
    this.setState({condition: newCondition})
  }
  walk(rootCondition, condition, op, target) {
    console.log('walk Condition', rootCondition, condition, op, target)
    if (rootCondition === condition) {
      console.log('walk currentCondition', condition, op, target)
      if ('NOT' === op) {
        if (condition.op === 'NOT') {
          return condition.target[0]
        } else {
          return new NOTCondition(condition)
        }
      } else if ('ADDRULE' === op) {
        rootCondition.target.push(new Condition('EQ', ''))
      } else if ('ADDGROUP' === op) {
        rootCondition.target.push(new ANDCondition())
      } else if ('ATTRIBUTE' === op) {
        rootCondition.target[0] = target
      } else if ('VALUE' === op) {
        rootCondition.target[1] = target
      } else if (LOGIC_OPS.indexOf(op) > -1 || ATTRIBUTE_OPS.indexOf(op) > -1) {
        rootCondition.op = op
      } else {
        // 
      }
    } else {
      // rootCondition.target.map()
      const index = rootCondition.target.indexOf(condition)
      if (index > -1) {
        if ('DELETE' === op) {
          console.log('DELETE condition', condition, index)
          rootCondition.target = rootCondition.target.filter(i => i !== condition)
        } else {
          console.log('walk target', rootCondition.target, condition, op, target)
          rootCondition.target = rootCondition.target.map(i => {
            if (i.op) {
              return this.walk(i, condition, op, target)
            }
            return i
          })
        }
      } else{
        console.log('walk target', rootCondition.target, condition, op, target)
        rootCondition.target = rootCondition.target.map(i => {
          if (i.op) {
            return this.walk(i, condition, op, target)
          }
          return i
        })
      }
    }
    return rootCondition
  }
  render() {
    const { condition } = this.state
    const { attributes } = this.props
    
    return (
      <>
        <div>
          {condition.toString()}
        </div>
        <ConditionComponent condition={condition} attributes={attributes} onChange={this.onChange.bind(this)} isRoot />
      </>
    );
  }
}


const NewAttributeFrom = Form.create()(({ editAttribute, dispatch, form }) => {
  const { getFieldDecorator } = form;
  return (
    <Modal
      title={editAttribute && editAttribute.name ? editAttribute.name : '新增属性'}
      visible={!!editAttribute}
      key={editAttribute && editAttribute.attribute || 'NewAttributeFrom'}
      width={600}
      onCancel={e => {
        dispatch({ type: 'common/save', payload: {editAttribute: false } })
      }}
      footer={null}
    >
      <Form onSubmit={e => {
        e.preventDefault();
        form.validateFields((err, values) => {
          if (!err) {
            const {attribute, name='', type} = values
            dispatch({
              type: 'common/saveUserAttribute',
              attribute, name, typ: type,
            })
          }
        })

      }}>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="属性"
        >
          {getFieldDecorator('attribute', {
            rules: [
              { required: true, message: '属性' },
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="名称"
        >
          {getFieldDecorator('name', {
            rules: [
              { required: true, message: '属性' },
            ],
          })(
            <Input />
          )}
        </FormItem>
        <FormItem
          labelCol={{span: 6}}
          wrapperCol={{ span: 18 }}
          label="类型"
        >
          {getFieldDecorator('type', {
            rules: [
              { required: true, message: '请选择类型' },
            ],
          })(
            <Select>
              <Option value="number">数字</Option>
              <Option value="string">字符串</Option>
            </Select>
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


const UserAttributes = ({ attributes=[], dispatch }) => {
  return (
    <Table rowKey={row => row.attribute} dataSource={attributes}
    onRow={(record, rowIndex) => {
      return {
        onClick: event => {
          // console.log(event, record, rowIndex)
          dispatch({ type: 'common/setAttribute', attribute: record.attribute })
        }, // click row
      };
    }}
    columns={[
      {
        title: '字段',
        dataIndex: 'attribute',
        key: 'attribute',
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
      },
      {
        title: '创建时间',
        dataIndex: 'created',
        key: 'created',
        render(value) {
          return ('' + new Date(value * 1000)).split(' ').slice(0, 5).join(' ')
        }
      },
      {
        title: '更新时间',
        dataIndex: 'modified',
        key: 'modified',
        render(value) {
          return ('' + new Date(value * 1000)).split(' ').slice(0, 5).join(' ')
        }
      },
      {
        title: <Button onClick={e => {
          dispatch({ type: 'common/save', payload: { editAttribute: {} } })
        }}>添加属性</Button>,
        dataIndex: 'action',
        key: 'action',
        render(value, row, index) {
          return (
            <>
              <Button onClick={e => {
                dispatch({ type: 'common/save', payload: { editAttribute: {...row} } })
              }}>编辑</Button>
              <Button onClick={e => {
                Modal.confirm({
                  title: `确定删除${row.attribute}`,
                  content: `确定将属性${row.name}删除？`,
                  onOk() {
                    dispatch({ type: 'common/removeUserAttribute', attribute: row.attribute })
                  }
                })
              }}>删除</Button>
            </>
          )
        }
      },
    ]} pagination={false} />
  )
}


const UserList = ({ users=[], page=1, dispatch }) => {
  return (
    <Table rowKey={row => row.user_id} dataSource={users} columns={[
      {
        title: 'ID',
        dataIndex: 'user_id',
        key: 'user_id',
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '更新时间',
        dataIndex: 'modified',
        key: 'modified',
        render(value) {
          return ('' + new Date(value * 1000)).split(' ').slice(0, 5).join(' ')
        }
      },
    ]} pagination={false} />
  )
}


class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({ type: 'common/getUserAttributes' })
    dispatch({ type: 'common/getUserList', attr_name: 'user_id', page: 1 })
  }
  
  render() {
    const {
      attributes=[],
      users=[],
      userPage=1,
      editAttribute,
      env,
      dispatch,
      activeKey="attrs",
    } = this.props
    return (
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['users']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="layers"><Link to="/layers">流量</Link></Menu.Item>
            <Menu.Item key="tests"><Link to="/tests">实验</Link></Menu.Item>
            <Menu.Item key="users">用户</Menu.Item>
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
            <Breadcrumb.Item>用户</Breadcrumb.Item>
          </Breadcrumb>
          <NewAttributeFrom dispatch={dispatch} editAttribute={editAttribute} />
          <div style={{ background: '#fff', padding: 24, minHeight: 600 }}>
            <Tabs activeKey={activeKey} onChange={e => {
              dispatch({ type: 'common/save', payload: { activeKey: e } })
            }}>
              <TabPane tab="用户属性" key="attrs">
                <AdvanceFilter attributes={attributes} />
                <UserAttributes attributes={attributes} dispatch={dispatch} />
              </TabPane>
              <TabPane tab="用户列表" key="users">
                <UserList dispatch={dispatch} users={users} page={userPage} />
              </TabPane>
            </Tabs>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>lloydzhou@gmail.com ©2021</Footer>
      </Layout>
    )
  }
}

Users.propTypes = {
};

export default connect(({ common }) => {
  return {
    ...common,
  }
})(Users);

