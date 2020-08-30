#!/usr/bin/env ts-node

/**
  * Add types for constructor args in ast_xxx classes
 */

import { getProject, getAstClasses, walk } from '../utils'
import { PropertyAccessExpression, ClassDeclaration } from 'ts-morph'

const processed: Set<ClassDeclaration> = new Set()

async function processOneClass (cls: ClassDeclaration): Promise<undefined> {
  if (cls === undefined || processed.has(cls) || cls.getName()?.startsWith('AST_') !== true) {
    return
  }
  const file = cls.getSourceFile()
  processed.add(cls)
  const baseClass = cls.getBaseClass()
  if (baseClass !== undefined) {
    await processOneClass(baseClass)
  }
  const props: Array<{ name: string, type: string}> = []
  const propsInterface = file.addInterface({
    name: getClassPropsInterfaceName(cls),
    isExported: true,
    extends: baseClass === undefined ? undefined : [getClassPropsInterfaceName(baseClass)]
  })
  cls.getConstructors().forEach(ctor => {
    ctor.getParameter('args')?.replaceWithText(`args?: ${getClassPropsInterfaceName(cls)}`)
    walk(ctor, node => {
      if (node instanceof PropertyAccessExpression && node.getFirstChild()?.getText() === 'args') {
        const prop = node.getLastChild()?.getText()
        if (prop !== undefined) {
          const propDef = cls.getProperty(prop)?.getText()
          if (propDef !== undefined) {
            const arr = propDef.split(':').map(item => item.trim())
            props.push({
              name: prop,
              type: arr[1] + '| undefined'
            })
          } else {
            cls.insertProperty(0, { name: prop, type: 'any | undefined' })
            props.push({ name: prop, type: 'any | undefined' })
          }
        }
      }
      return true
    })
  })
  propsInterface.addProperties(props)
  file.fixMissingImports()
  await file.save()
}

function getClassPropsInterfaceName (cls: ClassDeclaration): string {
  return `${cls.getName() ?? ''}_Props`
}

;
(async () => {
  const project = getProject()
  const classes = getAstClasses()
  for (const cls of classes) {
    await processOneClass(cls)
  }

  await project.save()
})().catch(console.error)
