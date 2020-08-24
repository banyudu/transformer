#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions, getImportDeclaration } from '../utils'
import { SourceFile } from 'ts-morph'

const funcParamName = 'self' // function parameter name
const newType = 'AST_Node' // new type name
const importFile = 'lib/ast/node.ts' // file to import, example: lib/utils.ts
const defaultImport = 'AST_Node' // set it if use default import
const namedImport = '' // set it if use named import

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  const fileToImport = project.getSourceFile(file => file.getFilePath().includes(importFile)) as SourceFile
  for (const file of files) {
    const functions = getFunctions(file)
    let shouldImport = false
    for (const func of functions) {
      const parameters = func.getParameters()
      for (const param of parameters) {
        if (param.getName() === funcParamName && param.getType().getText() === 'any') {
          param.setType(newType)
          shouldImport = true
        }
      }
    }
    if (shouldImport) {
      const decl = getImportDeclaration(file, fileToImport, true)
      if (String(namedImport) !== '') {
        decl?.addNamedImport(namedImport)
      }

      if (String(defaultImport) !== '') {
        decl?.setDefaultImport(defaultImport)
      }
    }
  }
  await project.save()
})().catch(console.error)
