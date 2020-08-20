#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions } from '../utils'
// import { Node } from 'ts-morph'

(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const functions = getFunctions(file)
    for (const func of functions) {
      const parameters = func.getParameters()
      for (const param of parameters) {
        if (param.getName() === 'visitor' && param.getType().getText() === 'any') {
          param.setType('TreeWalker')
        }
      }
    }
    // console.log(file.getFilePath())
  }
  await project.save()
})().catch(console.error)
