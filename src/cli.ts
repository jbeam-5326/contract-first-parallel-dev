#!/usr/bin/env node

/**
 * Contract-First Parallel Development CLI
 *
 * Commands:
 *   cfpd verify   - Verify contracts against shared primitives
 *   cfpd validate - Validate vocabulary completeness
 *   cfpd init     - Initialize a new project with templates
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

import {
  verifyContracts,
  formatReport
} from './verify-contracts';

import {
  validateVocabulary,
  formatValidationReport
} from './validate-vocabulary';

import {
  initProject
} from './init';

const program = new Command();

program
  .name('cfpd')
  .description('Contract-First Parallel Development CLI')
  .version('1.0.0');

// ============================================================================
// Verify Command
// ============================================================================

program
  .command('verify')
  .description('Verify contracts against shared primitives')
  .requiredOption('-p, --primitives <file>', 'Path to shared primitives file (.ts or .md)')
  .requiredOption('-c, --contracts <pattern>', 'Path pattern to contract files (e.g., ./contracts/*.md)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const primitivesPath = path.resolve(options.primitives);

      if (!fs.existsSync(primitivesPath)) {
        console.error(`Error: Primitives file not found: ${primitivesPath}`);
        process.exit(1);
      }

      // Expand glob pattern
      const contractPattern = options.contracts;
      const contractPaths = await glob(contractPattern, { absolute: true });

      if (contractPaths.length === 0) {
        console.error(`Error: No contracts found matching pattern: ${contractPattern}`);
        process.exit(1);
      }

      console.log(`Primitives: ${primitivesPath}`);
      console.log(`Contracts: ${contractPaths.length} files found`);

      if (options.verbose) {
        for (const p of contractPaths) {
          console.log(`  - ${path.basename(p)}`);
        }
      }

      console.log('\nVerifying contracts...\n');

      const report = verifyContracts({
        primitivesPath,
        contractPaths,
        verbose: options.verbose
      });

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatReport(report));
      }

      process.exit(report.passed ? 0 : 1);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// Validate Command
// ============================================================================

program
  .command('validate')
  .description('Validate vocabulary completeness for specified domains')
  .requiredOption('-p, --primitives <file>', 'Path to shared primitives file (.ts or .md)')
  .requiredOption('-d, --domains <list>', 'Comma-separated list of domain names')
  .option('-v, --verbose', 'Show detailed output with suggestions')
  .option('--json', 'Output as JSON')
  .action((options) => {
    try {
      const primitivesPath = path.resolve(options.primitives);

      if (!fs.existsSync(primitivesPath)) {
        console.error(`Error: Primitives file not found: ${primitivesPath}`);
        process.exit(1);
      }

      const domains = options.domains.split(',').map((d: string) => d.trim());

      if (domains.length === 0) {
        console.error('Error: No domains specified');
        process.exit(1);
      }

      console.log(`Primitives: ${primitivesPath}`);
      console.log(`Domains: ${domains.join(', ')}`);
      console.log('\nValidating vocabulary...\n');

      const result = validateVocabulary({
        primitivesPath,
        domains,
        verbose: options.verbose
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatValidationReport(result, {
          verbose: options.verbose || false,
          format: 'text'
        }));
      }

      process.exit(result.passed ? 0 : 1);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// Init Command
// ============================================================================

program
  .command('init')
  .description('Initialize a new project with contract-first templates')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-n, --name <name>', 'Project name', 'my-project')
  .option('--domains <list>', 'Comma-separated list of initial domains', 'User,Order')
  .action((options) => {
    try {
      const targetDir = path.resolve(options.dir);
      const domains = options.domains.split(',').map((d: string) => d.trim());

      console.log(`Initializing project: ${options.name}`);
      console.log(`Target directory: ${targetDir}`);
      console.log(`Domains: ${domains.join(', ')}`);
      console.log('');

      const result = initProject({
        targetDir,
        projectName: options.name,
        domains
      });

      if (result.success) {
        console.log('Project initialized successfully!\n');
        console.log('Files created:');
        for (const file of result.filesCreated) {
          console.log(`  - ${file}`);
        }
        console.log('');
        console.log('Next steps:');
        console.log('  1. cd ' + (options.dir === '.' ? options.name : options.dir));
        console.log('  2. npm install');
        console.log('  3. Edit src/shared/shared.types.ts to complete the vocabulary');
        console.log('  4. Edit contracts/*.md to complete domain contracts');
        console.log('  5. Run: npx tsc --noEmit');
        console.log('');
      } else {
        console.error('Project initialization failed!\n');
        console.error('Errors:');
        for (const error of result.errors) {
          console.error(`  - ${error}`);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// Help Command Enhancement
// ============================================================================

program
  .command('help')
  .description('Show help for a command')
  .argument('[command]', 'Command to show help for')
  .action((cmd) => {
    if (cmd) {
      const command = program.commands.find(c => c.name() === cmd);
      if (command) {
        command.outputHelp();
      } else {
        console.error(`Unknown command: ${cmd}`);
        program.outputHelp();
      }
    } else {
      program.outputHelp();
    }
  });

// Parse and execute
program.parse();
