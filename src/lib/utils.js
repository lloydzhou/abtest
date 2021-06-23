export class Condition{
  constructor(op, ...target){
    this.op = op
    this.target = target
  }
  toString(){
    // console.debug('toString', this.op, this.target)
    return `${this.op}(${this.target.map(i => i.toString()).join(',')})`
  }
}
function parse(str, depth=1) {
  // 1. 先检查左边括号
  // 2. 如果没有括号就检查是否有逗号，有逗号就分隔再返回，否则将当前字符串作为数组元素返回
  const m = str.match(/^([A-Z]+)(.*)/)
  // console.log('parse', str, m)
  console.log('start parse', depth, str)
  if (m) {
    const op = m[1]
    const targetstr = m[2].substr(1)
    if (targetstr === '') {
      return [new Condition(op), '']
    }
    let [target, remain] = parse(targetstr, depth + 1)
    console.log('res', depth, target, remain)
    if (!target.op && remain.substr(0, 1) === ',') {
      // 当前这一层有相同级别的condition,回到上一层继续解析
      return [new Condition(op, ...target), remain]
    }
    if (target.op) {
      target = [target]
    }
    console.log('currentOp1', depth, op, target, remain)
    while (remain.substr(0, 1) === ',') {
      const [target1, remain1] = parse(remain.substr(1), depth + 1)
      target.push(target1)
      remain = remain1
      console.log('next', depth, target1, remain1, op, target, remain)
    }
    console.log('currentOp2', depth, op, target, remain)
    return [new Condition(op, ...target), remain.substr(1)]
  } else {
    const r = str.indexOf(')')
    if (r < 0) {
      throw new Error()
    }
    const p = str.substr(0, r)
    const remain = str.substr(r + 1)
    const i = p.indexOf(',')
    if (i > -1) {
      return [p.split(','), remain]
    } else {
      return [[p], remain]
    }
  }
}

console.log('parse AND', parse('AND'))
const str = 'NOT(AND(NOT(OR(EQ(name,aasdas),LT(user_id,0001),NOT(AND(NOT(AND())))))))'
// const str = 'OR(EQ(name,aasdas),LT(user_id,0001),LT(user_id,0002))'

const [c, r] = parse(str)
console.log(c, c.toString(), r)
console.dir(c, { depth: null });

