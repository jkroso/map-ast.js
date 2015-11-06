if (typeof window != 'undefined') window.process={argv:[],env:[]} // hack for browser
import {parse as babylon} from 'babylon'
import {spy} from 'simple-spy'
import assert from 'assert'
import map from '../index'

const count = (value, array) => {
  var count = 0
  for (var i = 0; i < array.length; i++) {
    if (array[i] == value) count++
  }
  return count
}

const parse = src =>
  babylon(src, {
    sourceType: 'module',
    plugins: [
     'jsx',
     'flow',
     'asyncFunctions',
     'classConstructorCall',
     'doExpressions',
     'trailingFunctionCommas',
     'objectRestSpread',
     'decorators',
     'classProperties',
     'exportExtensions',
     'exponentiationOperator',
     'asyncGenerators'
    ]
  })

const check = (src, ...types) => {
  const transforms = {}
  types.forEach(type => transforms[type] = spy(()=>null))
  map(transforms, null, parse(src))
  types.forEach(type => {
    var fn = transforms[type]
    var ok = fn.callCount == count(type, types)
    assert(ok, `${type} visited ${fn.callCount} times`)
  })
  it(`${src} ${types.join()}`, () => {})
}

AssignmentExpression: ['left', 'right']
check('a=1', 'NumericLiteral')
AssignmentPattern: ['left', 'right']
check('[a={}]=1', 'ObjectExpression', 'Identifier')
ArrayExpression: ['elements']
check('[a]', 'Identifier')
ArrayPattern: ['elements']
check('var [a=1]=[{}]', 'NumericLiteral', 'ObjectExpression')
ArrowFunctionExpression: ['params', 'body']
check('(a=1)=>({})', 'NumericLiteral', 'ObjectExpression')
BlockStatement: ['body']
check('{a}', 'Identifier')
BinaryExpression: ['left', 'right']
check('a < 1', 'Identifier', 'NumericLiteral')
BreakStatement: ['label']
check('while(true)break', 'BreakStatement')
CallExpression: ['callee', 'arguments']
check('a(1)', 'Identifier', 'NumericLiteral')
CatchClause: ['param', 'body']
check('try{}catch(e){[]}', 'Identifier', 'ArrayExpression')
ClassDeclaration: ['id', 'superClass', 'body']
ClassExpression: ['id', 'superClass', 'body']
check('class A extends 1 {}', 'Identifier', 'NumericLiteral', 'ClassBody')
ClassBody: ['body']
check('class a {b(){1}}', 'NumericLiteral')
ConditionalExpression: ['test', 'consequent', 'alternate']
check('true?[]:{}', 'BooleanLiteral', 'ArrayExpression', 'ObjectExpression')
ContinueStatement: ['label']
check('while(true)continue', 'ContinueStatement')
check('a:while(true)continue a', 'Identifier', 'Identifier')
DebuggerStatement: []
check('debugger', 'DebuggerStatement')
DoWhileStatement: ['body', 'test']
check('do {1} while([])', 'NumericLiteral', 'ArrayExpression')
EmptyStatement: []
ExportAllDeclaration: ['source']
ExportDefaultDeclaration: ['declaration']
check('export default a', 'Identifier')
ExportNamedDeclaration: ['declaration', 'specifiers', 'source']
ExportSpecifier: ['exported', 'local']
check('export {a}', 'ExportSpecifier')
ExpressionStatement: ['expression']
check('a', 'Identifier')
ForStatement: ['init', 'test', 'update', 'body']
check('for (var i;{};this)[]', 'ArrayExpression', 'ObjectExpression', 'ThisExpression')
ForInStatement: ['left', 'right', 'body']
check('for (var i in {})[]', 'ArrayExpression', 'ObjectExpression', 'Identifier')
ForOfStatement: ['left', 'right', 'body']
check('for (var i of {})[]', 'ArrayExpression', 'ObjectExpression', 'Identifier')
FunctionDeclaration: ['id', 'params', 'body']
check('function a(b={}){[]}', 'ArrayExpression', 'ObjectExpression')
FunctionExpression: ['id', 'params', 'body']
check('(function a(b={}){[]})', 'ArrayExpression', 'ObjectExpression')
Identifier: []
check('a', 'Identifier')
IfStatement: ['test', 'consequent', 'alternate']
check('if (true) {[]} else {({})}', 'BooleanLiteral', 'ArrayExpression', 'ObjectExpression')
Literal: []
check('1', 'NumericLiteral')
LabeledStatement: ['label', 'body']
check('a:{1}', 'NumericLiteral')
LogicalExpression: ['left', 'right']
check('a&&1', 'NumericLiteral', 'Identifier')
MemberExpression: ['object', 'ObjectProperty']
check('({}).b', 'Identifier', 'ObjectExpression')
MethodDefinition: ['key', 'value']
check('({b(){1}})', 'Identifier', 'NumericLiteral')
NewExpression: ['callee', 'arguments']
check('new a(1)', 'Identifier', 'NumericLiteral')
ObjectExpression: ['properties']
check('({a:1})', 'ObjectProperty')
ObjectPattern: ['properties']
check('({a}=1)', 'ObjectProperty')
ObjectProperty: ['key', 'value']
check('({a:1})', 'NumericLiteral', 'Identifier')
RestElement: [ 'argument' ]
check('(...a)=>1', 'Identifier')
ReturnStatement: ['argument']
check('()=>{return 1}', 'NumericLiteral')
SequenceExpression: ['expressions']
check('a,1', 'NumericLiteral', 'Identifier')
SpreadElement: ['argument']
check('[...a]', 'Identifier')
Super: []
check('class A {constructor(){super()}}', 'Super')
SwitchStatement: ['discriminant', 'cases'],
check('switch (true) {case {}: []}', 'SwitchCase', 'BooleanLiteral')
SwitchCase: ['test', 'consequent'],
check('switch (true) {case {}: []}', 'ObjectExpression', 'ArrayExpression')
TemplateLiteral: ['quasis', 'expressions']
check('`a${1}`', 'NumericLiteral')
ThisExpression: []
check('(function(){this})', 'ThisExpression')
ThrowStatement: ['argument']
check('throw 1', 'NumericLiteral')
TryStatement: ['block', 'handler', 'finalizer'],
check('try{a}finally{1}', 'Identifier', 'NumericLiteral')
check('try{}catch(e){1}', 'Identifier', 'NumericLiteral')
UnaryExpression: ['argument']
check('~a', 'Identifier')
UpdateExpression: ['argument']
check('a++', 'Identifier')
VariableDeclaration: ['declarations']
VariableDeclarator: ['id', 'init']
check('var a = 1', 'Identifier', 'NumericLiteral')
WhileStatement: ['test', 'body']
check('while(true)a', 'Identifier', 'BooleanLiteral')
YieldExpression: ['argument']
check('(function*(){yield 1})', 'NumericLiteral')

describe('scope tracking', () => {
  const check = (src, type, ...vars) => {
    const fn = spy(()=>null)
    const transforms = {[type]: fn}
    map(transforms, null, parse(src))
    assert(fn.callCount == 1)
    const env = fn.args[0][1]
    assert(Object.keys(env).join() == vars.join())
  }

  it('simple variables', () => {
    check('var a,b;[]', 'ArrayExpression', 'a', 'b')
  })

  it('simple patterns', () => {
    check('var {a} = 1;[]', 'ArrayExpression', 'a')
    check('var {a, ...b} = 1;[]', 'ArrayExpression', 'a', 'b')
    check('var [a] = 1;[]', 'ArrayExpression', 'a')
    check('var [a, ...b] = 1;[]', 'ArrayExpression', 'a', 'b')
  })

  it('complex patterns', () => {
    check('var {a:{b,...c}} = 1;[]', 'ArrayExpression', 'b', 'c')
    check('var [a, {b:{c}}] = 1;[]', 'ArrayExpression', 'a', 'c')
  })

  it('simple function parameters', () => {
    check('(a)=>[]', 'ArrayExpression', 'a')
    check('(a,b)=>[]', 'ArrayExpression', 'a', 'b')
    check('(a,b,...c)=>[]', 'ArrayExpression', 'a', 'b', 'c')
    check('(a,b,...c)=>[];1', 'NumericLiteral')
  })

  it('complex function parameters', () => {
    check('({a:{b,...c}})=>[]', 'ArrayExpression', 'b', 'c')
    check('([a, {b,...c}])=>[]', 'ArrayExpression', 'a', 'b', 'c')
  })

  it('ClassDeclaration\'s', () => {
    check('class A {};[]', 'ArrayExpression', 'A')
  })

  it('import default', () => {
    check('import a from "a";[]', 'ArrayExpression', 'a')
  })

  it('import', () => {
    check('import {a} from "a";[]', 'ArrayExpression', 'a')
    check('import {a,b} from "a";[]', 'ArrayExpression', 'a', 'b')
    check('import {a as b} from "a";[]', 'ArrayExpression', 'b')
  })
})
