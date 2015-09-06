const children = require('ast-children')

/**
 * Get all declared variables within `node`'s scope
 *
 * @param {AST} node
 * @return {Array}
 */

const freshVars = node => {
  if (node == null) return []
  switch (node.type) {
    case 'VariableDeclarator': return paramVars(node.id)
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': return [] // early exit
    case 'FunctionDeclaration': return [node.id.name]
    case 'CatchClause': return freshVars(node.body).concat(paramVars(node.param))
  }
  return children(node).map(freshVars).reduce(concat, [])
}

const paramVars = node => {
  if (node.type == 'Identifier') return [node.name]
  if (node.type == 'AssignmentPattern') return paramVars(node.left)
  if (node.type == 'RestElement') return paramVars(node.argument)
  if (node.type == 'Property') {
    return isPattern(node.value)
      ? paramVars(node.value)
      : paramVars(node.key)
  }
  return children(node).map(paramVars).reduce(concat, [])
}

const isPattern = node => node != null && /\w+Pattern$/.test(node.type)

const concat = (a, b) => a.concat(b)

/**
 * Transform `node` by passing it though `transforms[node.type]` if
 * its defined. Otherwise it recurs into node's children and maps them
 *
 * @param  {Object} transforms
 * @param  {Object} env
 * @param  {AST} node
 * @return {AST}
 */

const map = (transforms, env, node) => {
  if (node == null) return node
  if (node.type in transforms) {
    return transforms[node.type](node, env)
  }
  const fn = map[node.type]
  if (fn) fn(transforms, env, node)
  return node
}

map.VariableDeclarator = (transforms, env, node) => {
  node.id = map(transforms, env, node.id)
  node.init = map(transforms, env, node.init)
}

const makeMapper = key => (transforms, env, node) => {
  node[key] = node[key].map(e => map(transforms, env, e))
}

map.VariableDeclaration = makeMapper('declarations')
map.SequenceExpression = makeMapper('expressions')
map.ObjectPattern =
map.ObjectExpression = makeMapper('properties')
map.ArrayPattern =
map.ArrayExpression = makeMapper('elements')

map.ArrowFunctionExpression =
map.FunctionDeclaration =
map.FunctionExpression = (transforms, old_env, node) => {
  var new_env = Object.create(old_env)
  freshVars(node.body).forEach(name => new_env[name] = undefined)
  node.params = node.params.map(p => mapParam(p, old_env, new_env, transforms))
  node.body = map(transforms, new_env, node.body)
}

const mapParam = (param, old_env, new_env, transforms) => {
  if (param.type == 'Identifier') {
    new_env[param.name] = undefined
    return map(transforms, new_env, param)
  }
  if (param.type == 'AssignmentPattern') {
    param.left = mapParam(param.left, old_env, new_env, transforms)
    param.right = map(transforms, old_env, param.right)
  }
  if (param.type == 'RestElement') {
    param.argument = mapParam(param.argument, old_env, new_env, transforms)
  }
  return param
}

map.BlockStatement = makeMapper('body')

map.Property = (transforms, env, node) => {
  node.key = map(transforms, env, node.key)
  node.value = map(transforms, env, node.value)
}

map.ClassDeclaration =
map.ClassExpression = (transforms, env, node) => {
  node.id = map(transforms, env, node.id)
  node.superClass = map(transforms, env, node.superClass)
  node.body = map(transforms, env, node.body)
}

map.ClassBody = map.BlockStatement
map.ClassProperty = map.Property
map.MethodDefinition = map.Property

map.ContinueStatement = (transforms, env, node) => {
  node.label = map(transforms, env, node.label)
}

map.Program = (transforms, env, node) => {
  env = Object.create(env)
  freshVars(node).forEach(name => env[name] = undefined)
  node.body = node.body.map(node => map(transforms, env, node))
}

map.ExpressionStatement = (transforms, env, node) => {
  node.expression = map(transforms, env, node.expression)
}

map.IfStatement =
map.ConditionalExpression = (transforms, env, node) => {
  node.test = map(transforms, env, node.test)
  node.consequent = map(transforms, env, node.consequent)
  node.alternate = map(transforms, env, node.alternate)
}

map.SwitchCase = (transforms, env, node) => {
  node.test = map(transforms, env, node.test)
  node.consequent = node.consequent.map(c => map(transforms, env, c))
}

map.SwitchStatement = (transforms, env, node) => {
  node.discriminant = map(transforms, env, node.discriminant)
  node.cases = node.cases.map(c => map(transforms, env, c))
}

map.ThrowStatement =
map.UnaryExpression =
map.ReturnStatement =
map.RestElement =
map.SpreadElement =
map.YieldExpression =
map.UpdateExpression = (transforms, env, node) => {
  node.argument = map(transforms, env, node.argument)
}

map.TryStatement = (transforms, env, node) => {
  node.block = map(transforms, env, node.block)
  node.handler = map(transforms, env, node.handler)
  node.finalizer = map(transforms, env, node.finalizer)
}

map.CatchClause = (transforms, env, node) => {
  const new_env = Object.create(env)
  node.param = mapParam(node.param, env, new_env, transforms)
  node.body = map(transforms, new_env, node.body)
}

map.WhileStatement =
map.DoWhileStatement = (transforms, env, node) => {
  node.test = map(transforms, env, node.test)
  node.body = map(transforms, env, node.body)
}

map.ForStatement = (transforms, env, node) => {
  node.init = map(transforms, env, node.init)
  node.test = map(transforms, env, node.test)
  node.body = map(transforms, env, node.body)
  node.update = map(transforms, env, node.update)
}

map.ForOfStatement =
map.ForInStatement = (transforms, env, node) => {
  node.left = map(transforms, env, node.left)
  node.right = map(transforms, env, node.right)
  node.body = map(transforms, env, node.body)
}

map.BinaryExpression =
map.LogicalExpression =
map.AssignmentPattern =
map.AssignmentExpression = (transforms, env, node) => {
  node.left = map(transforms, env, node.left)
  node.right = map(transforms, env, node.right)
}

map.NewExpression =
map.CallExpression = (transforms, env, node) => {
  node.callee = map(transforms, env, node.callee)
  node.arguments = node.arguments.map(e => map(transforms, env, e))
}

map.LabeledStatement = (transforms, env, node) => {
  node.body = map(transforms, env, node.body)
  node.label = map(transforms, env, node.label)
}

map.MemberExpression = (transforms, env, node) => {
  node.object = map(transforms, env, node.object)
  node.property = map(transforms, env, node.property)
}

map.ExportNamedDeclaration = (transforms, env, node) => {
  node.declaration = map(transforms, env, node.declaration)
  node.specifiers = node.specifiers.map(s => map(transforms, env, s))
  node.source = map(transforms, env, node.source)
}

map.ExportDefaultDeclaration = (transforms, env, node) => {
  node.declaration = map(transforms, env, node.declaration)
}

map.TemplateLiteral = (transforms, env, node) => {
  node.expressions = node.expressions.map(s => map(transforms, env, s))
  node.quasis = node.quasis.map(s => map(transforms, env, s))
}

export default map
