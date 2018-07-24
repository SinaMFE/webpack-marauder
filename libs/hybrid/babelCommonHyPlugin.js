const commonMod = new Set()
process.env.HYBRID_COMMON = commonMod

function isDebug(state) {
  return commonMod.size && state.opts.debug
}

module.exports = function({ types: t }) {
  function isMatchedRequireCall(node, state) {
    const re = new RegExp(/@mfelibs\/hybrid-common/, 'g')

    return (
      t.isIdentifier(node.callee, { name: 'require' }) &&
      t.isLiteral(node.arguments[0]) &&
      !t.isTemplateLiteral(node.arguments[0]) &&
      node.arguments[0].value.match(re)
    )
  }

  return {
    visitor: {
      CallExpression(path, state) {
        const { node } = path

        if (!isMatchedRequireCall(node, state)) return

        const assets = require('@mfelibs/hybrid-common/assets')

        if (t.isMemberExpression(path.parent)) {
          const pNode = path.parent
          if (assets[pNode.property.name]) {
            commonMod.add(pNode.property.name)

            if (isDebug(state)) console.log('MemberExpression', commonMod)
          }
        } else {
          // add all modules
          Object.keys(assets).forEach(v => commonMod.add(v))

          if (isDebug(state)) console.log('CallExpression', commonMod)
        }
      },

      ImportDeclaration: (path, state) => {
        const { node } = path

        if (node.source.value !== '@mfelibs/hybrid-common') return

        node.specifiers.forEach(n => {
          const field = n.local.name

          if (t.isImportSpecifier(n)) {
            commonMod.add(field)
          }
        })

        if (isDebug(state)) console.log('ImportDeclaration', commonMod)
      }
    }
  }
}
