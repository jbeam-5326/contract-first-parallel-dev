# Contract-First Parallel Development

A proven methodology for building production-quality software using N parallel Claude agents with zero coordination overhead.

[![npm version](https://badge.fury.io/js/@joel5326%2Fcontract-first-parallel-dev.svg)](https://www.npmjs.com/package/@joel5326/contract-first-parallel-dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install -g @joel5326/contract-first-parallel-dev
# or
npx @joel5326/contract-first-parallel-dev init
```

## The Problem

When multiple AI agents work on the same codebase, they create conflicts:
- Type mismatches across domain boundaries
- Incompatible API contracts
- Circular dependencies
- Integration failures at compile time

Traditional solutions require runtime coordination, message passing, or sequential work. These don't scale.

## The Solution

**Contract-First Parallel Development** eliminates coordination by making integration impossible to break:

1. **Extract shared vocabulary ONCE** before any parallel work
2. **Generate contracts in parallel** (N agents, zero communication)
3. **Build implementations in parallel** (N agents, zero communication)
4. **TypeScript compilation** verifies integration automatically

The contracts ARE the coordination mechanism. No runtime coordination needed.

## Proven Results

| Project | Domains | TypeScript Lines | Contract Lines | Errors |
|---------|---------|------------------|----------------|--------|
| LEO Automation | 7 | 26,042 | 20,898 | 0 |
| NSW v3 | 11 | 17,089 | 11,992 | 0 |

**Key Metrics:**
- Zero integration failures across 18 domains
- Zero type conflicts
- 57% scale increase (7 to 11 domains) with no methodology changes
- Compilation succeeds on first attempt

## Quick Start

### Initialize a New Project

```bash
# Create a new project with default domains
npx @joel5326/contract-first-parallel-dev init --name my-project --domains User,Order,Product

# Or install globally and use
npm install -g @joel5326/contract-first-parallel-dev
cfpd init --name my-project --domains User,Order,Product
```

This creates:
- `tsconfig.json` with strict mode
- `src/shared/shared.types.ts` with template types
- `contracts/` with domain contract templates
- `shared-primitives.md` documentation

### Verify Contracts

```bash
cfpd verify --primitives src/shared/shared.types.ts --contracts "contracts/*.md"
```

### Validate Vocabulary Completeness

```bash
cfpd validate --primitives src/shared/shared.types.ts --domains User,Order,Product
```

## CLI Commands

### `cfpd init`

Initialize a new project with contract-first templates.

```bash
cfpd init [options]

Options:
  -d, --dir <directory>  Target directory (default: ".")
  -n, --name <name>      Project name (default: "my-project")
  --domains <list>       Comma-separated domains (default: "User,Order")
```

### `cfpd verify`

Verify contracts against shared primitives.

```bash
cfpd verify [options]

Options:
  -p, --primitives <file>    Path to shared primitives file (.ts or .md)
  -c, --contracts <pattern>  Path pattern to contract files
  -v, --verbose              Show detailed output
  --json                     Output as JSON
```

### `cfpd validate`

Validate vocabulary completeness for specified domains.

```bash
cfpd validate [options]

Options:
  -p, --primitives <file>  Path to shared primitives file
  -d, --domains <list>     Comma-separated list of domain names
  -v, --verbose            Show detailed output with suggestions
  --json                   Output as JSON
```

## Programmatic API

```typescript
import {
  verifyContracts,
  validateVocabulary,
  initProject,
  formatReport,
  formatValidationReport
} from '@joel5326/contract-first-parallel-dev';

// Verify contracts
const report = verifyContracts({
  primitivesPath: './src/shared/shared.types.ts',
  contractPaths: ['./contracts/USER-CONTRACT.md', './contracts/ORDER-CONTRACT.md']
});

console.log(formatReport(report));
console.log(`Passed: ${report.passed}`);

// Validate vocabulary
const result = validateVocabulary({
  primitivesPath: './src/shared/shared.types.ts',
  domains: ['User', 'Order', 'Product']
});

console.log(formatValidationReport(result, { verbose: true, format: 'text' }));

// Initialize project
const initResult = initProject({
  targetDir: './new-project',
  projectName: 'my-app',
  domains: ['User', 'Order', 'Product']
});
```

## The 5-Step Process

1. **Analyze PRD** - Identify domains (sequential, ~10 min)
2. **Extract Vocabulary** - Shared primitives (sequential, ~30 min)
3. **Generate Contracts** - N parallel agents (~2 min each)
4. **Verify Contracts** - Check references (sequential, ~5 min)
5. **Build Implementation** - N parallel agents (~2 min each)

Steps 2 and 4 are quality gates. Do not skip them.

## Core Insight

> "The shared vocabulary is the product. Everything else is mechanical."

Spend 80% of effort on Step 2 (vocabulary extraction). If the vocabulary is complete, parallel agents cannot create conflicts because they all import from the same source of truth.

## Documentation

- [METHODOLOGY.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/master/docs/METHODOLOGY.md) - Complete step-by-step process
- [QUICK-START.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/master/docs/QUICK-START.md) - 5-minute getting started
- [LESSONS-LEARNED.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/master/docs/LESSONS-LEARNED.md) - Hard-won wisdom from experiments
- [SPAWN-AGENTS.md](https://github.com/jbeam-5326/contract-first-parallel-dev/blob/master/docs/SPAWN-AGENTS.md) - Copy-paste prompts for agents

## When to Use This

**Use when:**
- 4+ domains with cross-references
- Multiple entities that reference each other
- Need parallel development without integration risk
- Building with TypeScript (compile-time verification)

**Don't use when:**
- Single domain or simple CRUD
- No cross-domain dependencies
- Prototype/throwaway code
- Dynamic languages without type checking

## Package Structure

```
@joel5326/contract-first-parallel-dev/
├── dist/              # Compiled TypeScript
├── bin/cfpd.js        # CLI entry point
├── templates/         # Project templates
├── docs/              # Methodology documentation
│   ├── METHODOLOGY.md
│   ├── QUICK-START.md
│   ├── LESSONS-LEARNED.md
│   └── SPAWN-AGENTS.md
└── examples/          # Real-world examples
```

## Contributing

Contributions welcome! Please read the methodology documentation first.

## License

MIT - Use freely, attribution appreciated.
