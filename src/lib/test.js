import { Condition, ANDCondition, ORCondition } from 'condition.js'

// const and = new Condition('AND', '1', '2', '3')
const and = new ANDCondition('1', '2', '3')
const or = new Condition('OR(1, 2)')
const not = new Condition('NOT(1, 2)')
const multi = new ORCondition(and, and)
const multis = new Condition('OR(AND(1,2,3),AND(4,5,6))')

console.log(and.toString())
console.log(or.toString())
console.log(not.toString())
console.log(multi.toString())
console.log(multis.toString())
