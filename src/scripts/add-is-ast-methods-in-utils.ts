#!/usr/bin/env ts-node

/**
//  * Add is_ast_xxx functions in lib/utils.ts
 */

import { getProject, camelToSnakeCase } from '../utils'
// import { Node } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const utilsFile = project.getSourceFile(file => file.getFilePath().includes('lib/utils.ts'))
  const astIndexFile = project.getSourceFile(file => file.getFilePath().includes('lib/ast/index.ts'))
  const astClasses = astIndexFile?.getExportSymbols() ?? []

  const astImportDeclaration = (utilsFile?.getImportDeclarations().filter(
    item => item.getModuleSpecifierValue().endsWith('/ast')
  ) ?? [])[0]
  const astNameSet = new Set(astImportDeclaration.getNamedImports().map(e => e.getName()))

  for (const item of astClasses) {
    const name = item.getName()
    if (name.startsWith('AST_')) {
      const funcName = 'is_ast' + camelToSnakeCase(name.substr('AST_'.length))
      utilsFile?.addStatements(`
export function ${funcName} (node: AST_Node): node is ${name} {
  return node?.isAst?.('${name}')
}
      `)

      if (!astNameSet.has(name)) {
        astImportDeclaration.addNamedImport(name)
      }
    }
  }
  // console.log(utilsFile?.getImportDeclarations().map(item => item.getNamedImports().map(e => e.getName())))
  await project.save()
})().catch(console.error)
