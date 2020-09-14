#!/usr/bin/env ts-node

/**
 * Rename unused function parameters, prefix them with _ to disable lint errors
 * for example, convert (hello: any) => true to (_hello: any) => true
 */

import { getFunctions, getProject } from '../utils'
import { ParameterDeclaration, SyntaxKind } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  const toRename: ParameterDeclaration[] = []
  for (const file of files) {
    const functions = getFunctions(file)
    for (const func of functions) {
      const params = func.getParameters()
      for (const param of params) {
        const self = param.getChildrenOfKind(SyntaxKind.Identifier)[0]
        const name = param.getName()
        if (name.startsWith('_') || name === 'this') {
          continue
        }
        const parent = param.getParent()
        const identifiers = parent.getDescendantsOfKind(SyntaxKind.Identifier)
        // const identifiers = parent.getChildrenOfKind(SyntaxKind.Identifier)
        if (identifiers.every(item => item === self || item.getText() !== name)) {
          toRename.push(param)
        }
      }
    }
  }
  toRename.forEach(item => {
    if (!item.wasForgotten()) {
      item.rename('_' + item.getName())
    }
  })

  await project.save()
})().catch(console.error)
