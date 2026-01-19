/**
 * Vocabulary Validator Tool
 *
 * Validates that a shared primitives file contains all expected
 * type definitions for a given set of domains.
 *
 * Usage as module:
 *   import { validateVocabulary } from '@joel5326/contract-first-parallel-dev';
 *   const result = validateVocabulary({ primitivesPath: './shared.types.ts', domains: ['User', 'Order'] });
 *
 * Usage via CLI:
 *   cfpd validate --primitives ./shared.types.ts --domains User,Order,Product
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// SCHEMA DEFINITION - What a complete vocabulary looks like
// ============================================================================

export interface VocabularySchema {
  idTypes: {
    pattern: RegExp;
    required: (domain: string) => string;
    description: string;
  };

  refInterfaces: {
    pattern: RegExp;
    required: (domain: string) => string;
    description: string;
  };

  stateEnums: {
    pattern: RegExp;
    required: (domain: string) => string[];
    description: string;
  };

  typeEnums: {
    pattern: RegExp;
    required: (domain: string) => string;
    description: string;
  };

  commonPatterns: {
    types: string[];
    interfaces: string[];
    enums: string[];
  };
}

export const DEFAULT_SCHEMA: VocabularySchema = {
  idTypes: {
    pattern: /type\s+(\w+Id)\s*=\s*string\s*&\s*\{\s*readonly\s+__brand:\s*['"](\w+)['"]\s*\}|type\s+(\w+Id)\s*=\s*string/,
    required: (domain: string) => `${domain}Id`,
    description: 'Branded ID type for entity identification'
  },

  refInterfaces: {
    pattern: /interface\s+(\w+Ref)\s*\{/,
    required: (domain: string) => `${domain}Ref`,
    description: 'Reference interface for cross-domain linking'
  },

  stateEnums: {
    pattern: /enum\s+(\w+(?:State|Status))\s*\{/,
    required: (domain: string) => [`${domain}State`, `${domain}Status`],
    description: 'State/Status enum for entity lifecycle'
  },

  typeEnums: {
    pattern: /enum\s+(\w+Type)\s*\{/,
    required: (domain: string) => `${domain}Type`,
    description: 'Type enum for entity categorization'
  },

  commonPatterns: {
    types: [
      'ApiResponse',
      'PaginatedResponse',
      'ISOTimestamp',
      'ISODate'
    ],
    interfaces: [
      'Timestamps',
      'PaginationParams'
    ],
    enums: []
  }
};

// ============================================================================
// PARSER - Extract definitions from primitives file
// ============================================================================

export interface ParsedVocabulary {
  types: Map<string, TypeDefinition>;
  interfaces: Map<string, InterfaceDefinition>;
  enums: Map<string, EnumDefinition>;
  constants: Map<string, ConstantDefinition>;
  rawContent: string;
  fileType: 'ts' | 'md';
}

export interface TypeDefinition {
  name: string;
  definition: string;
  line: number;
}

export interface InterfaceDefinition {
  name: string;
  properties: string[];
  extends?: string[];
  line: number;
}

export interface EnumDefinition {
  name: string;
  values: string[];
  line: number;
}

export interface ConstantDefinition {
  name: string;
  value: string;
  line: number;
}

export function parseVocabularyFile(filePath: string): ParsedVocabulary {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileType = filePath.endsWith('.md') ? 'md' : 'ts';

  const parsed: ParsedVocabulary = {
    types: new Map(),
    interfaces: new Map(),
    enums: new Map(),
    constants: new Map(),
    rawContent: content,
    fileType
  };

  if (fileType === 'md') {
    parseMarkdownFile(content, parsed);
  } else {
    parseTypeScriptFile(content, parsed);
  }

  return parsed;
}

function parseMarkdownFile(content: string, parsed: ParsedVocabulary): void {
  const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
  let match;
  let combinedCode = '';

  while ((match = codeBlockRegex.exec(content)) !== null) {
    combinedCode += match[1] + '\n';
  }

  parseTypeScriptFile(combinedCode, parsed);
}

function parseTypeScriptFile(content: string, parsed: ParsedVocabulary): void {
  const lines = content.split('\n');

  const typeRegex = /^(?:export\s+)?type\s+(\w+)\s*(?:<[^>]+>)?\s*=\s*(.+)/;
  const interfaceStartRegex = /^(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+([^{]+))?\s*\{/;
  const enumStartRegex = /^(?:export\s+)?enum\s+(\w+)\s*\{/;
  const constRegex = /^(?:export\s+)?const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(.+)/;

  let currentBlock: { type: 'interface' | 'enum'; name: string; content: string[]; line: number; extends?: string[] } | null = null;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (currentBlock) {
      currentBlock.content.push(line);
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount === 0) {
        if (currentBlock.type === 'interface') {
          const properties = extractInterfaceProperties(currentBlock.content.join('\n'));
          parsed.interfaces.set(currentBlock.name, {
            name: currentBlock.name,
            properties,
            extends: currentBlock.extends,
            line: currentBlock.line
          });
        } else if (currentBlock.type === 'enum') {
          const values = extractEnumValues(currentBlock.content.join('\n'));
          parsed.enums.set(currentBlock.name, {
            name: currentBlock.name,
            values,
            line: currentBlock.line
          });
        }
        currentBlock = null;
      }
      continue;
    }

    const typeMatch = line.match(typeRegex);
    if (typeMatch) {
      parsed.types.set(typeMatch[1], {
        name: typeMatch[1],
        definition: typeMatch[2].trim().replace(/;$/, ''),
        line: lineNum
      });
      continue;
    }

    const interfaceMatch = line.match(interfaceStartRegex);
    if (interfaceMatch) {
      const extendsClause = interfaceMatch[2];
      const extendsList = extendsClause
        ? extendsClause.split(',').map(e => e.trim())
        : undefined;

      currentBlock = {
        type: 'interface',
        name: interfaceMatch[1],
        content: [line],
        line: lineNum,
        extends: extendsList
      };
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      if (braceCount === 0) {
        const properties = extractInterfaceProperties(line);
        parsed.interfaces.set(interfaceMatch[1], {
          name: interfaceMatch[1],
          properties,
          extends: extendsList,
          line: lineNum
        });
        currentBlock = null;
      }
      continue;
    }

    const enumMatch = line.match(enumStartRegex);
    if (enumMatch) {
      currentBlock = {
        type: 'enum',
        name: enumMatch[1],
        content: [line],
        line: lineNum
      };
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      if (braceCount === 0) {
        const values = extractEnumValues(line);
        parsed.enums.set(enumMatch[1], {
          name: enumMatch[1],
          values,
          line: lineNum
        });
        currentBlock = null;
      }
      continue;
    }

    const constMatch = line.match(constRegex);
    if (constMatch) {
      parsed.constants.set(constMatch[1], {
        name: constMatch[1],
        value: constMatch[2].trim().replace(/;$/, ''),
        line: lineNum
      });
    }
  }
}

function extractInterfaceProperties(content: string): string[] {
  const properties: string[] = [];
  const propRegex = /(\w+)(?:\?)?:/g;
  let match;

  const bodyStart = content.indexOf('{');
  const body = content.slice(bodyStart);

  while ((match = propRegex.exec(body)) !== null) {
    properties.push(match[1]);
  }

  return properties;
}

function extractEnumValues(content: string): string[] {
  const values: string[] = [];
  const valueRegex = /(\w+)\s*(?:=|,|\})/g;
  let match;

  const bodyStart = content.indexOf('{');
  const body = content.slice(bodyStart);

  while ((match = valueRegex.exec(body)) !== null) {
    if (match[1] !== 'enum' && match[1] !== 'export') {
      values.push(match[1]);
    }
  }

  return values;
}

// ============================================================================
// VALIDATOR - Check completeness against schema
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  domains: DomainValidation[];
  commonPatterns: CommonPatternValidation;
  summary: ValidationSummary;
}

export interface DomainValidation {
  domain: string;
  idType: ItemValidation;
  refInterface: ItemValidation;
  stateEnum: ItemValidation;
  typeEnum: ItemValidation;
}

export interface ItemValidation {
  expected: string | string[];
  found: boolean;
  actual?: string;
  suggestion?: string;
}

export interface CommonPatternValidation {
  types: ItemValidation[];
  interfaces: ItemValidation[];
  enums: ItemValidation[];
}

export interface ValidationSummary {
  totalExpected: number;
  totalFound: number;
  missingItems: string[];
  coverage: number;
}

export function validateVocabularyContent(
  parsed: ParsedVocabulary,
  domains: string[],
  schema: VocabularySchema = DEFAULT_SCHEMA
): ValidationResult {
  const domainValidations: DomainValidation[] = [];
  const missingItems: string[] = [];
  let totalExpected = 0;
  let totalFound = 0;

  for (const domain of domains) {
    const domainValidation: DomainValidation = {
      domain,
      idType: validateIdType(parsed, domain, schema),
      refInterface: validateRefInterface(parsed, domain, schema),
      stateEnum: validateStateEnum(parsed, domain, schema),
      typeEnum: validateTypeEnum(parsed, domain, schema)
    };

    domainValidations.push(domainValidation);

    totalExpected += 4;
    if (domainValidation.idType.found) totalFound++;
    else missingItems.push(`${domain}Id`);

    if (domainValidation.refInterface.found) totalFound++;
    else missingItems.push(`${domain}Ref`);

    if (domainValidation.stateEnum.found) totalFound++;
    else missingItems.push(`${domain}State or ${domain}Status`);

    if (domainValidation.typeEnum.found) totalFound++;
    else missingItems.push(`${domain}Type`);
  }

  const commonPatterns = validateCommonPatterns(parsed, schema);

  for (const item of [...commonPatterns.types, ...commonPatterns.interfaces, ...commonPatterns.enums]) {
    totalExpected++;
    if (item.found) {
      totalFound++;
    } else {
      const expected = Array.isArray(item.expected) ? item.expected[0] : item.expected;
      missingItems.push(expected);
    }
  }

  const coverage = totalExpected > 0 ? (totalFound / totalExpected) * 100 : 100;

  return {
    passed: missingItems.length === 0,
    domains: domainValidations,
    commonPatterns,
    summary: {
      totalExpected,
      totalFound,
      missingItems,
      coverage
    }
  };
}

function validateIdType(parsed: ParsedVocabulary, domain: string, schema: VocabularySchema): ItemValidation {
  const expected = schema.idTypes.required(domain);
  const found = parsed.types.has(expected);

  return {
    expected,
    found,
    actual: found ? parsed.types.get(expected)?.definition : undefined,
    suggestion: found ? undefined : `type ${expected} = string & { readonly __brand: '${expected}' };`
  };
}

function validateRefInterface(parsed: ParsedVocabulary, domain: string, schema: VocabularySchema): ItemValidation {
  const expected = schema.refInterfaces.required(domain);
  const found = parsed.interfaces.has(expected);

  return {
    expected,
    found,
    actual: found ? `interface with ${parsed.interfaces.get(expected)?.properties.length} properties` : undefined,
    suggestion: found ? undefined : `interface ${expected} {\n  id: ${domain}Id;\n  name?: string;\n}`
  };
}

function validateStateEnum(parsed: ParsedVocabulary, domain: string, schema: VocabularySchema): ItemValidation {
  const expectedOptions = schema.stateEnums.required(domain);
  const foundName = expectedOptions.find(name => parsed.enums.has(name));

  return {
    expected: expectedOptions,
    found: !!foundName,
    actual: foundName ? `enum with values: ${parsed.enums.get(foundName)?.values.join(', ')}` : undefined,
    suggestion: foundName ? undefined : `enum ${expectedOptions[0]} {\n  DRAFT = 'draft',\n  ACTIVE = 'active',\n  ARCHIVED = 'archived'\n}`
  };
}

function validateTypeEnum(parsed: ParsedVocabulary, domain: string, schema: VocabularySchema): ItemValidation {
  const expected = schema.typeEnums.required(domain);
  const found = parsed.enums.has(expected);

  return {
    expected,
    found,
    actual: found ? `enum with values: ${parsed.enums.get(expected)?.values.join(', ')}` : undefined,
    suggestion: found ? undefined : `enum ${expected} {\n  DEFAULT = 'default',\n  CUSTOM = 'custom'\n}`
  };
}

function validateCommonPatterns(parsed: ParsedVocabulary, schema: VocabularySchema): CommonPatternValidation {
  const result: CommonPatternValidation = {
    types: [],
    interfaces: [],
    enums: []
  };

  for (const typeName of schema.commonPatterns.types) {
    const found = parsed.types.has(typeName);
    result.types.push({
      expected: typeName,
      found,
      actual: found ? parsed.types.get(typeName)?.definition : undefined,
      suggestion: found ? undefined : getCommonTypeSuggestion(typeName)
    });
  }

  for (const interfaceName of schema.commonPatterns.interfaces) {
    const found = parsed.interfaces.has(interfaceName);
    result.interfaces.push({
      expected: interfaceName,
      found,
      actual: found ? `interface with ${parsed.interfaces.get(interfaceName)?.properties.length} properties` : undefined,
      suggestion: found ? undefined : getCommonInterfaceSuggestion(interfaceName)
    });
  }

  for (const enumName of schema.commonPatterns.enums) {
    const found = parsed.enums.has(enumName);
    result.enums.push({
      expected: enumName,
      found,
      actual: found ? `enum with values: ${parsed.enums.get(enumName)?.values.join(', ')}` : undefined,
      suggestion: found ? undefined : `enum ${enumName} { /* values */ }`
    });
  }

  return result;
}

function getCommonTypeSuggestion(typeName: string): string {
  const suggestions: Record<string, string> = {
    ApiResponse: 'type ApiResponse<T> = { success: boolean; data?: T; error?: { code: string; message: string; } };',
    PaginatedResponse: 'type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number; hasMore: boolean; };',
    ISOTimestamp: "type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };",
    ISODate: "type ISODate = string & { readonly __brand: 'ISODate' };"
  };

  return suggestions[typeName] || `type ${typeName} = /* define type */;`;
}

function getCommonInterfaceSuggestion(interfaceName: string): string {
  const suggestions: Record<string, string> = {
    Timestamps: 'interface Timestamps {\n  createdAt: ISOTimestamp;\n  updatedAt: ISOTimestamp;\n}',
    PaginationParams: 'interface PaginationParams {\n  page?: number;\n  limit?: number;\n  sortBy?: string;\n  sortOrder?: \'asc\' | \'desc\';\n}'
  };

  return suggestions[interfaceName] || `interface ${interfaceName} {\n  /* properties */\n}`;
}

// ============================================================================
// REPORTER - Format and output validation results
// ============================================================================

export interface ReportOptions {
  verbose: boolean;
  format: 'text' | 'json';
}

export function formatValidationReport(result: ValidationResult, options: ReportOptions = { verbose: false, format: 'text' }): string {
  if (options.format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];
  const divider = '='.repeat(60);
  const thinDivider = '-'.repeat(60);

  lines.push(divider);
  lines.push(result.passed ? '  VOCABULARY VALIDATION: PASSED' : '  VOCABULARY VALIDATION: FAILED');
  lines.push(divider);
  lines.push('');

  lines.push(`Coverage: ${result.summary.coverage.toFixed(1)}% (${result.summary.totalFound}/${result.summary.totalExpected})`);
  lines.push('');

  lines.push('DOMAIN VALIDATION');
  lines.push(thinDivider);

  for (const dv of result.domains) {
    lines.push(`\n[${dv.domain}]`);
    lines.push(formatItemResult('  ID Type', dv.idType, options.verbose));
    lines.push(formatItemResult('  Ref Interface', dv.refInterface, options.verbose));
    lines.push(formatItemResult('  State/Status Enum', dv.stateEnum, options.verbose));
    lines.push(formatItemResult('  Type Enum', dv.typeEnum, options.verbose));
  }

  lines.push('');
  lines.push('COMMON PATTERNS');
  lines.push(thinDivider);

  if (result.commonPatterns.types.length > 0) {
    lines.push('\nTypes:');
    for (const item of result.commonPatterns.types) {
      lines.push(formatItemResult('  ', item, options.verbose));
    }
  }

  if (result.commonPatterns.interfaces.length > 0) {
    lines.push('\nInterfaces:');
    for (const item of result.commonPatterns.interfaces) {
      lines.push(formatItemResult('  ', item, options.verbose));
    }
  }

  if (result.commonPatterns.enums.length > 0) {
    lines.push('\nEnums:');
    for (const item of result.commonPatterns.enums) {
      lines.push(formatItemResult('  ', item, options.verbose));
    }
  }

  if (result.summary.missingItems.length > 0) {
    lines.push('');
    lines.push('MISSING ITEMS');
    lines.push(thinDivider);
    for (const item of result.summary.missingItems) {
      lines.push(`  - ${item}`);
    }
  }

  if (options.verbose && result.summary.missingItems.length > 0) {
    lines.push('');
    lines.push('SUGGESTED ADDITIONS');
    lines.push(thinDivider);

    for (const dv of result.domains) {
      if (!dv.idType.found && dv.idType.suggestion) {
        lines.push(`\n// ${dv.domain} ID`);
        lines.push(dv.idType.suggestion);
      }
      if (!dv.refInterface.found && dv.refInterface.suggestion) {
        lines.push(`\n// ${dv.domain} Reference`);
        lines.push(dv.refInterface.suggestion);
      }
      if (!dv.stateEnum.found && dv.stateEnum.suggestion) {
        lines.push(`\n// ${dv.domain} State`);
        lines.push(dv.stateEnum.suggestion);
      }
      if (!dv.typeEnum.found && dv.typeEnum.suggestion) {
        lines.push(`\n// ${dv.domain} Type`);
        lines.push(dv.typeEnum.suggestion);
      }
    }

    for (const item of [...result.commonPatterns.types, ...result.commonPatterns.interfaces]) {
      if (!item.found && item.suggestion) {
        lines.push('');
        lines.push(item.suggestion);
      }
    }
  }

  lines.push('');
  lines.push(divider);

  return lines.join('\n');
}

function formatItemResult(prefix: string, item: ItemValidation, verbose: boolean): string {
  const expected = Array.isArray(item.expected) ? item.expected.join(' or ') : item.expected;
  const status = item.found ? '[OK]' : '[MISSING]';

  const separator = prefix.endsWith(' ') || prefix.endsWith(':') ? '' : ' ';
  let line = `${prefix}${separator}${expected}: ${status}`;

  if (verbose && item.found && item.actual) {
    line += ` (${item.actual})`;
  }

  return line;
}

// ============================================================================
// Main Validation Function (API)
// ============================================================================

export interface ValidateVocabularyOptions {
  primitivesPath: string;
  domains: string[];
  verbose?: boolean;
  schema?: VocabularySchema;
}

export function validateVocabulary(options: ValidateVocabularyOptions): ValidationResult {
  const { primitivesPath, domains, schema = DEFAULT_SCHEMA } = options;

  const primitivesFullPath = path.resolve(primitivesPath);

  if (!fs.existsSync(primitivesFullPath)) {
    throw new Error(`File not found: ${primitivesFullPath}`);
  }

  const parsed = parseVocabularyFile(primitivesFullPath);
  return validateVocabularyContent(parsed, domains, schema);
}
