/**
 * Project Initialization Module
 *
 * Creates a new project structure with templates for contract-first development.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface InitProjectOptions {
  targetDir: string;
  projectName?: string;
  domains?: string[];
}

export interface InitProjectResult {
  success: boolean;
  filesCreated: string[];
  errors: string[];
}

/**
 * Initialize a new contract-first parallel development project
 */
export function initProject(options: InitProjectOptions): InitProjectResult {
  const { targetDir, projectName = 'my-project', domains = ['User', 'Order'] } = options;
  const filesCreated: string[] = [];
  const errors: string[] = [];

  const targetPath = path.resolve(targetDir);

  // Create directories
  const dirs = [
    '',
    'src',
    'src/shared',
    'contracts',
    ...domains.map(d => `src/${d.toLowerCase()}`)
  ];

  for (const dir of dirs) {
    const dirPath = path.join(targetPath, dir);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (err) {
      errors.push(`Failed to create directory: ${dirPath}`);
    }
  }

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true
    },
    include: ['src/**/*']
  };

  try {
    const tsconfigPath = path.join(targetPath, 'tsconfig.json');
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsConfig, null, 2));
    filesCreated.push('tsconfig.json');
  } catch (err) {
    errors.push('Failed to create tsconfig.json');
  }

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `${projectName} - Built with contract-first parallel development`,
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      verify: 'npx cfpd verify --primitives src/shared/shared.types.ts --contracts contracts/*.md',
      test: 'npx tsc --noEmit'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      typescript: '^5.0.0'
    }
  };

  try {
    const packagePath = path.join(targetPath, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    filesCreated.push('package.json');
  } catch (err) {
    errors.push('Failed to create package.json');
  }

  // Create shared primitives template
  const sharedTypes = generateSharedTypesTemplate(projectName, domains);
  try {
    const sharedPath = path.join(targetPath, 'src/shared/shared.types.ts');
    fs.writeFileSync(sharedPath, sharedTypes);
    filesCreated.push('src/shared/shared.types.ts');
  } catch (err) {
    errors.push('Failed to create src/shared/shared.types.ts');
  }

  // Create shared primitives markdown
  const sharedPrimitivesMd = generateSharedPrimitivesMarkdown(projectName, domains);
  try {
    const mdPath = path.join(targetPath, 'shared-primitives.md');
    fs.writeFileSync(mdPath, sharedPrimitivesMd);
    filesCreated.push('shared-primitives.md');
  } catch (err) {
    errors.push('Failed to create shared-primitives.md');
  }

  // Create contract template for each domain
  for (const domain of domains) {
    const contractMd = generateContractTemplate(domain);
    try {
      const contractPath = path.join(targetPath, `contracts/${domain.toUpperCase()}-CONTRACT.md`);
      fs.writeFileSync(contractPath, contractMd);
      filesCreated.push(`contracts/${domain.toUpperCase()}-CONTRACT.md`);
    } catch (err) {
      errors.push(`Failed to create contract for ${domain}`);
    }
  }

  // Create README
  const readme = generateReadme(projectName, domains);
  try {
    const readmePath = path.join(targetPath, 'README.md');
    fs.writeFileSync(readmePath, readme);
    filesCreated.push('README.md');
  } catch (err) {
    errors.push('Failed to create README.md');
  }

  return {
    success: errors.length === 0,
    filesCreated,
    errors
  };
}

function generateSharedTypesTemplate(projectName: string, domains: string[]): string {
  const idTypes = domains.map(d => `export type ${d}Id = string & { readonly __brand: '${d}Id' };`).join('\n');
  const refTypes = domains.map(d => `export interface ${d}Ref {
  id: ${d}Id;
  // Add essential fields for cross-domain reference
}`).join('\n\n');

  return `/**
 * ${projectName} - Shared Type Definitions
 *
 * This file contains all types shared across domain boundaries.
 * IMPORTANT: Complete this file before starting parallel work.
 */

// ============================================
// BRANDED ID TYPES
// ============================================

${idTypes}

// ============================================
// TIMESTAMP TYPES
// ============================================

export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
export type ISODate = string & { readonly __brand: 'ISODate' };

export interface Timestamps {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ============================================
// SHARED ENUMS
// ============================================

// Add shared enums here
// Example:
// export enum Status {
//   active = 'active',
//   inactive = 'inactive'
// }

// ============================================
// CROSS-DOMAIN REFERENCES
// ============================================

${refTypes}

// ============================================
// API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

export function now(): ISOTimestamp {
  return new Date().toISOString() as ISOTimestamp;
}

export function today(): ISODate {
  return new Date().toISOString().split('T')[0] as ISODate;
}
`;
}

function generateSharedPrimitivesMarkdown(projectName: string, domains: string[]): string {
  const domainTable = domains.map(d => `| **${d}** | TODO: Add responsibility |`).join('\n');
  const idTypes = domains.map(d => `export type ${d}Id = string & { readonly __brand: '${d}Id' };`).join('\n');

  return `# ${projectName} - Shared Primitives

## Overview

This document defines all shared types, enums, interfaces, and constants used across the ${projectName} platform.

**Domains:** ${domains.length} domains identified

---

## Domains Identified

| Domain | Responsibility |
|--------|----------------|
${domainTable}

---

## Identity Types

\`\`\`typescript
${idTypes}
\`\`\`

---

## Enums

TODO: Add shared enums

---

## Cross-Domain References

TODO: Add Ref interfaces for each domain

---

## Standard Patterns

\`\`\`typescript
export type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };
export type ISODate = string & { readonly __brand: 'ISODate' };

export interface Timestamps {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
\`\`\`

---

## Completeness Checklist

Before proceeding to contract generation, verify:

- [ ] All domains identified
- [ ] All cross-domain entity IDs defined
- [ ] All shared enums defined
- [ ] All cross-domain references defined
- [ ] API response wrapper defined
- [ ] Pagination patterns defined
- [ ] File compiles with \`tsc --noEmit\`

**DO NOT PROCEED until all items are checked.**
`;
}

function generateContractTemplate(domain: string): string {
  const domainLower = domain.toLowerCase();
  const domainUpper = domain.toUpperCase();

  return `# ${domain} Domain Contract

## Domain Overview

| Attribute | Value |
|-----------|-------|
| **Domain** | ${domain} |
| **Responsibility** | TODO: Define responsibility |
| **Owner** | ${domain}Service |
| **Dependencies** | TODO: List dependencies |
| **Consumers** | TODO: List consumers |

---

## 1. Types

### ${domain} Entity

\`\`\`typescript
import {
  ${domain}Id,
  ISOTimestamp,
  Timestamps
} from '../shared/shared.types';

export interface ${domain} extends Timestamps {
  id: ${domain}Id;
  // TODO: Add fields
  isActive: boolean;
}
\`\`\`

### Input Types

\`\`\`typescript
export interface Create${domain}Input {
  // TODO: Add fields
}

export interface Update${domain}Input {
  // TODO: Add optional fields
}
\`\`\`

### Query Types

\`\`\`typescript
export interface ${domain}Filters {
  isActive?: boolean;
  // TODO: Add filter fields
}
\`\`\`

---

## 2. Service Interface

\`\`\`typescript
export interface I${domain}Service {
  create${domain}(input: Create${domain}Input): Promise<ApiResponse<${domain}>>;
  get${domain}ById(id: ${domain}Id): Promise<ApiResponse<${domain}>>;
  update${domain}(id: ${domain}Id, input: Update${domain}Input): Promise<ApiResponse<${domain}>>;
  delete${domain}(id: ${domain}Id): Promise<ApiResponse<void>>;
  list${domain}s(filters?: ${domain}Filters, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<${domain}>>>;
}
\`\`\`

---

## 3. API Routes

| Method | Path | Request | Response | Auth | Description |
|--------|------|---------|----------|------|-------------|
| POST | /api/v1/${domainLower}s | Create${domain}Input | ${domain} | Admin | Create |
| GET | /api/v1/${domainLower}s/:id | - | ${domain} | User | Get by ID |
| PATCH | /api/v1/${domainLower}s/:id | Update${domain}Input | ${domain} | Admin | Update |
| DELETE | /api/v1/${domainLower}s/:id | - | void | Admin | Delete |
| GET | /api/v1/${domainLower}s | query params | PaginatedResponse | User | List |

---

## 4. Cross-Domain Dependencies

### Imports

\`\`\`typescript
import {
  ${domain}Id,
  ISOTimestamp,
  Timestamps,
  ApiResponse,
  PaginationParams,
  PaginatedResponse
} from '../shared/shared.types';
\`\`\`

### Exports

\`\`\`typescript
export interface ${domain}Ref {
  id: ${domain}Id;
  // TODO: Add minimal reference fields
}
\`\`\`

---

## 5. Database Schema

\`\`\`prisma
model ${domain} {
  id        String   @id @default(cuid())
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("${domainLower}s")
}
\`\`\`

---

## 6. Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| TODO | TODO | ${domainUpper}_001 |

---

## 7. Error Codes

\`\`\`typescript
export const ${domain}ErrorCodes = {
  ${domainUpper}_001: 'TODO: Description',
  ${domainUpper}_002: 'TODO: Description',
  ${domainUpper}_003: '${domain} not found',
} as const;
\`\`\`

---

## Completeness Checklist

- [ ] All types defined with all fields
- [ ] Service interface has all required methods
- [ ] All methods document their error codes
- [ ] API routes cover all operations
- [ ] Cross-domain imports listed
- [ ] Database schema complete with indexes
- [ ] All validation rules documented
- [ ] All error codes defined
- [ ] No TODOs or placeholders
`;
}

function generateReadme(projectName: string, domains: string[]): string {
  return `# ${projectName}

Built using the Contract-First Parallel Development methodology.

## Domains

${domains.map(d => `- ${d}`).join('\n')}

## Getting Started

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Complete shared primitives**
   Edit \`src/shared/shared.types.ts\` and \`shared-primitives.md\`

3. **Verify compilation**
   \`\`\`bash
   npx tsc --noEmit
   \`\`\`

4. **Generate contracts** (parallel)
   Use the prompts in the methodology docs to spawn agents

5. **Verify contracts**
   \`\`\`bash
   npx cfpd verify --primitives src/shared/shared.types.ts --contracts contracts/*.md
   \`\`\`

6. **Build implementation** (parallel)
   Use the prompts in the methodology docs to spawn agents

7. **Final verification**
   \`\`\`bash
   npx tsc --noEmit
   \`\`\`

## Project Structure

\`\`\`
${projectName}/
├── package.json
├── tsconfig.json
├── shared-primitives.md
├── contracts/
${domains.map(d => `│   └── ${d.toUpperCase()}-CONTRACT.md`).join('\n')}
└── src/
    ├── shared/
    │   └── shared.types.ts
${domains.map(d => `    └── ${d.toLowerCase()}/
        ├── ${d.toLowerCase()}.types.ts
        ├── ${d.toLowerCase()}.service.ts
        └── ${d.toLowerCase()}.repository.ts`).join('\n')}
\`\`\`

## Methodology

For complete methodology documentation, see:
- [METHODOLOGY.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/main/docs/METHODOLOGY.md)
- [QUICK-START.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/main/docs/QUICK-START.md)
- [LESSONS-LEARNED.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/main/docs/LESSONS-LEARNED.md)
`;
}
