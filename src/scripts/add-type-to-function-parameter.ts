#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions, getImportDeclaration } from '../utils'
import { SourceFile } from 'ts-morph'

// const funcParamName = 'visitor'
// const newType = 'TreeWalker'

const funcParamName = 'output'
const newType = 'OutputStream'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  const outputFile = project.getSourceFile(file => file.getFilePath().includes('lib/output.ts')) as SourceFile
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
      decl?.addNamedImport('OutputStream')
    }
  }
  await project.save()
})().catch(console.error)
