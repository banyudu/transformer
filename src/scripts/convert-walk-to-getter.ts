#!/usr/bin/env ts-node

/**
  * Convert
  * walkInner = (visitor: TreeWalker) => {
    if (this.name) {
      this.name.walk(visitor)
    }
    if (this.extends) {
      this.extends.walk(visitor)
    }
    this.properties.forEach((prop) => prop.walk(visitor))
  }
  *
  * To
  * walkInner = () => {
  * const result: AST_Node[] = []
    if (this.name) {
      result.push(this.name)
    }
    if (this.extends) {
      result.push(this.extends)
    }
    this.properties.forEach((prop) => result.push(prop))
    return result
  }

 */

import { getProject, walk } from '../utils'
import { ArrowFunction, CallExpression, PropertyDeclaration } from 'ts-morph'

const suffix = '.walk(visitor)'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    for (const cls of classes) {
      const prop: PropertyDeclaration | undefined = cls.getProperty(
        node => node.getName() === 'walkInner' && node.getInitializer() instanceof ArrowFunction
      )
      const initializer = prop?.getInitializer() as any as ArrowFunction

      // save replacements into a map instead of replace it immediately, otherwise only the first one can be replaced
      const replaceMap: Map<CallExpression, string> = new Map()
      walk(initializer, (node) => {
        if (node instanceof CallExpression) {
          let text = node.getText()
          if (text.endsWith(suffix)) {
            text = text.substr(0, text.length - suffix.length)
            if (text.endsWith('?')) {
              text = text.substr(0, text.length - 1)
            }
            replaceMap.set(node, `result.push(${text})`)
          } else if (text === 'walk_body(this, visitor)') {
            replaceMap.set(node, 'result.push(...this.body)')
          }
        }
        return true
      })
      initializer?.insertStatements(0, 'const result = []')
      initializer?.addStatements('return result')
      replaceMap.forEach((v: string, k: CallExpression) => {
        k.replaceWithText(v)
      })
      initializer?.getParameter('visitor')?.remove()
    }
  }

  await project.save()
})().catch(console.error)
