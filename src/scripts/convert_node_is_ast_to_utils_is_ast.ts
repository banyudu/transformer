#!/usr/bin/env ts-node

/**
  * Convert AST_Node.isAst to utils.is_ast_xxx functions
  * has bug, can replace only the first sentence in the same block. Run multiple times to fix this issue
 */

import { getProject, getFunctions, walk, getImportDeclaration, camelToSnakeCase } from '../utils'
import { PropertyAccessExpression, CallExpression, SourceFile, FunctionDeclaration } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const utilsFile = project.getSourceFile(file => file.getFilePath().includes('lib/utils.ts')) as SourceFile
  const files = project.getSourceFiles()
  for (const file of files) {
    const utilsImportDeclaration = getImportDeclaration(file, utilsFile)
    const utilsImportSet = new Set(utilsImportDeclaration !== undefined ? utilsImportDeclaration.getNamedImports().map(item => item.getText()) : [])
    const functions = getFunctions(file)
    for (const func of functions) {
      if (func instanceof FunctionDeclaration && func.getName()?.startsWith('is_ast_') === true) {
        // exclude is_ast_xxx functions
        continue
      }
      const body = func.getBody()
      if (body !== undefined) {
        walk(body, (node) => {
          const pNode = node.getParent()
          const gpNode = pNode?.getParent()
          if (node.getText() === 'isAst' && pNode instanceof PropertyAccessExpression && gpNode instanceof CallExpression) {
            const varName = pNode?.getFirstChild()?.getText() ?? ''
            const isAstArg = gpNode.getArguments()[0].getText()
            const typeName = isAstArg.substr(1, isAstArg.length - 2)
            const isAstFunctionName = 'is_ast' + camelToSnakeCase(typeName.substr('AST_'.length))
            // console.log('isAstFunctionName: ', isAstFunctionName)
            if (!utilsImportSet.has(isAstFunctionName) && file !== utilsFile) {
              const decl = getImportDeclaration(file, utilsFile, true)
              decl?.addNamedImport(isAstFunctionName)
              utilsImportSet.add(isAstFunctionName)
            }
            // console.log('varname: ', varName)
            // console.log('type name: ', typeName)
            // console.log(gpNode.getText())

            // repalce gpNode to new statement
            gpNode.replaceWithText(`${isAstFunctionName}(${varName})`)
          }
          return true
        })
      }
    }
    // console.log(file.getFilePath())
  }

  // console.log(utilsFile?.getImportDeclarations().map(item => item.getNamedImports().map(e => e.getName())))
  await project.save()
})().catch(console.error)
