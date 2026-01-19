/**
 * Contract Verifier Tool
 *
 * Validates contract files (markdown format) for consistency, proper imports,
 * type shape compatibility, and naming conventions.
 *
 * Usage as module:
 *   import { verifyContracts } from '@joel5326/contract-first-parallel-dev';
 *   const report = await verifyContracts('./primitives.md', ['./contracts/*.md']);
 *
 * Usage via CLI:
 *   cfpd verify --primitives ./shared.types.ts --contracts ./contracts/*.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ImportInfo {
  name: string;
  source: string;
  line: number;
}

export interface TypeDefinition {
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'const';
  properties: PropertyInfo[];
  rawContent: string;
  line: number;
}

export interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
}

export interface ServiceMethod {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  line: number;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
}

export interface ApiRoute {
  method: string;
  path: string;
  requestType?: string;
  responseType?: string;
  line: number;
}

export interface ParsedContract {
  filePath: string;
  name: string;
  imports: ImportInfo[];
  types: TypeDefinition[];
  serviceMethods: ServiceMethod[];
  apiRoutes: ApiRoute[];
}

export interface VerificationIssue {
  severity: 'error' | 'warning';
  category: 'import' | 'naming' | 'type-shape' | 'circular-dep';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface DependencyNode {
  name: string;
  dependencies: string[];
}

export interface VerificationReport {
  timestamp: Date;
  primitivesFile: string;
  contractFiles: string[];
  issues: VerificationIssue[];
  stats: {
    totalContracts: number;
    totalTypes: number;
    totalImports: number;
    totalServiceMethods: number;
    totalApiRoutes: number;
  };
  dependencyGraph: DependencyNode[];
  passed: boolean;
}

export interface SharedPrimitives {
  types: Map<string, TypeDefinition>;
  filePath: string;
}

// ============================================================================
// Levenshtein Distance for Fuzzy Matching
// ============================================================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function findSimilarNames(names: string[], threshold: number = 0.8): Array<[string, string, number]> {
  const similar: Array<[string, string, number]> = [];
  const seenPairs = new Set<string>();
  const uniqueNames = [...new Set(names)];

  for (let i = 0; i < uniqueNames.length; i++) {
    for (let j = i + 1; j < uniqueNames.length; j++) {
      const name1 = uniqueNames[i];
      const name2 = uniqueNames[j];

      if (name1 === name2) continue;

      const pairKey = [name1, name2].sort().join('|');
      if (seenPairs.has(pairKey)) continue;

      const ratio = similarityRatio(name1.toLowerCase(), name2.toLowerCase());
      if (ratio >= threshold && ratio < 1) {
        similar.push([name1, name2, ratio]);
        seenPairs.add(pairKey);
      }
    }
  }

  return similar;
}

// ============================================================================
// Graph Cycle Detection
// ============================================================================

type Graph = Map<string, string[]>;

function detectCycles(graph: Graph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor);
          cycles.push(cycle);
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

// ============================================================================
// Contract Parser
// ============================================================================

export function parseContract(filePath: string): ParsedContract {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const contract: ParsedContract = {
    filePath,
    name: extractContractName(content, filePath),
    imports: [],
    types: [],
    serviceMethods: [],
    apiRoutes: []
  };

  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.trim().startsWith('```typescript') || line.trim().startsWith('```ts')) {
      inCodeBlock = true;
      codeBlockContent = '';
      codeBlockStartLine = lineNum;
      continue;
    }

    if (line.trim() === '```' && inCodeBlock) {
      inCodeBlock = false;

      const imports = extractImports(codeBlockContent, codeBlockStartLine);
      contract.imports.push(...imports);

      const types = extractTypes(codeBlockContent, codeBlockStartLine);
      contract.types.push(...types);

      const methods = extractServiceMethods(codeBlockContent, codeBlockStartLine);
      contract.serviceMethods.push(...methods);

      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
    }

    const apiRoute = extractApiRoute(line, lineNum);
    if (apiRoute) {
      contract.apiRoutes.push(apiRoute);
    }
  }

  return contract;
}

function extractContractName(content: string, filePath: string): string {
  const titleMatch = content.match(/^#\s+(.+?)(?:\s+Contract)?$/m);
  if (titleMatch) {
    return titleMatch[1].replace(/\s+Domain$/, '').trim();
  }

  const basename = path.basename(filePath, '.md');
  return basename.replace(/-CONTRACT$/i, '').replace(/-/g, ' ');
}

function extractImports(code: string, startLine: number): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/gs;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const source = match[2];
    const beforeMatch = code.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    let importContent = match[1]
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const importedItems = importContent
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/\s+/g, ' '))
      .filter(s => /^[a-zA-Z_$][a-zA-Z0-9_$]*/.test(s));

    for (const name of importedItems) {
      const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
      if (cleanName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanName)) {
        imports.push({
          name: cleanName,
          source,
          line: startLine + lineOffset
        });
      }
    }
  }

  return imports;
}

function extractTypes(code: string, startLine: number): TypeDefinition[] {
  const types: TypeDefinition[] = [];

  // Extract interfaces
  const interfaceRegex = /export\s+interface\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;
  while ((match = interfaceRegex.exec(code)) !== null) {
    const beforeMatch = code.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    types.push({
      name: match[1],
      kind: 'interface',
      properties: extractProperties(match[2]),
      rawContent: match[0],
      line: startLine + lineOffset
    });
  }

  // Extract type aliases
  const typeRegex = /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;
  while ((match = typeRegex.exec(code)) !== null) {
    const beforeMatch = code.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    types.push({
      name: match[1],
      kind: 'type',
      properties: [],
      rawContent: match[0],
      line: startLine + lineOffset
    });
  }

  // Extract enums
  const enumRegex = /export\s+enum\s+(\w+)\s*\{([^}]+)\}/g;
  while ((match = enumRegex.exec(code)) !== null) {
    const beforeMatch = code.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    const enumValues = match[2].split(',').map(v => {
      const parts = v.trim().split('=');
      return { name: parts[0].trim(), type: 'enum-value', optional: false };
    }).filter(v => v.name);

    types.push({
      name: match[1],
      kind: 'enum',
      properties: enumValues,
      rawContent: match[0],
      line: startLine + lineOffset
    });
  }

  // Extract const declarations
  const constRegex = /export\s+const\s+(\w+)\s*=\s*\{/g;
  while ((match = constRegex.exec(code)) !== null) {
    const beforeMatch = code.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    types.push({
      name: match[1],
      kind: 'const',
      properties: [],
      rawContent: match[0],
      line: startLine + lineOffset
    });
  }

  return types;
}

function extractProperties(body: string): PropertyInfo[] {
  const properties: PropertyInfo[] = [];
  const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;

  let match;
  while ((match = propRegex.exec(body)) !== null) {
    properties.push({
      name: match[1],
      type: match[3].trim(),
      optional: match[2] === '?'
    });
  }

  return properties;
}

function extractServiceMethods(code: string, startLine: number): ServiceMethod[] {
  const methods: ServiceMethod[] = [];

  const interfaceMatch = code.match(/export\s+interface\s+I\w+Service\s*\{([^]*?)\n\}/);
  if (!interfaceMatch) return methods;

  const body = interfaceMatch[1];
  const methodRegex = /(\w+)\s*\(([^)]*)\)\s*:\s*([^;]+);/g;

  let match;
  while ((match = methodRegex.exec(body)) !== null) {
    const beforeMatch = body.substring(0, match.index);
    const lineOffset = (beforeMatch.match(/\n/g) || []).length;

    methods.push({
      name: match[1],
      parameters: extractParameters(match[2]),
      returnType: match[3].trim(),
      line: startLine + lineOffset
    });
  }

  return methods;
}

function extractParameters(paramsStr: string): ParameterInfo[] {
  if (!paramsStr.trim()) return [];

  const params: ParameterInfo[] = [];
  const paramRegex = /(\w+)(\?)?:\s*([^,]+)/g;

  let match;
  while ((match = paramRegex.exec(paramsStr)) !== null) {
    params.push({
      name: match[1],
      type: match[3].trim(),
      optional: match[2] === '?'
    });
  }

  return params;
}

function extractApiRoute(line: string, lineNum: number): ApiRoute | null {
  const routeMatch = line.match(/^###\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/);
  if (!routeMatch) return null;

  return {
    method: routeMatch[1],
    path: routeMatch[2],
    line: lineNum
  };
}

// ============================================================================
// Shared Primitives Parser
// ============================================================================

export function parseSharedPrimitives(filePath: string): SharedPrimitives {
  const content = fs.readFileSync(filePath, 'utf-8');
  const types = new Map<string, TypeDefinition>();

  if (filePath.endsWith('.md')) {
    const contract = parseContract(filePath);
    for (const type of contract.types) {
      types.set(type.name, type);
    }
  } else {
    const extractedTypes = extractTypes(content, 1);
    for (const type of extractedTypes) {
      types.set(type.name, type);
    }
  }

  return { types, filePath };
}

// ============================================================================
// Verification Logic
// ============================================================================

function checkImportResolution(
  contracts: ParsedContract[],
  primitives: SharedPrimitives
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const availableTypes = new Map<string, string>(
    Array.from(primitives.types.keys()).map(k => [k, primitives.filePath])
  );

  for (const contract of contracts) {
    for (const type of contract.types) {
      availableTypes.set(type.name, contract.filePath);
    }
  }

  const externalLibraries = new Set(['zod', 'express', 'prisma', '@prisma/client', 'date-fns', 'lodash']);

  for (const contract of contracts) {
    for (const imp of contract.imports) {
      if (externalLibraries.has(imp.source) || imp.source.startsWith('@')) {
        continue;
      }

      if (imp.source.startsWith('.') && !imp.source.includes('shared')) {
        continue;
      }

      if (availableTypes.has(imp.name)) {
        continue;
      }

      issues.push({
        severity: 'error',
        category: 'import',
        message: `Unresolved import: '${imp.name}' from '${imp.source}'`,
        file: contract.filePath,
        line: imp.line,
        suggestion: `Ensure '${imp.name}' is defined in shared primitives or another contract`
      });
    }
  }

  return issues;
}

function checkCircularDependencies(contracts: ParsedContract[]): {
  graph: DependencyNode[];
  issues: VerificationIssue[];
} {
  const graph: Graph = new Map();
  const nodes: DependencyNode[] = [];

  for (const contract of contracts) {
    const deps: string[] = [];

    for (const imp of contract.imports) {
      for (const other of contracts) {
        if (other.filePath === contract.filePath) continue;

        const providesType = other.types.some(t => t.name === imp.name);
        if (providesType) {
          const otherName = path.basename(other.filePath);
          if (!deps.includes(otherName)) {
            deps.push(otherName);
          }
        }
      }
    }

    const contractName = path.basename(contract.filePath);
    graph.set(contractName, deps);
    nodes.push({ name: contractName, dependencies: deps });
  }

  const cycles = detectCycles(graph);
  const issues: VerificationIssue[] = [];

  for (const cycle of cycles) {
    issues.push({
      severity: 'error',
      category: 'circular-dep',
      message: `Circular dependency detected: ${cycle.join(' -> ')}`,
      file: cycle[0],
      suggestion: 'Refactor to break the circular dependency, possibly by extracting shared types to primitives'
    });
  }

  return { graph: nodes, issues };
}

function checkNamingConsistency(
  contracts: ParsedContract[],
  primitives: SharedPrimitives
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const allTypeNames: Array<{ name: string; file: string; line: number }> = [];

  for (const [name, type] of primitives.types) {
    allTypeNames.push({ name, file: primitives.filePath, line: type.line });
  }

  for (const contract of contracts) {
    for (const type of contract.types) {
      allTypeNames.push({ name: type.name, file: contract.filePath, line: type.line });
    }
  }

  const names = allTypeNames.map(t => t.name);
  const similar = findSimilarNames(names, 0.85);

  const expectedPatternPairs: Array<[RegExp, RegExp]> = [
    [/^Create\w+Input$/, /^Update\w+Input$/],
    [/^Create\w+Request$/, /^Update\w+Request$/],
    [/^Create\w+Response$/, /^Update\w+Response$/],
    [/^\w+Id$/, /^\w+Ref$/],
    [/^\w+Id$/, /^\w+Id$/],
    [/^\w+Ref$/, /^\w+Ref$/],
    [/^\w+Score$/, /^\w+Scores$/],
    [/^I\w+Service$/, /^I\w+Repository$/],
  ];

  const isExpectedPair = (n1: string, n2: string): boolean => {
    for (const [pattern1, pattern2] of expectedPatternPairs) {
      if ((pattern1.test(n1) && pattern2.test(n2)) ||
          (pattern2.test(n1) && pattern1.test(n2))) {
        return true;
      }
    }

    const base1 = n1.replace(/(Id|Ref|Input|Output|Request|Response|Type|Status|Score|Scores)$/, '');
    const base2 = n2.replace(/(Id|Ref|Input|Output|Request|Response|Type|Status|Score|Scores)$/, '');
    if (base1 === base2) return true;

    return false;
  };

  for (const [name1, name2, ratio] of similar) {
    if (isExpectedPair(name1, name2)) continue;

    const type1 = allTypeNames.find(t => t.name === name1)!;
    const type2 = allTypeNames.find(t => t.name === name2)!;

    issues.push({
      severity: 'warning',
      category: 'naming',
      message: `Similar names detected: '${name1}' and '${name2}' (${Math.round(ratio * 100)}% similar)`,
      file: type1.file,
      line: type1.line,
      suggestion: `Consider standardizing to one name. Found in: ${type1.file} and ${type2.file}`
    });
  }

  const warnedRefTypes = new Set<string>();

  for (const contract of contracts) {
    for (const type of contract.types) {
      if (type.name.endsWith('Ref') && type.kind === 'interface') {
        if (warnedRefTypes.has(type.name)) continue;

        const entityName = type.name.replace(/Ref$/, '');
        const hasFullEntity = allTypeNames.some(t => t.name === entityName);
        const inPrimitives = primitives.types.has(entityName);

        if (!hasFullEntity && !inPrimitives) {
          issues.push({
            severity: 'warning',
            category: 'naming',
            message: `Reference type '${type.name}' has no corresponding full entity '${entityName}'`,
            file: contract.filePath,
            line: type.line,
            suggestion: `Consider defining '${entityName}' or renaming if this is not a reference type`
          });
          warnedRefTypes.add(type.name);
        }
      }
    }
  }

  return issues;
}

function checkTypeShapeCompatibility(
  contracts: ParsedContract[],
  primitives: SharedPrimitives
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const typesByName = new Map<string, Array<{ type: TypeDefinition; file: string }>>();

  for (const [name, type] of primitives.types) {
    typesByName.set(name, [{ type, file: primitives.filePath }]);
  }

  for (const contract of contracts) {
    for (const type of contract.types) {
      if (!typesByName.has(type.name)) {
        typesByName.set(type.name, []);
      }
      typesByName.get(type.name)!.push({ type, file: contract.filePath });
    }
  }

  for (const [name, definitions] of typesByName) {
    if (definitions.length <= 1) continue;

    const interfaces = definitions.filter(d => d.type.kind === 'interface');
    if (interfaces.length > 1) {
      const baseline = interfaces[0];
      const baselineProps = new Map(
        baseline.type.properties.map(p => [p.name, p])
      );

      for (let i = 1; i < interfaces.length; i++) {
        const current = interfaces[i];
        const currentProps = new Map(
          current.type.properties.map(p => [p.name, p])
        );

        for (const [propName, prop] of baselineProps) {
          if (!currentProps.has(propName)) {
            issues.push({
              severity: 'error',
              category: 'type-shape',
              message: `Type '${name}' is missing property '${propName}' in ${current.file}`,
              file: current.file,
              line: current.type.line,
              suggestion: `Add property '${propName}: ${prop.type}' to match ${baseline.file}`
            });
          }
        }

        for (const [propName, prop] of currentProps) {
          const baseProp = baselineProps.get(propName);
          if (baseProp && baseProp.type !== prop.type) {
            if (!areTypesCompatible(baseProp.type, prop.type)) {
              issues.push({
                severity: 'error',
                category: 'type-shape',
                message: `Type mismatch for '${name}.${propName}': '${baseProp.type}' in ${baseline.file} vs '${prop.type}' in ${current.file}`,
                file: current.file,
                line: current.type.line,
                suggestion: `Ensure '${propName}' has consistent type across all definitions`
              });
            }
          }

          if (baseProp && baseProp.optional !== prop.optional) {
            issues.push({
              severity: 'warning',
              category: 'type-shape',
              message: `Optionality mismatch for '${name}.${propName}': ${baseProp.optional ? 'optional' : 'required'} in ${baseline.file} vs ${prop.optional ? 'optional' : 'required'} in ${current.file}`,
              file: current.file,
              line: current.type.line,
              suggestion: `Ensure '${propName}' has consistent optionality`
            });
          }
        }
      }
    }
  }

  for (const contract of contracts) {
    for (const imp of contract.imports) {
      const localDef = contract.types.find(t => t.name === imp.name);
      const primitiveDef = primitives.types.get(imp.name);

      if (localDef && primitiveDef) {
        if (localDef.kind !== primitiveDef.kind) {
          issues.push({
            severity: 'error',
            category: 'type-shape',
            message: `Import '${imp.name}' is redefined as ${localDef.kind} but primitives defines it as ${primitiveDef.kind}`,
            file: contract.filePath,
            line: localDef.line,
            suggestion: `Remove local definition and use the imported type, or rename to avoid conflict`
          });
        }
      }
    }
  }

  return issues;
}

function areTypesCompatible(type1: string, type2: string): boolean {
  const normalize = (t: string) => t.toLowerCase().replace(/\s+/g, '');

  if (normalize(type1) === normalize(type2)) return true;

  const equivalences: Array<[string, string]> = [
    ['string', 'String'],
    ['number', 'Number'],
    ['boolean', 'Boolean'],
    ['Date', 'string'],
  ];

  for (const [a, b] of equivalences) {
    if ((type1 === a && type2 === b) || (type1 === b && type2 === a)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Report Generation
// ============================================================================

export function generateReport(
  primitives: SharedPrimitives,
  contracts: ParsedContract[],
  issues: VerificationIssue[],
  dependencyGraph: DependencyNode[]
): VerificationReport {
  const errorCount = issues.filter(i => i.severity === 'error').length;

  return {
    timestamp: new Date(),
    primitivesFile: primitives.filePath,
    contractFiles: contracts.map(c => c.filePath),
    issues,
    stats: {
      totalContracts: contracts.length,
      totalTypes: contracts.reduce((sum, c) => sum + c.types.length, 0) + primitives.types.size,
      totalImports: contracts.reduce((sum, c) => sum + c.imports.length, 0),
      totalServiceMethods: contracts.reduce((sum, c) => sum + c.serviceMethods.length, 0),
      totalApiRoutes: contracts.reduce((sum, c) => sum + c.apiRoutes.length, 0)
    },
    dependencyGraph,
    passed: errorCount === 0
  };
}

export function formatReport(report: VerificationReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(80));
  lines.push('CONTRACT VERIFICATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
  lines.push(`Primitives File: ${report.primitivesFile}`);
  lines.push(`Contracts Analyzed: ${report.contractFiles.length}`);
  lines.push('');

  lines.push('-'.repeat(40));
  lines.push('STATISTICS');
  lines.push('-'.repeat(40));
  lines.push(`Total Contracts: ${report.stats.totalContracts}`);
  lines.push(`Total Types: ${report.stats.totalTypes}`);
  lines.push(`Total Imports: ${report.stats.totalImports}`);
  lines.push(`Total Service Methods: ${report.stats.totalServiceMethods}`);
  lines.push(`Total API Routes: ${report.stats.totalApiRoutes}`);
  lines.push('');

  lines.push('-'.repeat(40));
  lines.push('DEPENDENCY GRAPH');
  lines.push('-'.repeat(40));
  for (const node of report.dependencyGraph) {
    if (node.dependencies.length > 0) {
      lines.push(`${node.name} -> [${node.dependencies.join(', ')}]`);
    } else {
      lines.push(`${node.name} (no dependencies)`);
    }
  }
  lines.push('');

  const errors = report.issues.filter(i => i.severity === 'error');
  const warnings = report.issues.filter(i => i.severity === 'warning');

  lines.push('-'.repeat(40));
  lines.push(`ISSUES (${errors.length} errors, ${warnings.length} warnings)`);
  lines.push('-'.repeat(40));

  if (errors.length > 0) {
    lines.push('');
    lines.push('ERRORS:');
    for (const issue of errors) {
      lines.push(`  [${issue.category.toUpperCase()}] ${issue.message}`);
      lines.push(`    File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      if (issue.suggestion) {
        lines.push(`    Suggestion: ${issue.suggestion}`);
      }
      lines.push('');
    }
  }

  if (warnings.length > 0) {
    lines.push('');
    lines.push('WARNINGS:');
    for (const issue of warnings) {
      lines.push(`  [${issue.category.toUpperCase()}] ${issue.message}`);
      lines.push(`    File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      if (issue.suggestion) {
        lines.push(`    Suggestion: ${issue.suggestion}`);
      }
      lines.push('');
    }
  }

  if (report.issues.length === 0) {
    lines.push('No issues found!');
    lines.push('');
  }

  lines.push('='.repeat(80));
  if (report.passed) {
    lines.push('RESULT: PASS');
  } else {
    lines.push('RESULT: FAIL');
  }
  lines.push('='.repeat(80));
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Main Verification Function (API)
// ============================================================================

export interface VerifyContractsOptions {
  primitivesPath: string;
  contractPaths: string[];
  verbose?: boolean;
}

export function verifyContracts(options: VerifyContractsOptions): VerificationReport {
  const { primitivesPath, contractPaths } = options;

  // Parse primitives
  const primitives = parseSharedPrimitives(primitivesPath);

  // Parse contracts
  const contracts: ParsedContract[] = [];
  for (const contractPath of contractPaths) {
    contracts.push(parseContract(contractPath));
  }

  // Run verification checks
  const allIssues: VerificationIssue[] = [];

  allIssues.push(...checkImportResolution(contracts, primitives));
  const { graph, issues: circularIssues } = checkCircularDependencies(contracts);
  allIssues.push(...circularIssues);
  allIssues.push(...checkNamingConsistency(contracts, primitives));
  allIssues.push(...checkTypeShapeCompatibility(contracts, primitives));

  // Generate report
  return generateReport(primitives, contracts, allIssues, graph);
}
