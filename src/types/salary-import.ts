// Type definitions for salary import system

export interface BaseSalary {
    level: number
    min: number
    average: number
    max: number
}

export interface FloatLevelAdjustments {
    4.5: { min: number; max: number }
    5.5: { min: number; max: number }
    6.5: { min: number; max: number }
    7.5: { min: number; max: number }
}

export interface CareerTrack {
    departmentKey: string
    title: string
    description: string
    levelPercentages: Record<number, number>
    floatLevelAdjustments: FloatLevelAdjustments
}

export interface RegionalAdjustment {
    value: string
    label: string
    percent?: number
    dynamicFormula?: string
    getPercent?: (level: number) => number
}

export interface JobLevel {
    level: number
    titleAr: string
    titleEn: string
    managerialTitleAr: string
    managerialTitleEn: string
    techTitleAr: string
    techTitleEn: string
}

export interface SalaryConfig {
    saudiExtraPercent: number
    managerAdjustmentRange: {
        min: number
        max: number
    }
    riyadhRelocationBonus: number
    versionName: string
    effectiveDate: string
}

export interface SalaryStructure {
    version: string
    effectiveDate: string
    createdAt?: string
    createdBy?: string
    baseSalaries: BaseSalary[]
    careerTracks: CareerTrack[]
    regionalAdjustments: RegionalAdjustment[]
    jobLevels: JobLevel[]
    config: SalaryConfig
}

export interface SalaryImpact {
    level: number
    track: string
    oldMin: number
    newMin: number
    oldMax: number
    newMax: number
    minDifference: number
    maxDifference: number
    minPercentChange: number
    maxPercentChange: number
}

export interface ImportValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    data?: SalaryStructure
    preview?: {
        changedFields: string[]
        affectedLevels: number[]
        salaryImpact: SalaryImpact[]
        summary: {
            totalBaseSalaryChanges: number
            totalTrackChanges: number
            totalRegionalChanges: number
            averageIncreasePercent: number
        }
    }
}

export interface SalaryVersion {
    id: string
    versionName: string
    effectiveDate: string
    isActive: boolean
    createdAt: string
    createdBy?: string
    metadata?: {
        filename?: string
        uploadedAt?: string
        notes?: string
    }
}

export interface AuditLogEntry {
    id: string
    versionId: string
    action: 'created' | 'activated' | 'deactivated' | 'deleted' | 'updated'
    performedBy: string
    performedAt: string
    changes?: Record<string, any>
    notes?: string
}

// Excel Sheet Names (constants)
export const EXCEL_SHEETS = {
    BASE_SALARIES: 'Base Salaries 2025',
    CAREER_TRACKS: 'Career Tracks',
    REGIONAL_ADJUSTMENTS: 'Regional Adjustments',
    FLOAT_ADJUSTMENTS: 'Float Level Adjustments',
    JOB_LEVELS: 'Job Levels',
    CONFIG: 'Config'
} as const

// Validation error types
export type ValidationErrorType =
    | 'MISSING_SHEET'
    | 'INVALID_FORMAT'
    | 'MISSING_REQUIRED_FIELD'
    | 'INVALID_VALUE_RANGE'
    | 'DUPLICATE_KEY'
    | 'INCONSISTENT_DATA'
    | 'MISSING_LEVEL'

export interface ValidationError {
    type: ValidationErrorType
    sheet?: string
    row?: number
    column?: string
    field?: string
    message: string
    value?: any
}

export interface ValidationWarning {
    sheet?: string
    row?: number
    field?: string
    message: string
    suggestion?: string
}
