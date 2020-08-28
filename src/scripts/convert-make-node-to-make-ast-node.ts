#!/usr/bin/env ts-node

/**
  * Convert make_node(xxx.constructor.name) to make_ast_node(typeof xxx)
 */

import { getProject, walk } from '../utils'
import { CallExpression } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    let changed = false
    walk(file, (node) => {
      if (node instanceof CallExpression) {
        const expression = node.getExpression()
        const params = node.getArguments()
        if (expression.getText() === 'make_node' && params[0]?.getText().endsWith('constructor.name')) {
          changed = true
          expression.replaceWithText('make_ast_node')
          const obj = params[0].getFirstChild()
          if (obj !== undefined) {
            params[0].replaceWithText(obj.getText())
          }
        }
      }
      return true
    })
    if (changed) {
      file.fixMissingImports()
    }
  }
  // console.log(utilsFile?.getImportDeclarations().map(item => item.getNamedImports().map(e => e.getName())))
  await project.save()
})().catch(console.error)
