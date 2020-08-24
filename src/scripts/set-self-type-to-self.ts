#!/usr/bin/env ts-node

/**
  * Set self parameter type to self
 */

import { getProject, getFunctions } from '../utils'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    const astClsName = classes.find(item => item.getName()?.startsWith('AST_'))?.getName()
    if (astClsName !== undefined) {
      const functions = getFunctions(file)
      for (const func of functions) {
        const parameters = func.getParameters()
        for (const param of parameters) {
          if (param.getName() === 'self') {
            param.setType(astClsName)
          }
        }
      }
    }
  }

  await project.save()
})().catch(console.error)
