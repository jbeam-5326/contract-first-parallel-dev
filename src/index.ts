/**
 * Contract-First Parallel Development
 *
 * A proven methodology for building production-quality software
 * using N parallel Claude agents with zero coordination overhead.
 *
 * @packageDocumentation
 */

// Export verification tools
export {
  verifyContracts,
  parseContract,
  parseSharedPrimitives,
  formatReport,
  generateReport,
  type VerifyContractsOptions,
  type VerificationReport,
  type VerificationIssue,
  type ParsedContract,
  type SharedPrimitives,
  type TypeDefinition,
  type ImportInfo,
  type ServiceMethod,
  type ApiRoute,
  type DependencyNode
} from './verify-contracts';

// Export validation tools
export {
  validateVocabulary,
  parseVocabularyFile,
  validateVocabularyContent,
  formatValidationReport,
  DEFAULT_SCHEMA,
  type ValidateVocabularyOptions,
  type ValidationResult,
  type DomainValidation,
  type ItemValidation,
  type CommonPatternValidation,
  type ValidationSummary,
  type ParsedVocabulary,
  type VocabularySchema
} from './validate-vocabulary';

// Export init functionality
export {
  initProject,
  type InitProjectOptions,
  type InitProjectResult
} from './init';

/**
 * Package version
 */
export const VERSION = '1.0.0';

/**
 * Package description
 */
export const DESCRIPTION = 'Contract-first parallel development methodology for AI agents';
