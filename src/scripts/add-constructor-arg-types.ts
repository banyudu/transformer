#!/usr/bin/env ts-node

/**
  * Add types for constructor args in ast_xxx classes
 */

import { getProject, getAstClasses, inspectNode } from '../utils'

;
(async () => {
  const project = getProject()
  const classes = getAstClasses()
  for (const cls of classes) {
    inspectNode(cls.getConstructors())
  }

  await project.save()
})().catch(console.error)
