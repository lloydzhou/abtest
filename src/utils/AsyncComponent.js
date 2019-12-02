import { Component } from "react";
import { Spin, Alert } from 'antd';
import MainLayout from '../routes/MainLayout';

export default function asyncComponent(importComponent) {
  class AsyncComponent extends Component {
    constructor(props) {
      super(props);
      this.state = {
        component: null
      };
    }
    async componentDidMount() {
      const { default: component } = await importComponent();
      this.setState({
        component: component
      });
    }
    render() {
      const C = this.state.component;
      return C ? <C {...this.props} /> : <MainLayout>
        <Spin>
          <Alert
            message="动态加载模块"
            description="动态加载模块"
            type="info"
            style={{ marginBottom: 16 }}
          />
        </Spin>
      </MainLayout>;
    }
  }
  return AsyncComponent;
}


