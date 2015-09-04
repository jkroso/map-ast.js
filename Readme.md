# map-ast

Makes it easy to transform a JavaScript AST. There are heaps of other projects trying to solve this same problem. But I think they are all either gross, don't provide variable tracking, or both. This project provides variable and hierarchy tracking while being less gross than any other project I've seen. Here's my thoughts on the ones I am aware of:

- [Facebook/jstransform](https://github.com/facebook/jstransform): `utils.append('WTF!', state)`
- [substack/node-falafel](https://github.com/substack/node-falafel): `node.update('MVPish')`
- [estools/estraverse](https://github.com/estools/estraverse): subtly complicated and MVPish
- [babel](https://github.com/babel/babel) embedded in a larger tool and too complicated anyway

## Roadmap

Replace the `env` parameter with a linked list of `[env, parent]` values

## Installation

`npm install map-ast`

then in your app:

```js
const map = require('map-ast')
```

## API


### `map(transforms::Object, env::Object, ast::Object)`

Transform `node` by passing it though `transforms[node.type]` if its defined. Otherwise it recurs into node's children and maps them. The transformer will be passed the AST node and the variable environment it lives in.

```js
map({
  JSXElement({openingElement:{name}}, env) {
    return {
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'JSX'},
      arguments: [name.name in env
                    ? {type: 'Identifier', name: name.name}
                    : {type: 'Literal', value: name.name}]
    }
  }
}, null, parse('<a/>')) // => parse('JSX("a")')
```
