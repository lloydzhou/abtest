import React from "react";
import { Router, Route, Switch } from 'dva/router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN'
import moment from 'moment';
import 'moment/locale/zh-cn';
import Users from './Users';
import Tests from './Tests';
import Layers from './Layers';

moment.locale('en');



function RouterConfig({ history }) {
  return (<ConfigProvider locale={zhCN}>
    <Router history={history}>
      <Switch>
        <Route path="/layers" component={Layers} />
        <Route path="/tests" component={Tests} />
        <Route path="/users" component={Users} />
        <Route path="*" exact component={Tests} />
      </Switch>
    </Router>
  </ConfigProvider>);
}

export default RouterConfig;
