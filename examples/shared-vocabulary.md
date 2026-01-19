# Example: Shared Vocabulary

This is a real example from the NSW v3 project (11 domains, 17,089 lines TypeScript).

## The Core Value

This shared vocabulary enabled 11 parallel agents to work simultaneously with **zero coordination** and **zero type conflicts**.

---

## NSW v3 Shared Primitives (Complete Example)

```typescript
// NSW Candidate Accelerator v3 - Shared Type Definitions
// All domains import from this file

// ============================================
// BRANDED ID TYPES (19 total)
// ============================================

export type UserId = string & { readonly __brand: 'UserId' };
export type CandidateId = string & { readonly __brand: 'CandidateId' };
export type FieldAssessorId = string & { readonly __brand: 'FieldAssessorId' };
export type DivisionId = string & { readonly __brand: 'DivisionId' };
export type FitnessPlanId = string & { readonly __brand: 'FitnessPlanId' };
export type WorkoutId = string & { readonly __brand: 'WorkoutId' };
export type ExerciseLogId = string & { readonly __brand: 'ExerciseLogId' };
export type PstScoreId = string & { readonly __brand: 'PstScoreId' };
export type LessonId = string & { readonly __brand: 'LessonId' };
export type LessonProgressId = string & { readonly __brand: 'LessonProgressId' };
export type QuizAttemptId = string & { readonly __brand: 'QuizAttemptId' };
export type BadgeId = string & { readonly __brand: 'BadgeId' };
export type MotivationContentId = string & { readonly __brand: 'MotivationContentId' };
export type ForecastId = string & { readonly __brand: 'ForecastId' };
export type AlertId = string & { readonly __brand: 'AlertId' };
export type InterventionId = string & { readonly __brand: 'InterventionId' };
export type KnowledgeDocumentId = string & { readonly __brand: 'KnowledgeDocumentId' };
export type CitationId = string & { readonly __brand: 'CitationId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type RefreshTokenId = string & { readonly __brand: 'RefreshTokenId' };

// ============================================
// ENUMS (18 total)
// ============================================

export enum UserRole {
  candidate = 'candidate',
  fieldAssessor = 'field_assessor',
  leadership = 'leadership',
  admin = 'admin'
}

export enum NswPath {
  seal = 'seal',
  swcc = 'swcc'
}

export enum PstComponent {
  pushUps = 'push_ups',
  pullUps = 'pull_ups',
  run = 'run',
  swim = 'swim',
  underwater = 'underwater'
}

export enum RiskLevel {
  green = 'green',   // >80% likelihood
  yellow = 'yellow', // 50-80% likelihood
  red = 'red'        // <50% likelihood
}

export enum PeriodizationPhase {
  base = 'base',
  hypertrophy = 'hypertrophy',
  power = 'power',
  peak = 'peak',
  taper = 'taper'
}

export enum WorkoutIntensity {
  low = 'low',
  medium = 'medium',
  high = 'high',
  max = 'max'
}

export enum WorkoutStatus {
  scheduled = 'scheduled',
  inProgress = 'in_progress',
  completed = 'completed',
  skipped = 'skipped',
  partial = 'partial'
}

export enum EducationPhase {
  foundation = 'foundation',
  communityDeepDive = 'community_deep_dive',
  operationalReadiness = 'operational_readiness',
  leadershipCulture = 'leadership_culture'
}

export enum LessonStatus {
  locked = 'locked',
  available = 'available',
  inProgress = 'in_progress',
  completed = 'completed'
}

export enum MotivationContentType {
  dailyStatement = 'daily_statement',
  weeklyStory = 'weekly_story',
  thematicSeries = 'thematic_series',
  milestoneCelebration = 'milestone_celebration'
}

export enum AlertType {
  riskLevelChange = 'risk_level_change',
  inactivity = 'inactivity',
  missedWorkouts = 'missed_workouts',
  pstDecline = 'pst_decline',
  shipDateApproaching = 'ship_date_approaching',
  interventionNeeded = 'intervention_needed'
}

export enum AlertStatus {
  pending = 'pending',
  acknowledged = 'acknowledged',
  inProgress = 'in_progress',
  resolved = 'resolved',
  escalated = 'escalated'
}

export enum InterventionType {
  phoneCall = 'phone_call',
  email = 'email',
  planAdjustment = 'plan_adjustment',
  shipDateChange = 'ship_date_change',
  motivationalBoost = 'motivational_boost',
  inPersonMeeting = 'in_person_meeting'
}

export enum InterventionOutcome {
  pending = 'pending',
  successful = 'successful',
  partialSuccess = 'partial_success',
  unsuccessful = 'unsuccessful',
  noResponse = 'no_response'
}

export enum TrendDirection {
  improving = 'improving',
  stable = 'stable',
  declining = 'declining'
}

export enum ConfidenceLevel {
  high = 'high',     // >=95%
  medium = 'medium', // 80-95%
  low = 'low'        // <80%
}

export enum KnowledgeCategory {
  medalOfHonor = 'medal_of_honor',
  navyCross = 'navy_cross',
  history = 'history',
  leadership = 'leadership',
  training = 'training',
  operations = 'operations'
}

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
// CROSS-DOMAIN REFERENCES (11 Ref types)
// ============================================

export interface UserRef {
  id: UserId;
  email: string;
  role: UserRole;
}

export interface CandidateRef {
  id: CandidateId;
  userId: UserId;
  firstName: string;
  lastName: string;
  nswPath: NswPath;
  shipDate: ISODate;
  riskLevel: RiskLevel;
  divisionId: DivisionId;
}

export interface FieldAssessorRef {
  id: FieldAssessorId;
  userId: UserId;
  firstName: string;
  lastName: string;
  divisionId: DivisionId;
}

export interface DivisionRef {
  id: DivisionId;
  name: string;
  region: string;
}

export interface PstScoreRef {
  id: PstScoreId;
  candidateId: CandidateId;
  pushUps: number;
  pullUps: number;
  runSeconds: number;
  swimSeconds: number;
  underwaterPass: boolean;
  recordedAt: ISOTimestamp;
}

export interface FitnessPlanRef {
  id: FitnessPlanId;
  candidateId: CandidateId;
  currentPhase: PeriodizationPhase;
  weekNumber: number;
  isActive: boolean;
}

export interface LessonRef {
  id: LessonId;
  weekNumber: number;
  lessonNumber: number;
  title: string;
  phase: EducationPhase;
}

export interface AlertRef {
  id: AlertId;
  candidateId: CandidateId;
  type: AlertType;
  status: AlertStatus;
  createdAt: ISOTimestamp;
}

export interface ForecastRef {
  id: ForecastId;
  candidateId: CandidateId;
  likelihood: number;
  riskLevel: RiskLevel;
  calculatedAt: ISOTimestamp;
}

export interface CitationRef {
  id: CitationId;
  documentId: KnowledgeDocumentId;
  source: string;
  excerpt: string;
  confidence: number;
}

// ============================================
// STANDARD PATTERNS
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

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number;
}

export interface DateRange {
  startDate: ISODate;
  endDate: ISODate;
}

// ============================================
// CONSTANTS
// ============================================

export interface PstTargets {
  pushUps: number;
  pullUps: number;
  runSeconds: number;
  swimSeconds: number;
}

export interface PstStandards {
  minimum: PstTargets;
  competitive: PstTargets;
  optimal: PstTargets;
}

export const PST_STANDARDS: PstStandards = {
  minimum: {
    pushUps: 50,
    pullUps: 10,
    runSeconds: 630,  // 10:30
    swimSeconds: 720  // 12:00
  },
  competitive: {
    pushUps: 80,
    pullUps: 15,
    runSeconds: 570,  // 9:30
    swimSeconds: 600  // 10:00
  },
  optimal: {
    pushUps: 100,
    pullUps: 20,
    runSeconds: 540,  // 9:00
    swimSeconds: 540  // 9:00
  }
};

export const RISK_THRESHOLDS = {
  green: { min: 80, max: 100 },
  yellow: { min: 50, max: 79 },
  red: { min: 0, max: 49 }
} as const;

export const CONFIDENCE_THRESHOLD = 0.95;
export const HALLUCINATION_TOLERANCE = 0;

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

export function daysBetween(start: ISODate, end: ISODate): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// ID factory functions
export function createUserId(id: string): UserId {
  return `usr_${id}` as UserId;
}

export function createCandidateId(id: string): CandidateId {
  return `cand_${id}` as CandidateId;
}

export function createDivisionId(id: string): DivisionId {
  return `div_${id}` as DivisionId;
}
```

---

## Why This Works

### 1. Every Cross-Domain Entity Has a Branded ID

When the Analytics domain references a candidate, it uses `CandidateId`, not `string`. The compiler will error if someone accidentally passes a `UserId`.

### 2. Every Cross-Domain Reference is Minimal

`CandidateRef` has 8 fields, not 20+. Other domains only see what they need.

### 3. Every Enum is Centralized

`RiskLevel` is defined once. All 11 domains use the same definition. No domain can accidentally define `RiskLevel` differently.

### 4. Standard Patterns Ensure Consistency

Every domain uses `ApiResponse<T>` for responses. Every domain uses `PaginatedResponse<T>` for lists. No domain invents its own format.

---

## Result

- 11 parallel agents worked simultaneously
- Zero coordination between agents
- Zero type conflicts at compile time
- 17,089 lines of TypeScript compiled with 0 errors

This vocabulary was the ONLY coordination mechanism.
