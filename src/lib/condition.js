export class Condition{
  constructor(op, ...target){
    if (target.length === 0) {
      const m = op.match(/([A-Z]+)\((.*)\)/)
      if(m) {
        op = m[1]
        if (/\)$/.test(m[2])) {
          target = m[2].split('),').map(i => {
            console.log('split', i)
            if (/\)$/.test(i)) {
              // console.log('new Condition', i)
              return new Condition(i)
            }
            if (/\(/.test(i)) {
              // console.log('new Condition', i + ')')
              return new Condition(i + ')')
            }
            return i
          })
        } else {
          console.log('m2', m[2])
          target = m[2].split(',')
        }
        // console.log(m, op, target, typeof target)
      }
    }
    this.op = op
    this.target = target
  }
  toString(){
    // console.debug('toString', this.op, this.target)
    return `${this.op}(${this.target.map(i => i.toString()).join(',')})`
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


