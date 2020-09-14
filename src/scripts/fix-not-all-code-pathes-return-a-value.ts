#!/usr/bin/env ts-node

/**
 * Fix not all code pathes return a value error (TS7030)
 *
 */

import { getProject } from '../utils'
import { ArrowFunction, FunctionDeclaration, FunctionExpression, MethodDeclaration } from 'ts-morph'
const ERR_CODE = 7030

;
(async () => {
  const project = getProject()
  const oldCompilerOptions = project.getCompilerOptions()
  project.compilerOptions.set({
    ...oldCompilerOptions,
    noImplicitReturns: true
  })

  const diagnostics = project.getPreEmitDiagnostics().filter(item => item.getCode() === ERR_CODE)

  const toModify: Array<FunctionExpression | MethodDeclaration | ArrowFunction | FunctionDeclaration> = []
  for (const item of diagnostics) {
    const file = item.getSourceFile()
    if (file !== undefined) {
      const start = item.getStart() ?? 0
      const length = item.getLength() ?? 0
      if (start > 0 && length > 0) {
        const node = file.getDescendantAtPos(start)?.getParent()
        if (
          (node instanceof FunctionExpression) ||
          (node instanceof MethodDeclaration) ||
          (node instanceof ArrowFunction) ||
          (node instanceof FunctionDeclaration)) {
          toModify.push(node)
        }
      }
    }
  }
  toModify.forEach(node => node.addStatements('return undefined'))

  await project.save()
})().catch(console.error)
