import React, { Component } from 'react';
import {
  Button, Input, Select,
  Card, Switch, Tag,
} from 'antd';
import { ANDCondition, ORCondition, Condition, NOTCondition } from '../lib/condition'


const Option = Select.Option;
const InputGroup = Input.Group;


const ATTRIBUTE_OPS = 'EQ,LT,GT,LE,GE,NE,LIKE,STARTWITH,ENDWITH,NOTLIKE,NOTSTARTWITH,NOTENDWITH,ISNULL,NOTNULL'.split(',')
const LOGIC_OPS = 'AND,OR,NOT'.split(',')

const AttributeConditionComponent = ({ condition, attributes=[], onChange }) => {
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
      {op !== 'ISNULL' && op !== 'NOTNULL' ? <Input style={{ width: '30%' }} onChange={e => {
        console.log('change value', e.target.value)
        onChange(condition, 'VALUE', e.target.value)
      }} /> : null}
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
        <InputGroup compact style={{marginLeft: 0}}>
        <Select value={op} style={{width: 70}} onChange={e => {
          console.log('change AND OR', e)
          onChange(currentCondition, e)
        }}>
          <Option value="AND">AND</Option>
          <Option value="OR">OR</Option>
        </Select>
        <Button onClick={e => onChange(currentCondition, 'ADDRULE', attributes.length ? attributes[0].attribute : undefined)}>+Rule</Button>
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


class ConditionBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      condition: new ANDCondition(new ORCondition(new Condition('EQ', 'user_id', '')))
    }
  }
  onChange(rootCondition, condition, op, target) {
    // console.log('onChange', condition, op, target)
    const { onChange } = this.props
    const newCondition = this.walk(rootCondition, condition, op, target)
    console.log(newCondition, newCondition.toString())
    this.setState({value: newCondition})
    onChange && onChange(newCondition.toString())
  }
  walk(rootCondition, condition, op, target) {
    // console.log('walk Condition', rootCondition, condition, op, target)
    if (rootCondition === condition) {
      // console.log('walk currentCondition', condition, op, target)
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
      // rootCondition.target.map()
      const index = rootCondition.target.indexOf(condition)
      if (index > -1) {
        if ('DELETE' === op) {
          // console.log('DELETE condition', condition, index)
          rootCondition.target = rootCondition.target.filter(i => i !== condition)
        } else {
          // console.log('walk target', rootCondition.target, condition, op, target)
          rootCondition.target = rootCondition.target.map(i => {
            if (i.op) {
              return this.walk(i, condition, op, target)
            }
            return i
          })
        }
      } else{
        // console.log('walk target', rootCondition.target, condition, op, target)
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
        <div>
          {rootCondition.toString()}
        </div>
        <ConditionComponent condition={rootCondition} attributes={attributes} onChange={this.onChange.bind(this, rootCondition)} isRoot />
      </>
    );
  }
}

export default ConditionBuilder

