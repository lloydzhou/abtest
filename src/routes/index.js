import React from "react";
import { Router, Route, Switch } from 'dva/router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN'
import moment from 'moment';
import 'moment/locale/zh-cn';
import Tests from './Tests';

moment.locale('en');



function RouterConfig({ history }) {
  return (<ConfigProvider locale={zhCN}>
    <Router history={history}>
      <Switch>
        <Route path="/tests" component={Tests} />
        <Route path="*" exact component={Tests} />
      </Switch>
    </Router>
  </ConfigProvider>);
}

export default RouterConfig;
