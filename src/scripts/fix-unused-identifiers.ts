#!/usr/bin/env ts-node

/**
 * Auto remove useless imports
 */

import { getProject } from '../utils'
;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    file.fixUnusedIdentifiers()
    await file.save()
  }
  await project.save()
})().catch(console.error)
