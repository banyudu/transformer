#!/usr/bin/env ts-node

/**
 * Add access modifiers(private/protected/public) to class methods
 */

import { getProject } from '../utils'
import { ClassDeclaration, MethodDeclaration, ModifierTexts, SyntaxKind } from 'ts-morph'

const hasAccessModifier = (func: MethodDeclaration): boolean => {
  return [SyntaxKind.PrivateKeyword, SyntaxKind.ProtectedKeyword, SyntaxKind.PublicKeyword].some(
    item => func.hasModifier(item)
  )
}

// const ACCESS_MODIFIERS: ModifierTexts[] = ['private', 'protected', 'public']
const TS_ERROR_PRIVATE = 2341
const TS_ERROR_PROTECTED = 2445
const TS_ERROR_INHERIT = 2416
const TS_ERROR_UNUSED = 6133

interface Info {
  funcName: string
  className: string | undefined
}
interface Stage {
  code: number
  modifier: ModifierTexts
  nextModifier: ModifierTexts
  getInfo: (msg: string) => Info
}

const getAccessErrorInfo = (msg: string): Info => {
  const REGEXP = /^Property '([^']+)' is.+within class '([^']+)'/
  const match = msg.match(REGEXP) ?? []
  return {
    funcName: String(match[1]),
    className: match[2]
  }
}

const getInheritErrorInfo = (msg: string): Info => {
  const REGEXP = /Types have separate declarations of a private property '([^']+)'/
  const match = msg.match(REGEXP) ?? []
  return {
    funcName: String(match[1]),
    className: undefined
  }
}

const getUnusedErrorInfo = (msg: string): Info => {
  const REGEXP = /'([^']+)' is declared but its value is never read./
  const match = msg.match(REGEXP) ?? []
  return {
    funcName: String(match[1]),
    className: undefined
  }
}

const FIX_STAGES: Stage[] = [
  { code: TS_ERROR_PRIVATE, modifier: 'private', nextModifier: 'protected', getInfo: getAccessErrorInfo },
  { code: TS_ERROR_INHERIT, modifier: 'private', nextModifier: 'protected', getInfo: getInheritErrorInfo },
  { code: TS_ERROR_UNUSED, modifier: 'private', nextModifier: 'protected', getInfo: getUnusedErrorInfo },
  { code: TS_ERROR_PROTECTED, modifier: 'protected', nextModifier: 'public', getInfo: getAccessErrorInfo }
]

;(async () => {
  const project = getProject()
  const name2Class: Map<string, ClassDeclaration> = new Map()
  const astClasses: ClassDeclaration[] = []
  // set private if has no access modifier
  const files = project.getSourceFiles()
  console.log('adding private access modifiers to functions')
  for (const file of files) {
    for (const cls of file.getClasses()) {
      const clsName = cls.getName()
      if (clsName === undefined) { // do not process anonymity classes
        continue
      }
      name2Class.set(clsName, cls)
      if (clsName.startsWith('AST_')) {
        astClasses.push(cls)
      }
      for (const func of cls.getMethods()) {
        if (!hasAccessModifier(func)) {
          func.toggleModifier('private', true)
        }
      }
    }
  }

  for (const stage of FIX_STAGES) {
    const toFix: Set<MethodDeclaration> = new Set()
    // convert private to protected if error
    for (const err of project.getPreEmitDiagnostics()) {
      // console.log(project.formatDiagnosticsWithColorAndContext([err]))
      if (err.getCode() === stage.code) {
        let msg = err.getMessageText()
        const oldMsg = msg
        while (typeof msg !== 'string') {
          const next = msg.getNext()?.[0]
          if (next !== undefined) {
            msg = next
          } else {
            msg = msg.getMessageText()
            break
          }
        }
        // if (stage.code === 2416 && typeof oldMsg !== 'string') {
        if (typeof oldMsg !== 'string') {
          // console.log(String(msg))
          // console.log(project.formatDiagnosticsWithColorAndContext([err]))
        }
        const { funcName, className } = stage.getInfo(String(msg))
        if (className === undefined || className.startsWith('AST')) {
          // change all ast classes
          for (const cls of astClasses) {
            const method = cls.getMethod(funcName)
            if (method !== undefined) {
              toFix.add(method)
            }
          }
        } else {
          let cls = name2Class.get(className)
          while (cls !== undefined) {
            const method = cls.getMethod(funcName)
            if (method !== undefined) {
              toFix.add(method)
              break
            }
            cls = cls.getBaseClass()
          }
        }
      }
    }
    toFix.forEach(method => {
      method.toggleModifier(stage.modifier, false)
      method.toggleModifier(stage.nextModifier, true)
    })
  }

  await project.save()
})().catch(console.error)
