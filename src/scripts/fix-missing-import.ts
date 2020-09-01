#!/usr/bin/env ts-node

/**
 * Auto fix missing imports
 */

import { getProject } from '../utils'
;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    file.fixMissingImports()
  }
  await project.save()
})().catch(console.error)
