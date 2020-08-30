
import { Project, SourceFile, Node, MethodDeclaration, FunctionDeclaration, ArrowFunction, ImportDeclaration, FunctionExpression, ClassDeclaration } from 'ts-morph'
import * as path from 'path'

import yargs = require('yargs')

const argv = yargs.options({
  c: { type: 'string', alias: 'config' }
}).argv

/**
 * get project from command line options
 */
export function getProject (): Project {
  // if tsconfig.json specified, use it
  if ((argv.c ?? '') !== '') {
    return new Project({
      tsConfigFilePath: argv.c
    })
  }
  // otherwise use arguments in argv as source files
  const project = new Project({ })
  argv._.forEach(srcPath => project.addSourceFileAtPath(srcPath))
  return project
}

/**
 * Recursively walk all child nodes of given node, include self
 * @param node root node
 * @param callback callback function, return false to stop walk
 */
export function walk (node: Node, callback: (node: Node) => boolean): boolean {
  return _walk(node, callback, new Set())
}

function _walk (node: Node, callback: (node: Node) => boolean, parsed: Set<Node>): boolean {
  try {
    if (parsed.has(node) || node.compilerNode === null) {
      return false
    }
    parsed.add(node)
  } catch (error) {
    return false
  }

  const children = node.getChildren()

  // visit root node
  if (!callback(node)) {
    return false
  }

  // visit children, depth-first-search
  for (let i = 0; i < children.length; i++) {
    if (!_walk(children[i], callback, parsed)) {
      return false
    }
  }
  return true
}

export function getFunctions (file: SourceFile): Array<MethodDeclaration | FunctionDeclaration | ArrowFunction | FunctionExpression> {
  const functions: Array<MethodDeclaration | FunctionDeclaration | ArrowFunction | FunctionExpression> = []
  walk(file, (node) => {
    const checklist: any[] = [node]
    if (Node.isPropertyDeclaration(node)) {
      checklist.push(node.getInitializer())
    }
    if (Node.isExportAssignment(node)) {
      checklist.push(node.getExpression())
    }
    if (Node.isMethodDeclaration(node)) {
      // console.log(node.getBody()?.getText())
      checklist.push(node.getBody())
    }
    for (const item of checklist) {
      if ((Node.isMethodDeclaration(item) || Node.isFunctionDeclaration(item) || Node.isArrowFunction(item) || Node.isFunctionExpression(node))) {
        functions.push(item)
      }
    }
    return true
  })
  return functions
}

export function getImportDeclaration (sourceFile: SourceFile, includeFile: SourceFile, createIfNotExists: boolean = false): ImportDeclaration | undefined {
  const arr = sourceFile.getImportDeclarations().filter(
    item => item.getModuleSpecifierSourceFile() === includeFile
  ) ?? []
  let result
  if (arr.length > 0) {
    result = arr[0]
  }

  if (result === undefined && createIfNotExists) {
    let relativePath = path.relative(path.dirname(sourceFile.getFilePath().toString()), includeFile.getFilePath().toString())
    relativePath = relativePath.substr(0, relativePath.length - path.extname(relativePath).length)
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath
    }
    result = sourceFile.insertImportDeclaration(0, { moduleSpecifier: relativePath, namedImports: [] })
  }
  return result as ImportDeclaration
}

export function camelToSnakeCase (str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export function getFiles (): SourceFile[] {
  return getProject().getSourceFiles()
}

export function getClasses (): ClassDeclaration[] {
  return getFiles().reduce((res: ClassDeclaration[], file) => [...res, ...(file.getClasses().filter(cls => cls.getName()?.startsWith('AST_')))], [])
}

export function getAstClasses (): ClassDeclaration[] {
  return getClasses().filter(cls => cls.getName()?.startsWith('AST_'))
}

export function inspectNode (data: any | any[]): void {
  if (!Array.isArray(data)) {
    data = [data]
  }
  data.forEach((item: any) => console.log(item.getText()))
}
