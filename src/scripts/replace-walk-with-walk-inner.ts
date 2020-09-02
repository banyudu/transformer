#!/usr/bin/env ts-node

/**
  * replace walk function with walkInner, remove duplicate content
  *
  * convert
  * _walk (visitor: TreeWalker) {
    return visitor._visit(this, () => {
      this.segments.forEach(function (seg) {
        seg._walk(visitor)
      })
    })
  }

  * to

  walkInner = (visitor: TreeWalker) => {
    this.segments.forEach(function (seg) {
      seg._walk(visitor)
    })
  }
 */

import { getProject, walk } from '../utils'
import { MethodDeclaration, ArrowFunction } from 'ts-morph'

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()
  for (const file of files) {
    const classes = file.getClasses()
    for (const cls of classes) {
      if (cls.getName()?.startsWith('AST_') !== true) {
        continue
      }
      const _walk = cls.getMember('_walk') as MethodDeclaration
      if (_walk !== undefined) {
        let replaceMent = ''
        walk(_walk, (node) => {
          if (node instanceof ArrowFunction) {
            replaceMent = `walkInner = (visitor: TreeWalker) => {\n${node.getBodyText() ?? ''}\n}`
            return false
          }
          return true
        })
        if (replaceMent.length > 0) {
          try {
            _walk.replaceWithText(replaceMent)
          } catch (error) {
            console.warn('replace failed: ', replaceMent)
          }
        }
        // const walkInnerText = `walkInner () ${funcBody?.getText() ?? '{}'}`
        // console.log(walkInnerText)
        // _walk.replaceWithText(walkInnerText)
      }
    }
  }

  await project.save()
})().catch(console.error)
