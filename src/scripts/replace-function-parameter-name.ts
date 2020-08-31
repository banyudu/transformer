#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject } from '../utils'

const functionName = '_transform'
const oldName = 'self'
const newName = 'this' // file to import, example: lib/utils.ts

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    for (const cls of classes) {
      cls.getMethods().filter(item => item.getName() === functionName).forEach(func => {
        func.getParameter(oldName)?.rename(newName)
      })
    }
  }
  await project.save()
})().catch(console.error)
