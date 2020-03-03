import 'react'
import 'react-dom'
import 'react-router'
import 'core-js'
import 'prop-types'
import 'path-to-regexp'
import 'dva'

import antd from 'antd'

/* eslint-disable */
const {
  Table,
  Form,
  Layout,
  Row,
  Col,
  Menu,
  Popover,
  Input,
  Button,
  Checkbox,
  Card,
  Icon,
  Modal,
  message,
  InputNumber,
  Tooltip,
  Tabs,
  Badge,
} = antd
/* eslint-disable */
// Array.prototype.chunk = function ( n ) {
//   if ( !this.length ) {
//     return [];
//   }
//   return [ this.slice( 0, n ) ].concat( this.slice(n).chunk(n) );
// };
// 使用前面的方式定义函数，这个chunk可以被枚举出来，使用Object.defineProperty定义出来的不会
Object.defineProperty(Array.prototype, 'chunk', {value: function(n) {
    return Array.from(Array(Math.ceil(this.length/n)), (_,i)=>this.slice(i*n,i*n+n));
}});

