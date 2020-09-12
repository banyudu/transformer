#!/usr/bin/env ts-node

/**
 *
 */

import { getProject } from '../utils'

;
(async () => {
  const project = getProject()
  const diagnostics = project.getPreEmitDiagnostics()
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))
  await project.save()
})().catch(console.error)
