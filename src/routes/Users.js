import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import {
  Layout, Menu, Breadcrumb, Table, Button, Progress, Radio, Input, Slider,
  Form, Modal, Select, message, Icon, Dropdown, Tooltip,
  Tabs,
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


const { TabPane } = Tabs;
const { Header, Content, Footer } = Layout;
const FormItem = Form.Item;
const Option = Select.Option;


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
    <Table rowKey={row => row.attribute} dataSource={attributes} columns={[
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

          return JSON.stringify(row)
        }
      },
    ]} pagination={false} />
  )
}


const UserList = ({ dispatch }) => {
  return (
    <div>UserList</div>
  )
}


class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount() {
    this.props.dispatch({ type: 'common/getUserAttributes' })
  }
  
  render() {
    const {
      attributes=[],
      editAttribute,
      env,
      dispatch
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
            <Tabs defaultActiveKey="attrs">
              <TabPane tab="用户属性" key="attrs">
                <UserAttributes attributes={attributes} dispatch={dispatch} />
              </TabPane>
              <TabPane tab="用户列表" key="users">
                <UserList dispatch={dispatch} />
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

