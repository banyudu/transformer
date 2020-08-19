#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions } from '../utils'
import { Node } from 'ts-morph'

(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const functions = getFunctions(file)
    for (const func of functions) {
      if (Node.isArrowFunction(func)) {
        console.log(func.getText())
      } else {
        console.log(func.getName())
      }
    }
    console.log(file.getFilePath())
  }
})().catch(console.error)
