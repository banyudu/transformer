#!/usr/bin/env ts-node

/**
 * Show errors in ts project
 */

import { getProject, argv } from '../utils'

;
(async () => {
  const project = getProject()
  let diagnostics = project.getPreEmitDiagnostics()
  const filterCode = Number(argv.filter)
  if (filterCode > 0) {
    diagnostics = diagnostics.filter(item => item.getCode() === filterCode)
  }
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))
  console.log('Summary: ')
  const summary = diagnostics.reduce((res: any, item) => {
    const code = item.getCode()
    res[code] = res[code] ?? 0
    res[code] = res[code] as number + 1
    return res
  }, {})
  const keys = Object.keys(summary).sort((a, b) => summary[a] - summary[b])
  for (const key of keys) {
    console.log(`TS${key}: ${summary[key] as number}`)
  }
  await project.save()
})().catch(console.error)
