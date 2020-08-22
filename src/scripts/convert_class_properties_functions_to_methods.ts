#!/usr/bin/env ts-node

/**
  * Convert class properties to normal methods
 */

import { getProject } from '../utils'
import { SyntaxKind } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const prop of properties) {
        const init = prop.getInitializer()
        if ([
          SyntaxKind.FunctionExpression,
          SyntaxKind.MethodDeclaration,
          SyntaxKind.FunctionExpression
        ].includes(init?.getKind() as any)) {
          prop.replaceWithText(prop.getText().replace(/^(\w+) = function \(/, '$1 ('))
        } else if (init?.getText() === 'return_false') {
          prop.replaceWithText(`${prop.getName()} () { return false }`)
        } else if (init?.getText() === 'return_true') {
          prop.replaceWithText(`${prop.getName()} () { return true }`)
        } else if (init?.getText() === 'return_null') {
          prop.replaceWithText(`${prop.getName()} () { return null }`)
        } else if (init?.getText() === 'return_this') {
          prop.replaceWithText(`${prop.getName()} () { return this }`)
        } else if (init?.getText() === 'noop') {
          prop.replaceWithText(`${prop.getName()} () { }`)
        }
      }
    }
  }

  await project.save()
})().catch(console.error)
