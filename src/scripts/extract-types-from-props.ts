#!/usr/bin/env ts-node

/**
  * extract types from propdoc, then set types for these properties
  * static propdoc = {
  *   key: '[string|AST_Node] property name. For ObjectKeyVal this is a string. For getters, setters and computed property this is an AST_Node.',
  *   value: '[AST_Node] property value.  For getters and setters this is an AST_Accessor.'
  * }
 */

import { getProject, getImportDeclaration, camelToSnakeCase } from '../utils'
import { SyntaxKind } from 'ts-morph'

const REGEX_PROP = /^(\w+):\s+['"]\[([^\]]+)\]/

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    for (const cls of classes) {
      const clsName = cls.getName()
      if (clsName?.startsWith('AST_') !== true) {
        continue
      }
      // const staticMembers = cls.getStaticMembers()
      const propDocObj = cls.getStaticProperty('propdoc')?.getLastChildByKind(SyntaxKind.ObjectLiteralExpression)
      if (propDocObj !== undefined) {
        for (const prop of propDocObj.getProperties()) {
          const match = prop.getText().match(REGEX_PROP)
          if (match !== null) {
            const name = match[1]
            let type = match[2]
            if (type.includes('?')) {
              type = type.replace(/\?/g, '') + ' | undefined'
            }
            if (type.includes('*')) {
              type = `Array<${type.replace(/\*/g, '')}>`
            }
            if (type === 'Map') {
              type = 'Map<any, any>'
            }
            const clsProp = cls.getProperty(name)
            if (clsProp?.getType().isAny() === true) {
              clsProp.setType(type)
              type.split('|').forEach(subType => {
                if (subType.startsWith('AST_')) {
                  // auto add import sentence if type is AST_XXX
                  const baseName = camelToSnakeCase(subType.substr('AST_'.length)).substr(1).replace(/_/g, '-')
                  const typeFile = project.getSourceFile(file => file.getFilePath().includes(`lib/ast/${baseName}.ts`))
                  if (typeFile !== undefined) {
                    const decl = getImportDeclaration(file, typeFile, true)
                    decl?.setDefaultImport(subType)
                  }
                }
              })
            }
          }
        }
      }
    }
    file.fixMissingImports()
  }

  await project.save()
})().catch(console.error)
