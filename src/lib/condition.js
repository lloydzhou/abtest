

export class Condition{
  constructor(op, ...target){
    if (target.length === 0) {
      let res = parse(op)
      op = res[0].op
      target = res[0].target
    }
    this.op = op
    this.target = target.filter(i => i)
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
  if (m) {
    const op = m[1]
    const targetstr = m[2].substr(1)
    if (targetstr === '') {
      return [new Condition(op, false), '']
    }
    let [target, remain] = parse(targetstr, depth + 1)
    if (!target.op && remain.substr(0, 1) === ',') {
      // 当前这一层有相同级别的condition,回到上一层继续解析
      return [new Condition(op, ...target), remain]
    }
    if (target.op) {
      target = [target]
    }
    while (remain.substr(0, 1) === ',') {
      const [target1, remain1] = parse(remain.substr(1), depth + 1)
      target.push(target1)
      remain = remain1
    }
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

export class ANDCondition extends Condition{
  constructor(...target) {
    super('AND', ...target)
  }
}

export class ORCondition extends Condition{
  constructor(...target) {
    super('OR', ...target)
  }
}

export class NOTCondition extends Condition{
  constructor(...target) {
    super('NOT', ...target)
  }
}


