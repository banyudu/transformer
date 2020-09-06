#!/usr/bin/env ts-node

/**
 * Rename all functions and variables inside a function
 *
 * ===== from: =====
 * function foo () {
 *
 *  bar () {}
 *  var1 = 12
 * }
 *
 * ===== to: =====
 * function foo () {
 *
 *  this_bar () {}
 *  this_var1 = 12
 * }
 *
 *
 * To convert function to classes, variables usage will change from xxx to this.xxx
 * this script rename them to this_xxx, then replace this_xxx to this.xxx in editor
 */

import { getProject } from '../utils'

const filename = 'lib/parse.ts'
const funcName = 'tokenizer'
const prefix = 'this_'

;
(async () => {
  const project = getProject()
  const file = project.getSourceFile(file => file.getFilePath().endsWith(filename))
  const func = file?.getFunction(funcName)
  func?.getVariableDeclarations().forEach(item => item.rename(prefix + item.getName()))
  func?.getFunctions().forEach(item => item.rename(`${prefix}${item.getName() ?? ''}`))
  await project.save()
})().catch(console.error)
