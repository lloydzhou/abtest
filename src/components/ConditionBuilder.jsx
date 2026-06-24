import React, { Component } from 'react';
import {
  Button, Input, Select,
  Card, Switch, Tag,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { ANDCondition, ORCondition, Condition, NOTCondition } from '../lib/condition'

const InputGroup = Input.Group;

const ATTRIBUTE_OPS = 'EQ,LT,GT,LE,GE,NE,LIKE,STARTWITH,ENDWITH,NOTLIKE,NOTSTARTWITH,NOTENDWITH,ISNULL,NOTNULL'.split(',')
const LOGIC_OPS = 'AND,OR,NOT'.split(',')

const AttributeConditionComponent = ({ condition, attributes=[], onChange }) => {
  const { op, target=[] } = condition
  return (
    <InputGroup compact className="condition-row">
      <Select value={target[0]} style={{width: 150}} placeholder="选择属性" onChange={e => {
        onChange(condition, 'ATTRIBUTE', e)
      }} options={attributes.map(({attribute, name}) => ({ value: attribute, label: name }))} />
      <Select value={op} style={{width: 110}} onChange={e => {
        onChange(condition, e)
      }} options={ATTRIBUTE_OPS.map(i => ({ value: i, label: i }))} />
      {op !== 'ISNULL' && op !== 'NOTNULL' ? <Input style={{ width: 180 }} placeholder="比较值" onChange={e => {
        onChange(condition, 'VALUE', e.target.value)
      }} /> : null}
      <Button icon={<CloseOutlined />} onClick={e => onChange(condition, 'DELETE')} />
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
      title={<span className="condition-card-title">
        <Switch onChange={e => {
          onChange(condition, 'NOT')
        }} checked={not} checkedChildren="NOT" unCheckedChildren="NOT" />
        <InputGroup compact>
        <Select value={op} style={{width: 80}} onChange={e => {
          onChange(currentCondition, e)
        }} options={[
          { value: 'AND', label: 'AND' },
          { value: 'OR', label: 'OR' },
        ]} />
        <Button onClick={e => onChange(currentCondition, 'ADDRULE', attributes.length ? attributes[0].attribute : undefined)}>添加规则</Button>
        <Button onClick={e => onChange(currentCondition, 'ADDGROUP')}>添加分组</Button>
        </InputGroup>
      </span>}
      extra={!isRoot && <Button icon={<CloseOutlined />} onClick={e => onChange(condition, 'DELETE')} />}
    >
      {target.map((item, index) => {
        return (
          <div key={index}>
            {index > 0 ? <Tag color="#1890ff" style={{margin: "10px 0"}}>{op}</Tag> : null}
            {ATTRIBUTE_OPS.indexOf(item.op) > -1
              ? <AttributeConditionComponent condition={item} attributes={attributes} onChange={onChange} />
              : LOGIC_OPS.indexOf(item.op) > -1 ? <ConditionComponent condition={item} attributes={attributes} onChange={onChange} /> : item.toString()}
          </div>
        )
      })}
    </Card>
  )
}

class ConditionBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      condition: new ANDCondition(new ORCondition(new Condition('EQ', 'user_id', '')))
    }
  }
  onChange(rootCondition, condition, op, target) {
    const { onChange } = this.props
    const newCondition = this.walk(rootCondition, condition, op, target)
    this.setState({value: newCondition})
    onChange && onChange(newCondition.toString())
  }
  walk(rootCondition, condition, op, target) {
    if (rootCondition === condition) {
      if ('NOT' === op) {
        if (condition.op === 'NOT') {
          return condition.target[0]
        } else {
          return new NOTCondition(condition)
        }
      } else if ('ADDRULE' === op) {
        rootCondition.target.push(new Condition('EQ', target || ''))
      } else if ('ADDGROUP' === op) {
        rootCondition.target.push(new ANDCondition())
      } else if ('ATTRIBUTE' === op) {
        rootCondition.target[0] = target
      } else if ('VALUE' === op) {
        rootCondition.target[1] = target
      } else if ('ISNULL' === op || 'NOTNULL' === op) {
        rootCondition.op = op
        rootCondition.target = [rootCondition.target[0]]
      } else if (LOGIC_OPS.indexOf(op) > -1 || ATTRIBUTE_OPS.indexOf(op) > -1) {
        rootCondition.op = op
      } else {
        // 
      }
    } else {
      const index = rootCondition.target.indexOf(condition)
      if (index > -1) {
        if ('DELETE' === op) {
          rootCondition.target = rootCondition.target.filter(i => i !== condition)
        } else {
          rootCondition.target = rootCondition.target.map(i => {
            if (i.op) {
              return this.walk(i, condition, op, target)
            }
            return i
          })
        }
      } else{
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
    const { attributes, value: pvalue = 'AND()' } = this.props
    const { value: rootCondition = new Condition(pvalue) } = this.state
    
    return (
      <>
        <div className="condition-builder-preview">
          {rootCondition.toString()}
        </div>
        <ConditionComponent condition={rootCondition} attributes={attributes} onChange={this.onChange.bind(this, rootCondition)} isRoot />
      </>
    );
  }
}

export default ConditionBuilder
