#!/usr/bin/env ts-node

/**
 * get untyped function parameter info
 */

import { getProject, getFunctions } from '../utils'

const name2Count: Map<string, number> = new Map()

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const functions = getFunctions(file)
    for (const func of functions) {
      const parameters = func.getParameters()
      for (const param of parameters) {
        if (param.getType().getText() === 'any') {
          const name = param.getText()
          if (!name2Count.has(name)) {
            name2Count.set(name, 1)
          } else {
            name2Count.set(name, name2Count.get(name) as number + 1)
          }
        }
      }
    }
  }

  const arr = Array.from(name2Count.entries()).sort((a, b) => a[1] - b[1])
  arr.forEach(item => console.log(`${item[0]}: ${item[1]}`))

  // await project.save()
})().catch(console.error)
