#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions, getImportDeclaration } from '../utils'
import { SourceFile } from 'ts-morph'

const funcParamName = 'compressor' // function parameter name
const newType = 'Compressor' // new type name
const importFile = 'lib/compressor.ts' // file to import
const defaultImport = 'Compressor' // set it if use default import
const namedImport = '' // set it if use named import

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  const outputFile = project.getSourceFile(file => file.getFilePath().includes(importFile)) as SourceFile
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
      const decl = getImportDeclaration(file, outputFile, true)
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
