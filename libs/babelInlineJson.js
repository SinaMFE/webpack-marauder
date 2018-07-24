const fs = require('fs')
const nodePath = require('path')
const resolve = require('resolve')

const readJSON = (filePath, state) => {
  const srcPath = nodePath.resolve(state.file.opts.filename)
  const jsonPath = nodePath.join(srcPath, '..', filePath)

  if (fs.existsSync(jsonPath + '.json')) {
    console.log('json', require(jsonPath))
    return require(jsonPath)
  }

  const file = resolve.sync(filePath, {
    basedir: nodePath.dirname(srcPath)
  })

  if (fs.existsSync(file)) {
    const fileText = fs.readFileSync(file, 'utf8')

    try {
      return JSON.parse(fileText)
    } catch (e) {
      // not a standard json file
      return null
    }
  }
}

const replacePath = (path, node) => {
  path.replaceWithMultiple([].concat(node))
}

module.exports = function({ types: t }) {
  function isMatchedRequireCall(node, state) {
    const re = new RegExp(state.opts.matchPattern, 'g')

    return (
      t.isIdentifier(node.callee, { name: 'require' }) &&
      t.isLiteral(node.arguments[0]) &&
      !t.isTemplateLiteral(node.arguments[0]) &&
      node.arguments[0].value.match(re)
    )
  }

  function createConstVarDeclaration(identifier, value) {
    return t.VariableDeclaration('const', [
      t.VariableDeclarator(t.Identifier(identifier), t.valueToNode(value))
    ])
  }

  function createExpression(value) {
    return t.expressionStatement(t.valueToNode(value))
  }

  return {
    visitor: {
      CallExpression(path, state) {
        const { node } = path

        if (isMatchedRequireCall(node, state)) {
          const json = readJSON(node.arguments[0].value, state)

          if (json) {
            replacePath(path, createExpression(json))
          }
        }
      },

      ImportDeclaration: (path, state) => {
        const { node } = path

        if (!node.source.value.match(/.json$/)) return

        const json = readJSON(node.source.value, state)

        if (json) {
          const nodeArr = node.specifiers.map(n => {
            const field = n.local.name

            switch (true) {
              case t.isImportDefaultSpecifier(n):
              case t.isImportNamespaceSpecifier(n):
                return createConstVarDeclaration(field, json)
              case t.isImportSpecifier(n):
                return createConstVarDeclaration(
                  field,
                  json[n.imported ? n.imported.name : field]
                )
            }
          })

          replacePath(path, nodeArr)
        }
      },

      MemberExpression(path, state) {
        const { node } = path

        if (isMatchedRequireCall(node.object, state)) {
          const json = readJSON(node.object.arguments[0].value, state)

          if (json) {
            replacePath(path, createExpression(json[node.property.name]))
          }
        }
      }
    }
  }
}
