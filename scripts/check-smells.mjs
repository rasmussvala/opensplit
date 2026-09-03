#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"
import process from "node:process"
import ts from "typescript"

const root = resolve(import.meta.dirname, "..")
const sourceRoots = [resolve(root, "src")]
const ignored = new Set([".test.ts", ".test.tsx"])
const limits = {
  functionLines: 80,
  complexity: 15,
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      if (entry.isFile() && /\.tsx?$/.test(entry.name)) return [path]
      return []
    }),
  )
  return nested.flat()
}

const files = (await Promise.all(sourceRoots.map(sourceFiles))).flat()

const findings = []
const sourceByPath = new Map()

function lineOf(sourceFile, position) {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1
}

function addFinding(sourceFile, node, rule, message) {
  findings.push({
    file: relative(root, sourceFile.fileName),
    line: lineOf(sourceFile, node.getStart(sourceFile)),
    rule,
    message,
  })
}

function complexity(node) {
  let result = 1
  function visit(child) {
    if (child !== node && (ts.isFunctionLike(child) || ts.isClassLike(child)))
      return
    if (
      ts.isIfStatement(child) ||
      ts.isForStatement(child) ||
      ts.isForInStatement(child) ||
      ts.isForOfStatement(child) ||
      ts.isWhileStatement(child) ||
      ts.isDoStatement(child) ||
      ts.isCatchClause(child) ||
      ts.isConditionalExpression(child) ||
      ts.isCaseClause(child)
    )
      result += 1
    if (
      ts.isBinaryExpression(child) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(child.operatorToken.kind)
    )
      result += 1
    ts.forEachChild(child, visit)
  }
  ts.forEachChild(node, visit)
  return result
}

for (const file of files) {
  if ([...ignored].some((suffix) => file.endsWith(suffix))) continue
  const text = await readFile(file, "utf8")
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  sourceByPath.set(file, sourceFile)
  function visit(node) {
    if (ts.isFunctionLike(node) && node.body) {
      const lines =
        lineOf(sourceFile, node.body.end) - lineOf(sourceFile, node.body.pos)
      if (lines > limits.functionLines)
        addFinding(
          sourceFile,
          node,
          "function-size",
          `Function body is ${lines} lines (limit: ${limits.functionLines})`,
        )
      const score = complexity(node)
      if (score > limits.complexity)
        addFinding(
          sourceFile,
          node,
          "complexity",
          `Function complexity is ${score} (limit: ${limits.complexity})`,
        )
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

const imports = new Map()
for (const file of files) {
  if ([...ignored].some((suffix) => file.endsWith(suffix))) continue
  const sourceFile = sourceByPath.get(file)
  const dependencies = []
  ts.forEachChild(sourceFile, (node) => {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier)
    )
      return
    if (!node.moduleSpecifier.text.startsWith(".")) return
    const resolved = resolve(dirname(file), node.moduleSpecifier.text)
    dependencies.push(resolved)
  })
  imports.set(file, dependencies)
}

const visited = new Set()
const active = new Set()
function visitImports(file, path = []) {
  if (active.has(file)) {
    const cycle = [...path.slice(path.indexOf(file)), file]
    addFinding(
      sourceByPath.get(file),
      sourceByPath.get(file),
      "import-cycle",
      `Circular import: ${cycle.map((item) => relative(root, item)).join(" -> ")}`,
    )
    return
  }
  if (visited.has(file)) return
  visited.add(file)
  active.add(file)
  for (const dependency of imports.get(file) ?? []) {
    const resolved = awaitableModule(dependency)
    if (resolved) visitImports(resolved, [...path, file])
  }
  active.delete(file)
}

function awaitableModule(path) {
  return [
    path,
    `${path}.ts`,
    `${path}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ].find((candidate) => sourceByPath.has(candidate))
}

for (const file of imports.keys()) visitImports(file)

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
for (const finding of findings) {
  console.log(
    `::error file=${finding.file},line=${finding.line},title=${finding.rule}::${finding.message}`,
  )
}
console.log(
  `Smell check: ${findings.length} finding${findings.length === 1 ? "" : "s"}`,
)
process.exitCode = findings.length > 0 ? 1 : 0
