# Example: Implementation from Contract

This shows how the contract translates directly into implementation code.

## The Core Value

The implementation agent followed the contract exactly. No creative decisions, no ambiguity, no questions. The contract IS the specification.

---

## Types File (from Contract Section 1 + 7)

```typescript
// candidate.types.ts
// Generated from CANDIDATE-CONTRACT.md

import {
  CandidateId,
  UserId,
  DivisionId,
  PstScoreId,
  NswPath,
  RiskLevel,
  ISODate,
  ISOTimestamp,
  Timestamps,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  CandidateRef,
  PstScoreRef,
  DivisionRef
} from '../shared/shared.types';

// ============================================
// DOMAIN-SPECIFIC ENUMS (from contract)
// ============================================

export enum BodyPart {
  shoulder = 'shoulder',
  elbow = 'elbow',
  wrist = 'wrist',
  back = 'back',
  hip = 'hip',
  knee = 'knee',
  ankle = 'ankle',
  foot = 'foot',
  neck = 'neck',
  other = 'other'
}

export enum InjurySeverity {
  minor = 'minor',
  moderate = 'moderate',
  severe = 'severe'
}

// ============================================
// SUPPORTING TYPES (from contract)
// ============================================

export interface Injury {
  description: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  startDate: ISODate;
  endDate: ISODate | null;
  restrictions: string[];
}

export interface EquipmentAccess {
  pullUpBar: boolean;
  weights: boolean;
  kettlebells: boolean;
  resistanceBands: boolean;
  swimmingPool: boolean;
  fins: boolean;
  runningTrack: boolean;
}

export interface CandidateConstraints {
  injuries: Injury[];
  trainingHoursPerWeek: number;
  equipmentAccess: EquipmentAccess;
  age: number;
  swimmingPoolAccess: boolean;
  gymAccess: boolean;
  runningTrackAccess: boolean;
}

// ============================================
// CORE ENTITIES (from contract)
// ============================================

export interface Candidate extends Timestamps {
  id: CandidateId;
  userId: UserId;
  divisionId: DivisionId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nswPath: NswPath;
  shipDate: ISODate;
  riskLevel: RiskLevel;
  constraints: CandidateConstraints;
  isActive: boolean;
  enrolledAt: ISOTimestamp;
  deactivatedAt: ISOTimestamp | null;
}

export interface PstScore extends Timestamps {
  id: PstScoreId;
  candidateId: CandidateId;
  pushUps: number;
  pullUps: number;
  runSeconds: number;
  swimSeconds: number;
  underwaterPass: boolean;
  recordedAt: ISOTimestamp;
  notes: string | null;
  recordedBy: UserId | null;
  isOfficial: boolean;
}

export interface CandidateProfile extends Timestamps {
  id: CandidateId;
  userId: UserId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nswPath: NswPath;
  shipDate: ISODate;
  riskLevel: RiskLevel;
  constraints: CandidateConstraints;
  isActive: boolean;
  enrolledAt: ISOTimestamp;
  daysUntilShip: number;
  latestPstScore: PstScoreRef | null;
  division: DivisionRef;
  pstScoreCount: number;
}

// ============================================
// INPUT TYPES (from contract)
// ============================================

export interface CreateCandidateInput {
  userId: UserId;
  divisionId: DivisionId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nswPath: NswPath;
  shipDate: ISODate;
  constraints?: Partial<CandidateConstraints>;
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nswPath?: NswPath;
}

export interface RecordPstScoreInput {
  pushUps: number;
  pullUps: number;
  runSeconds: number;
  swimSeconds: number;
  underwaterPass: boolean;
  notes?: string;
  isOfficial?: boolean;
}

export interface UpdateConstraintsInput {
  injuries?: Injury[];
  trainingHoursPerWeek?: number;
  equipmentAccess?: Partial<EquipmentAccess>;
  age?: number;
}

export interface CandidateFilters {
  divisionId?: DivisionId;
  nswPath?: NswPath;
  riskLevel?: RiskLevel;
  isActive?: boolean;
  shipDateBefore?: ISODate;
  shipDateAfter?: ISODate;
}

// ============================================
// SERVICE INTERFACE (from contract)
// ============================================

export interface ICandidateService {
  createCandidate(input: CreateCandidateInput): Promise<ApiResponse<Candidate>>;
  getCandidateById(candidateId: CandidateId): Promise<ApiResponse<CandidateProfile>>;
  getCandidateByUserId(userId: UserId): Promise<ApiResponse<CandidateProfile>>;
  updateCandidate(candidateId: CandidateId, input: UpdateCandidateInput): Promise<ApiResponse<Candidate>>;
  recordPstScore(candidateId: CandidateId, input: RecordPstScoreInput): Promise<ApiResponse<PstScore>>;
  getPstHistory(candidateId: CandidateId, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<PstScore>>>;
  getLatestPstScore(candidateId: CandidateId): Promise<ApiResponse<PstScore | null>>;
  updateShipDate(candidateId: CandidateId, shipDate: ISODate): Promise<ApiResponse<Candidate>>;
  updateConstraints(candidateId: CandidateId, constraints: UpdateConstraintsInput): Promise<ApiResponse<Candidate>>;
  listCandidates(filters?: CandidateFilters, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<CandidateProfile>>>;
  getCandidatesByDivision(divisionId: DivisionId, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<CandidateProfile>>>;
  getCandidatesByRiskLevel(riskLevel: RiskLevel, pagination?: PaginationParams): Promise<ApiResponse<PaginatedResponse<CandidateProfile>>>;
}

// ============================================
// REPOSITORY INTERFACE
// ============================================

export interface ICandidateRepository {
  create(data: CreateCandidateData): Promise<Candidate>;
  findById(id: CandidateId): Promise<Candidate | null>;
  findByUserId(userId: UserId): Promise<Candidate | null>;
  findByEmail(email: string): Promise<Candidate | null>;
  update(id: CandidateId, data: UpdateCandidateData): Promise<Candidate>;
  list(filters: CandidateFilters, pagination: PaginationParams): Promise<PaginatedResult<Candidate>>;
}

export interface IPstScoreRepository {
  create(data: CreatePstScoreData): Promise<PstScore>;
  findByCandidateId(candidateId: CandidateId, pagination: PaginationParams): Promise<PaginatedResult<PstScore>>;
  findLatest(candidateId: CandidateId): Promise<PstScore | null>;
  count(candidateId: CandidateId): Promise<number>;
}

// ============================================
// ERROR CODES (from contract Section 7)
// ============================================

export const CandidateErrorCodes = {
  CANDIDATE_001: 'Email already registered',
  CANDIDATE_002: 'Invalid email format',
  CANDIDATE_003: 'Invalid phone format',
  CANDIDATE_004: 'Candidate not found',
  CANDIDATE_005: 'Invalid NSW path',
  CANDIDATE_006: 'Division not found',
  CANDIDATE_007: 'User not found',
  CANDIDATE_008: 'Candidate already exists for this user',
  CANDIDATE_009: 'Cannot deactivate candidate with active training plan',
  CANDIDATE_010: 'Invalid PST score values',
  CANDIDATE_011: 'Ship date must be in the future',
  CANDIDATE_012: 'Ship date must be at least 4 weeks away',
  CANDIDATE_013: 'Invalid age (must be 17-40)',
  CANDIDATE_014: 'Invalid training hours (must be 1-40)',
  CANDIDATE_015: 'Pull-up bar access required for NSW candidates',
  CANDIDATE_016: 'Invalid first name',
  CANDIDATE_017: 'Invalid last name',
  CANDIDATE_018: 'Candidate is deactivated',
  CANDIDATE_019: 'PST score not found',
  CANDIDATE_020: 'Invalid risk level'
} as const;
```

---

## Service Implementation (from Contract Section 2 + 6)

```typescript
// candidate.service.ts
// Implements ICandidateService from contract

import {
  CandidateId,
  UserId,
  DivisionId,
  NswPath,
  RiskLevel,
  ISODate,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  successResponse,
  errorResponse,
  now,
  today,
  daysBetween
} from '../shared/shared.types';

import {
  Candidate,
  PstScore,
  CandidateProfile,
  CreateCandidateInput,
  UpdateCandidateInput,
  RecordPstScoreInput,
  UpdateConstraintsInput,
  CandidateFilters,
  ICandidateService,
  ICandidateRepository,
  IPstScoreRepository,
  CandidateErrorCodes
} from './candidate.types';

export class CandidateService implements ICandidateService {
  constructor(
    private candidateRepo: ICandidateRepository,
    private pstScoreRepo: IPstScoreRepository
  ) {}

  async createCandidate(input: CreateCandidateInput): Promise<ApiResponse<Candidate>> {
    // Validation from contract Section 6
    const emailValidation = this.validateEmail(input.email);
    if (!emailValidation.valid) {
      return errorResponse('CANDIDATE_002', CandidateErrorCodes.CANDIDATE_002);
    }

    const phoneValidation = this.validatePhone(input.phone);
    if (!phoneValidation.valid) {
      return errorResponse('CANDIDATE_003', CandidateErrorCodes.CANDIDATE_003);
    }

    const nameValidation = this.validateName(input.firstName, 'first');
    if (!nameValidation.valid) {
      return errorResponse('CANDIDATE_016', CandidateErrorCodes.CANDIDATE_016);
    }

    const shipDateValidation = this.validateShipDate(input.shipDate);
    if (!shipDateValidation.valid) {
      return errorResponse('CANDIDATE_012', CandidateErrorCodes.CANDIDATE_012);
    }

    // Check email uniqueness
    const existing = await this.candidateRepo.findByEmail(input.email);
    if (existing) {
      return errorResponse('CANDIDATE_001', CandidateErrorCodes.CANDIDATE_001);
    }

    // Check user doesn't already have candidate
    const existingByUser = await this.candidateRepo.findByUserId(input.userId);
    if (existingByUser) {
      return errorResponse('CANDIDATE_008', CandidateErrorCodes.CANDIDATE_008);
    }

    // Validate constraints if provided
    if (input.constraints) {
      const constraintsValidation = this.validateConstraints(input.constraints);
      if (!constraintsValidation.valid) {
        return errorResponse(constraintsValidation.code!, constraintsValidation.message!);
      }
    }

    const candidate = await this.candidateRepo.create({
      ...input,
      riskLevel: RiskLevel.yellow, // Default
      isActive: true,
      enrolledAt: now(),
      deactivatedAt: null
    });

    return successResponse(candidate);
  }

  async getCandidateById(candidateId: CandidateId): Promise<ApiResponse<CandidateProfile>> {
    const candidate = await this.candidateRepo.findById(candidateId);
    if (!candidate) {
      return errorResponse('CANDIDATE_004', CandidateErrorCodes.CANDIDATE_004);
    }

    const profile = await this.toProfile(candidate);
    return successResponse(profile);
  }

  async recordPstScore(
    candidateId: CandidateId,
    input: RecordPstScoreInput
  ): Promise<ApiResponse<PstScore>> {
    const candidate = await this.candidateRepo.findById(candidateId);
    if (!candidate) {
      return errorResponse('CANDIDATE_004', CandidateErrorCodes.CANDIDATE_004);
    }

    // Validate PST scores from contract Section 6
    const validation = this.validatePstScore(input);
    if (!validation.valid) {
      return errorResponse('CANDIDATE_010', CandidateErrorCodes.CANDIDATE_010);
    }

    const pstScore = await this.pstScoreRepo.create({
      candidateId,
      ...input,
      recordedAt: now()
    });

    return successResponse(pstScore);
  }

  // ... additional methods following same pattern

  // ============================================
  // VALIDATION HELPERS (from contract Section 6)
  // ============================================

  private validateEmail(email: string): { valid: boolean } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return { valid: emailRegex.test(email) };
  }

  private validatePhone(phone: string): { valid: boolean } {
    const digitsOnly = phone.replace(/\D/g, '');
    return { valid: digitsOnly.length >= 10 && digitsOnly.length <= 15 };
  }

  private validateName(name: string, type: 'first' | 'last'): { valid: boolean } {
    const nameRegex = /^[a-zA-Z-]{1,50}$/;
    return { valid: nameRegex.test(name) };
  }

  private validateShipDate(shipDate: ISODate): { valid: boolean } {
    const shipDateTime = new Date(shipDate).getTime();
    const todayTime = new Date(today()).getTime();
    const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
    return { valid: shipDateTime - todayTime >= fourWeeksMs };
  }

  private validatePstScore(input: RecordPstScoreInput): { valid: boolean } {
    // From contract: pushUps 0-200, pullUps 0-50, run/swim 300-1800
    if (input.pushUps < 0 || input.pushUps > 200) return { valid: false };
    if (input.pullUps < 0 || input.pullUps > 50) return { valid: false };
    if (input.runSeconds < 300 || input.runSeconds > 1800) return { valid: false };
    if (input.swimSeconds < 300 || input.swimSeconds > 1800) return { valid: false };
    return { valid: true };
  }

  private validateConstraints(constraints: Partial<CandidateConstraints>): {
    valid: boolean;
    code?: string;
    message?: string;
  } {
    if (constraints.age !== undefined) {
      if (constraints.age < 17 || constraints.age > 40) {
        return { valid: false, code: 'CANDIDATE_013', message: CandidateErrorCodes.CANDIDATE_013 };
      }
    }
    if (constraints.trainingHoursPerWeek !== undefined) {
      if (constraints.trainingHoursPerWeek < 1 || constraints.trainingHoursPerWeek > 40) {
        return { valid: false, code: 'CANDIDATE_014', message: CandidateErrorCodes.CANDIDATE_014 };
      }
    }
    if (constraints.equipmentAccess?.pullUpBar === false) {
      return { valid: false, code: 'CANDIDATE_015', message: CandidateErrorCodes.CANDIDATE_015 };
    }
    return { valid: true };
  }
}
```

---

## Key Observations

### 1. Types Match Contract Exactly

Every interface in `candidate.types.ts` comes directly from the contract. No creative interpretation.

### 2. Error Codes Are Pre-Defined

The service uses `CandidateErrorCodes.CANDIDATE_XXX` exactly as specified. No new errors invented.

### 3. Validation Rules Are Explicit

```typescript
// Contract says: "pushUps 0-200"
if (input.pushUps < 0 || input.pushUps > 200) return { valid: false };
```

The implementation agent didn't guess these values. They came from the contract.

### 4. Method Signatures Match Service Interface

```typescript
// Contract defines:
recordPstScore(candidateId: CandidateId, input: RecordPstScoreInput): Promise<ApiResponse<PstScore>>;

// Implementation matches exactly:
async recordPstScore(candidateId: CandidateId, input: RecordPstScoreInput): Promise<ApiResponse<PstScore>> {
```

---

## Result

The contract-to-implementation mapping is mechanical:

| Contract Section | Implementation File |
|-----------------|---------------------|
| Section 1 (Types) | `candidate.types.ts` interfaces |
| Section 2 (Service Interface) | `candidate.types.ts` ICandidateService |
| Section 6 (Validation) | `candidate.service.ts` validate* methods |
| Section 7 (Error Codes) | `candidate.types.ts` CandidateErrorCodes |

No ambiguity. No questions. The contract IS the implementation spec.
