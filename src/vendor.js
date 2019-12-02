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
Array.prototype.chunk = function ( n ) {
  if ( !this.length ) {
    return [];
  }
  return [ this.slice( 0, n ) ].concat( this.slice(n).chunk(n) );
};
