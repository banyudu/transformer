#!/usr/bin/env ts-node

/**
  * Convert
  *   shallow_cmp = mkshallow({
  *     value: 'eq'
  *   })
  *
  * to
  * shallow_cmp_props = { value: 'eq' }
 */

import { getProject, getImportDeclaration } from '../utils'
import { CallExpression, SourceFile } from 'ts-morph'

const limit = 1
let count = 0

;(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  const utilsFile = project.getSourceFile(file => file.getFilePath().includes('lib/utils.ts')) as SourceFile
  for (const file of files) {
    let parsed = false
    const utilsImportDeclaration = getImportDeclaration(file, utilsFile)
    const classes = file.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const prop of properties) {
        if (prop.getName() === 'shallow_cmp') {
          const initializer = prop.getInitializer()
          if (initializer instanceof CallExpression) {
            const funcName = initializer.getChildren()[0].getText()
            const params = initializer.getChildren()[2].getText()
            if (funcName === 'mkshallow') {
              prop.replaceWithText(`shallow_cmp_props = ${params}`)
              const utilsNames = utilsImportDeclaration?.getNamedImports().map(item => item.getName()).filter(item => item !== 'mkshallow')
              utilsImportDeclaration?.removeNamedImports()
              utilsImportDeclaration?.addNamedImports(utilsNames as string[])
              count++
              parsed = true
            }
          }
        }
      }
    }
    if (parsed) {
      console.log('parsed file: ', file.getFilePath())
    }
    if (count >= limit) {
      break
    }
  }

  await project.save()
})().catch(console.error)
