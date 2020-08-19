
import { Project, SourceFile, Node, MethodDeclaration, FunctionDeclaration, ArrowFunction } from 'ts-morph'
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
  // visit root node
  if (!callback(node)) {
    return false
  }

  // visit children, depth-first-search
  for (let i = 0; i < node.getChildCount(); i++) {
    if (!walk(node.getChildAtIndex(i), callback)) {
      return false
    }
  }
  return true
}

export function getFunctions (file: SourceFile): Array<MethodDeclaration | FunctionDeclaration | ArrowFunction> {
  const functions: Array<MethodDeclaration | FunctionDeclaration | ArrowFunction> = []
  walk(file, (node) => {
    if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node) || Node.isArrowFunction(node)) {
      functions.push(node)
    }
    if (Node.isPropertyDeclaration(node)) {
      const initializer = node.getInitializer()
      if (Node.isMethodDeclaration(initializer) || Node.isFunctionDeclaration(initializer) || Node.isArrowFunction(initializer)) {
        functions.push(initializer)
      }
    }
    return true
  })
  return functions
}
