# Salary Data Import System - Design Document

## Overview

This document outlines a flexible, production-ready system for importing Excel sheets to update the salary calculator's data structure, adjustment policies, and regional cost-of-living adjustments.

---

## 🎯 Design Goals

1. **Flexibility**: Support changing salary structures without code changes
2. **Validation**: Ensure data integrity before applying changes
3. **Versioning**: Track historical changes and enable rollbacks
4. **Audit Trail**: Know who changed what and when
5. **Type Safety**: Maintain TypeScript type checking
6. **Performance**: Keep calculator fast (sub-100ms calculations)
7. **User-Friendly**: Non-technical HR staff can update data
8. **Preview**: See changes before applying them

---

## 📊 Implementation Phases

### **Phase 1: Script-Based Import** ⚡ (Start Here)
- CLI script to parse Excel files
- Validate against schema
- Generate TypeScript file or JSON
- Commit to git for version control
- **Effort**: 1-2 days
- **Best for**: Infrequent updates (quarterly/annually)

### **Phase 2: Admin Panel + Database** 🚀 (Recommended)
- Web interface for Excel upload
- Store in Supabase with versioning
- Preview changes before activation
- Activate/deactivate versions
- **Effort**: 3-5 days
- **Best for**: Frequent updates, multiple HR users

### **Phase 3: Full Salary Management** 🏢 (Enterprise)
- Approval workflow
- Impact analysis (how many employees affected)
- Historical comparisons
- Salary simulation tools
- **Effort**: 2-3 weeks
- **Best for**: Large organizations, compliance requirements

---

## 🏗️ Architecture Design

### **Option A: File-Based (Phase 1)**

```
Excel File (.xlsx)
    ↓
Node.js Script (with validation)
    ↓
Parse & Transform
    ↓
Validate Against Schema (Zod)
    ↓
├─→ Generate TypeScript (salary-data.ts)
└─→ Generate JSON (salary-data.json)
    ↓
Git Commit
    ↓
Deploy (Vercel auto-deploys on push)
```

**Pros:**
- Simple to implement
- Git provides version control
- Type-safe at build time
- No database needed

**Cons:**
- Requires developer to run script
- Needs rebuild/deploy for changes
- No runtime version switching

---

### **Option B: Database-Backed (Phase 2)** ⭐ **RECOMMENDED**

```
Excel Upload (Admin Panel)
    ↓
Next.js API Route
    ↓
Parse & Validate (Server-Side)
    ↓
Preview Changes (Show diff)
    ↓
User Confirms
    ↓
Store in Supabase
├─→ salary_structures (versioned)
├─→ career_tracks (versioned)
├─→ regional_adjustments (versioned)
└─→ salary_versions (metadata)
    ↓
Calculator reads from DB (cached)
    ↓
Redis/In-Memory Cache (optional)
```

**Pros:**
- No redeploy needed
- Runtime version switching
- Historical tracking
- Rollback capability
- Multi-user support

**Cons:**
- More complex setup
- Database dependency
- Need to handle caching

---

## 📁 Excel File Format Specification

### **Expected Sheet Structure**

```
Sheet 1: "Base Salaries 2025"
─────────────────────────────────────────
| Level | Min   | Average | Max   |
|-------|-------|---------|-------|
| 1     | 8000  | 9000    | 10000 |
| 2     | 10500 | 12000   | 13500 |
| ...   | ...   | ...     | ...   |

Sheet 2: "Career Tracks"
─────────────────────────────────────────
| Track Key | Track Name | Description | L1 % | L2 % | L3 % | ... |
|-----------|------------|-------------|------|------|------|-----|
| base-2025 | المسار الأساسي | ... | 0 | 0 | 0 | ... |
| tech      | مسار التقنية | ... | 20 | 15 | 20 | ... |
| ...       | ...        | ... | ... | ... | ... | ... |

Sheet 3: "Regional Adjustments"
─────────────────────────────────────────
| Location   | Arabic Label | Adjustment % | Dynamic Formula |
|------------|--------------|--------------|-----------------|
| riyadh     | الرياض       | 0            |                 |
| egypt      | مصر          | -40          | DYNAMIC         |
| ...        | ...          | ...          | ...             |

Sheet 4: "Float Level Adjustments"
─────────────────────────────────────────
| Track Key | Level | Min Adjustment | Max Adjustment |
|-----------|-------|----------------|----------------|
| base-2025 | 4.5   | 500            | -500           |
| base-2025 | 5.5   | 700            | -1000          |
| ...       | ...   | ...            | ...            |

Sheet 5: "Job Levels"
─────────────────────────────────────────
| Level | Title AR | Title EN | Managerial AR | Managerial EN | Tech AR | Tech EN |
|-------|----------|----------|---------------|---------------|---------|---------|
| 1     | مساعد    | Associate| مساعد         | Associate     | مبتدئ   | Junior  |
| ...   | ...      | ...      | ...           | ...           | ...     | ...     |

Sheet 6: "Config"
─────────────────────────────────────────
| Key                      | Value |
|--------------------------|-------|
| saudi_bonus_percent      | 11    |
| manager_adjustment_min   | -5    |
| manager_adjustment_max   | 5     |
| riyadh_relocation_bonus  | 10    |
| version_name             | 2025Q1|
| effective_date           | 2025-01-01 |
```

---

## 🔒 Data Validation Schema

### **TypeScript Types**

```typescript
// src/types/salary-import.ts

export interface BaseSalary {
    level: number
    min: number
    average: number
    max: number
}

export interface CareerTrack {
    departmentKey: string
    title: string
    description: string
    levelPercentages: Record<number, number>
    floatLevelAdjustments: {
        [key in 4.5 | 5.5 | 6.5 | 7.5]: {
            min: number
            max: number
        }
    }
}

export interface RegionalAdjustment {
    value: string
    label: string
    percent?: number
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
    managerAdjustmentRange: { min: number; max: number }
    riyadhRelocationBonus: number
    versionName: string
    effectiveDate: string
}

export interface SalaryStructure {
    version: string
    effectiveDate: string
    createdAt: string
    createdBy?: string
    baseSalaries: BaseSalary[]
    careerTracks: CareerTrack[]
    regionalAdjustments: RegionalAdjustment[]
    jobLevels: JobLevel[]
    config: SalaryConfig
}

export interface ImportValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    data?: SalaryStructure
    preview?: {
        changedFields: string[]
        affectedLevels: number[]
        salaryImpact: {
            level: number
            track: string
            oldMin: number
            newMin: number
            difference: number
            percentChange: number
        }[]
    }
}
```

---

## 🛠️ Phase 1 Implementation: Script-Based Import

### **1. Install Dependencies**

```bash
pnpm add -D xlsx zod
pnpm add -D @types/node
```

### **2. Create Import Script**

**File: `scripts/import-salary-data.ts`**

```typescript
import * as XLSX from 'xlsx'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

// Zod Validation Schemas
const BaseSalarySchema = z.object({
    level: z.number().min(1).max(10),
    min: z.number().positive(),
    average: z.number().positive(),
    max: z.number().positive(),
}).refine(data => data.min <= data.average && data.average <= data.max, {
    message: "Salary range must be: min <= average <= max"
})

const CareerTrackSchema = z.object({
    departmentKey: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    levelPercentages: z.record(z.number()),
    floatLevelAdjustments: z.object({
        '4.5': z.object({ min: z.number(), max: z.number() }),
        '5.5': z.object({ min: z.number(), max: z.number() }),
        '6.5': z.object({ min: z.number(), max: z.number() }),
        '7.5': z.object({ min: z.number(), max: z.number() }),
    })
})

const RegionalAdjustmentSchema = z.object({
    value: z.string(),
    label: z.string(),
    percent: z.number().optional(),
    dynamicFormula: z.string().optional()
})

const JobLevelSchema = z.object({
    level: z.number(),
    titleAr: z.string(),
    titleEn: z.string(),
    managerialTitleAr: z.string(),
    managerialTitleEn: z.string(),
    techTitleAr: z.string(),
    techTitleEn: z.string(),
})

const ConfigSchema = z.object({
    saudiExtraPercent: z.number().min(1).max(1.5),
    managerAdjustmentRange: z.object({
        min: z.number().min(-10),
        max: z.number().max(10)
    }),
    riyadhRelocationBonus: z.number().min(0).max(20),
    versionName: z.string(),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const SalaryStructureSchema = z.object({
    version: z.string(),
    effectiveDate: z.string(),
    baseSalaries: z.array(BaseSalarySchema),
    careerTracks: z.array(CareerTrackSchema),
    regionalAdjustments: z.array(RegionalAdjustmentSchema),
    jobLevels: z.array(JobLevelSchema),
    config: ConfigSchema
})

// Parser Functions
function parseBaseSalaries(sheet: XLSX.WorkSheet): any[] {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    const headers = data[0] as string[]
    const rows = data.slice(1)

    return rows.map((row: any) => ({
        level: parseFloat(row[0]),
        min: parseFloat(row[1]),
        average: parseFloat(row[2]),
        max: parseFloat(row[3])
    })).filter(item => !isNaN(item.level))
}

function parseCareerTracks(sheet: XLSX.WorkSheet): any[] {
    const data = XLSX.utils.sheet_to_json(sheet)
    return data.map((row: any) => {
        const levelPercentages: Record<number, number> = {}

        // Extract L1%, L2%, etc. columns
        for (let i = 1; i <= 8; i++) {
            const key = `L${i}%` as keyof typeof row
            if (row[key] !== undefined) {
                levelPercentages[i] = parseFloat(row[key])
            }
            // Also check for float levels
            const floatKey = `L${i}.5%` as keyof typeof row
            if (row[floatKey] !== undefined) {
                levelPercentages[i + 0.5] = parseFloat(row[floatKey])
            }
        }

        return {
            departmentKey: row['Track Key'],
            title: row['Track Name'],
            description: row['Description'],
            levelPercentages,
            floatLevelAdjustments: {
                '4.5': { min: 500, max: -500 }, // Default values
                '5.5': { min: 700, max: -1000 },
                '6.5': { min: 1000, max: -1750 },
                '7.5': { min: 1250, max: -5000 }
            }
        }
    })
}

function parseRegionalAdjustments(sheet: XLSX.WorkSheet): any[] {
    const data = XLSX.utils.sheet_to_json(sheet)
    return data.map((row: any) => {
        const adjustment: any = {
            value: row['Location'],
            label: row['Arabic Label'],
        }

        if (row['Dynamic Formula'] === 'DYNAMIC') {
            // Special case for Egypt or other dynamic adjustments
            adjustment.dynamicFormula = 'EGYPT'
        } else {
            adjustment.percent = parseFloat(row['Adjustment %'])
        }

        return adjustment
    })
}

function parseJobLevels(sheet: XLSX.WorkSheet): any[] {
    const data = XLSX.utils.sheet_to_json(sheet)
    return data.map((row: any) => ({
        level: parseFloat(row['Level']),
        titleAr: row['Title AR'],
        titleEn: row['Title EN'],
        managerialTitleAr: row['Managerial AR'],
        managerialTitleEn: row['Managerial EN'],
        techTitleAr: row['Tech AR'],
        techTitleEn: row['Tech EN'],
    }))
}

function parseConfig(sheet: XLSX.WorkSheet): any {
    const data = XLSX.utils.sheet_to_json(sheet, { header: ['key', 'value'] })
    const config: any = {}

    data.forEach((row: any) => {
        if (row.key === 'saudi_bonus_percent') {
            config.saudiExtraPercent = 1 + (parseFloat(row.value) / 100)
        } else if (row.key === 'manager_adjustment_min') {
            config.managerAdjustmentRange = config.managerAdjustmentRange || {}
            config.managerAdjustmentRange.min = parseFloat(row.value)
        } else if (row.key === 'manager_adjustment_max') {
            config.managerAdjustmentRange = config.managerAdjustmentRange || {}
            config.managerAdjustmentRange.max = parseFloat(row.value)
        } else if (row.key === 'riyadh_relocation_bonus') {
            config.riyadhRelocationBonus = parseFloat(row.value)
        } else if (row.key === 'version_name') {
            config.versionName = row.value
        } else if (row.key === 'effective_date') {
            config.effectiveDate = row.value
        }
    })

    return config
}

// Main Import Function
export async function importSalaryData(filePath: string): Promise<any> {
    console.log(`📂 Reading Excel file: ${filePath}`)

    const workbook = XLSX.readFile(filePath)

    // Parse each sheet
    const baseSalaries = parseBaseSalaries(workbook.Sheets['Base Salaries 2025'])
    const careerTracks = parseCareerTracks(workbook.Sheets['Career Tracks'])
    const regionalAdjustments = parseRegionalAdjustments(workbook.Sheets['Regional Adjustments'])
    const jobLevels = parseJobLevels(workbook.Sheets['Job Levels'])
    const config = parseConfig(workbook.Sheets['Config'])

    const salaryStructure = {
        version: config.versionName,
        effectiveDate: config.effectiveDate,
        baseSalaries,
        careerTracks,
        regionalAdjustments,
        jobLevels,
        config
    }

    // Validate
    console.log('✅ Validating data...')
    try {
        const validated = SalaryStructureSchema.parse(salaryStructure)
        console.log('✅ Validation passed!')
        return validated
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Validation failed:')
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`)
            })
        }
        throw error
    }
}

// Generate TypeScript File
function generateTypeScriptFile(data: any, outputPath: string) {
    const content = `// Auto-generated from Excel import
// Generated at: ${new Date().toISOString()}
// Version: ${data.version}
// Effective Date: ${data.effectiveDate}

export interface FloatLevelAdjustments {
    4.5: { min: number; max: number }
    5.5: { min: number; max: number }
    6.5: { min: number; max: number }
    7.5: { min: number; max: number }
}

export interface DepartmentData {
    departmentKey: string
    title: string
    description: string
    levelPercentages: {
        [key: number]: number
    }
    floatLevelAdjustments: FloatLevelAdjustments
}

export const baseSalaries2025 = ${JSON.stringify(data.baseSalaries, null, 4)}

export const saudiExtraPercent = ${data.config.saudiExtraPercent}

export const levels = ${JSON.stringify(data.jobLevels, null, 4)}

export const newSalaries: DepartmentData[] = ${JSON.stringify(data.careerTracks, null, 4)}

export const regionAdjustments = ${JSON.stringify(
    data.regionalAdjustments.map((r: any) => {
        if (r.dynamicFormula === 'EGYPT') {
            return {
                label: r.label,
                value: r.value,
                getPercent: (level: number) => {
                    if (level >= 4) return -40
                    if (level <= 1) return -50
                    const percent = -50 + (level - 1) * (10 / 3)
                    return Math.round(percent * 100) / 100
                }
            }
        }
        return {
            label: r.label,
            value: r.value,
            percent: r.percent
        }
    }),
    (key, value) => {
        if (typeof value === 'function') {
            return value.toString()
        }
        return value
    },
    4
).replace(/"getPercent": "(.+?)"/g, '"getPercent": $1')}
`

    fs.writeFileSync(outputPath, content, 'utf-8')
    console.log(`✅ Generated TypeScript file: ${outputPath}`)
}

// CLI Entry Point
async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.error('Usage: ts-node scripts/import-salary-data.ts <excel-file-path>')
        process.exit(1)
    }

    const excelFilePath = args[0]

    if (!fs.existsSync(excelFilePath)) {
        console.error(`❌ File not found: ${excelFilePath}`)
        process.exit(1)
    }

    try {
        const data = await importSalaryData(excelFilePath)

        // Generate TypeScript file
        const outputPath = path.join(__dirname, '../src/components/salary-calculator/salary-data.ts')
        generateTypeScriptFile(data, outputPath)

        // Also save as JSON for reference
        const jsonPath = path.join(__dirname, '../src/components/salary-calculator/salary-data.json')
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
        console.log(`✅ Saved JSON: ${jsonPath}`)

        console.log('\n✅ Import completed successfully!')
        console.log('Next steps:')
        console.log('  1. Review the generated files')
        console.log('  2. Test the salary calculator')
        console.log('  3. Commit changes to git')
        console.log('  4. Deploy to production')

    } catch (error) {
        console.error('❌ Import failed:', error)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}
```

### **3. Usage**

```bash
# Run the import script
npx ts-node scripts/import-salary-data.ts path/to/salary-structure.xlsx

# Output:
# ✅ Validation passed!
# ✅ Generated TypeScript file: src/components/salary-calculator/salary-data.ts
# ✅ Saved JSON: src/components/salary-calculator/salary-data.json
```

---

## 🚀 Phase 2 Implementation: Admin Panel + Database

### **1. Database Schema (Supabase)**

```sql
-- Salary versions table (tracks all versions)
CREATE TABLE salary_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_name VARCHAR(50) NOT NULL UNIQUE,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB,
    UNIQUE(is_active) WHERE is_active = true -- Only one active version
);

-- Base salaries table
CREATE TABLE salary_base_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id) ON DELETE CASCADE,
    level NUMERIC(3,1) NOT NULL,
    min_salary INTEGER NOT NULL,
    average_salary INTEGER NOT NULL,
    max_salary INTEGER NOT NULL,
    UNIQUE(version_id, level)
);

-- Career tracks table
CREATE TABLE salary_career_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id) ON DELETE CASCADE,
    department_key VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level_percentages JSONB NOT NULL,
    float_level_adjustments JSONB NOT NULL,
    UNIQUE(version_id, department_key)
);

-- Regional adjustments table
CREATE TABLE salary_regional_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id) ON DELETE CASCADE,
    location_key VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    adjustment_percent NUMERIC(5,2),
    dynamic_formula VARCHAR(50),
    UNIQUE(version_id, location_key)
);

-- Job levels table
CREATE TABLE salary_job_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id) ON DELETE CASCADE,
    level NUMERIC(3,1) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    managerial_title_ar VARCHAR(200) NOT NULL,
    managerial_title_en VARCHAR(200) NOT NULL,
    tech_title_ar VARCHAR(200) NOT NULL,
    tech_title_en VARCHAR(200) NOT NULL,
    UNIQUE(version_id, level)
);

-- Configuration table
CREATE TABLE salary_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id) ON DELETE CASCADE,
    saudi_extra_percent NUMERIC(4,2) NOT NULL,
    manager_adjustment_min INTEGER NOT NULL,
    manager_adjustment_max INTEGER NOT NULL,
    riyadh_relocation_bonus INTEGER NOT NULL,
    UNIQUE(version_id)
);

-- Audit log table
CREATE TABLE salary_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID REFERENCES salary_versions(id),
    action VARCHAR(50) NOT NULL, -- 'created', 'activated', 'deactivated', 'deleted'
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    changes JSONB,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_salary_versions_active ON salary_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_base_salaries_version ON salary_base_salaries(version_id);
CREATE INDEX idx_career_tracks_version ON salary_career_tracks(version_id);
CREATE INDEX idx_regional_adjustments_version ON salary_regional_adjustments(version_id);
CREATE INDEX idx_job_levels_version ON salary_job_levels(version_id);
CREATE INDEX idx_audit_log_version ON salary_audit_log(version_id);
```

### **2. Server Action for Import**

**File: `src/app/actions/salary-import.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function uploadSalaryStructure(formData: FormData) {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file provided' }
    }

    try {
        // Read Excel file
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer)

        // Parse data (same parsing logic as Phase 1)
        const data = parseExcelWorkbook(workbook)

        // Validate
        const validated = SalaryStructureSchema.parse(data)

        // Create new version
        const { data: version, error: versionError } = await supabase
            .from('salary_versions')
            .insert({
                version_name: validated.version,
                effective_date: validated.effectiveDate,
                is_active: false,
                created_by: user.id,
                metadata: {
                    filename: file.name,
                    uploadedAt: new Date().toISOString()
                }
            })
            .select()
            .single()

        if (versionError) throw versionError

        // Insert base salaries
        await supabase.from('salary_base_salaries').insert(
            validated.baseSalaries.map(s => ({
                version_id: version.id,
                level: s.level,
                min_salary: s.min,
                average_salary: s.average,
                max_salary: s.max
            }))
        )

        // Insert career tracks
        await supabase.from('salary_career_tracks').insert(
            validated.careerTracks.map(t => ({
                version_id: version.id,
                department_key: t.departmentKey,
                title: t.title,
                description: t.description,
                level_percentages: t.levelPercentages,
                float_level_adjustments: t.floatLevelAdjustments
            }))
        )

        // Insert regional adjustments
        await supabase.from('salary_regional_adjustments').insert(
            validated.regionalAdjustments.map(r => ({
                version_id: version.id,
                location_key: r.value,
                label: r.label,
                adjustment_percent: r.percent,
                dynamic_formula: r.dynamicFormula
            }))
        )

        // Insert job levels
        await supabase.from('salary_job_levels').insert(
            validated.jobLevels.map(l => ({
                version_id: version.id,
                level: l.level,
                title_ar: l.titleAr,
                title_en: l.titleEn,
                managerial_title_ar: l.managerialTitleAr,
                managerial_title_en: l.managerialTitleEn,
                tech_title_ar: l.techTitleAr,
                tech_title_en: l.techTitleEn
            }))
        )

        // Insert config
        await supabase.from('salary_config').insert({
            version_id: version.id,
            saudi_extra_percent: validated.config.saudiExtraPercent,
            manager_adjustment_min: validated.config.managerAdjustmentRange.min,
            manager_adjustment_max: validated.config.managerAdjustmentRange.max,
            riyadh_relocation_bonus: validated.config.riyadhRelocationBonus
        })

        // Log audit
        await supabase.from('salary_audit_log').insert({
            version_id: version.id,
            action: 'created',
            performed_by: user.id,
            notes: `Uploaded from file: ${file.name}`
        })

        revalidatePath('/admin/salary-management')

        return {
            success: true,
            version: version.version_name,
            versionId: version.id
        }

    } catch (error) {
        console.error('Import error:', error)
        return {
            error: error instanceof Error ? error.message : 'Import failed'
        }
    }
}

export async function activateSalaryVersion(versionId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Deactivate all versions
    await supabase
        .from('salary_versions')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    // Activate selected version
    const { error } = await supabase
        .from('salary_versions')
        .update({ is_active: true })
        .eq('id', versionId)

    if (error) {
        return { error: error.message }
    }

    // Log audit
    await supabase.from('salary_audit_log').insert({
        version_id: versionId,
        action: 'activated',
        performed_by: user.id
    })

    revalidatePath('/salary-calculator')
    revalidatePath('/admin/salary-management')

    return { success: true }
}

export async function getSalaryVersions() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('salary_versions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function getActiveSalaryStructure() {
    const supabase = createClient()

    // Get active version
    const { data: version } = await supabase
        .from('salary_versions')
        .select('*')
        .eq('is_active', true)
        .single()

    if (!version) {
        return { error: 'No active salary version' }
    }

    // Fetch all related data
    const [baseSalaries, careerTracks, regionalAdjustments, jobLevels, config] = await Promise.all([
        supabase.from('salary_base_salaries').select('*').eq('version_id', version.id),
        supabase.from('salary_career_tracks').select('*').eq('version_id', version.id),
        supabase.from('salary_regional_adjustments').select('*').eq('version_id', version.id),
        supabase.from('salary_job_levels').select('*').eq('version_id', version.id),
        supabase.from('salary_config').select('*').eq('version_id', version.id).single()
    ])

    return {
        data: {
            version: version.version_name,
            effectiveDate: version.effective_date,
            baseSalaries: baseSalaries.data,
            careerTracks: careerTracks.data,
            regionalAdjustments: regionalAdjustments.data,
            jobLevels: jobLevels.data,
            config: config.data
        }
    }
}
```

### **3. Admin Upload Interface**

**File: `src/app/admin/salary-management/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Upload, Card, Table, Button, Tag, Space, Modal, Alert } from 'antd'
import { UploadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { uploadSalaryStructure, activateSalaryVersion, getSalaryVersions } from '@/app/actions/salary-import'

export default function SalaryManagementPage() {
    const [uploading, setUploading] = useState(false)
    const [versions, setVersions] = useState([])

    const handleUpload = async (file: File) => {
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadSalaryStructure(formData)

        if (result.success) {
            Modal.success({
                title: 'Upload Successful',
                content: `Version ${result.version} has been uploaded. Preview and activate when ready.`
            })
            // Refresh versions list
            loadVersions()
        } else {
            Modal.error({
                title: 'Upload Failed',
                content: result.error
            })
        }

        setUploading(false)
        return false // Prevent default upload
    }

    const handleActivate = async (versionId: string) => {
        Modal.confirm({
            title: 'Activate Salary Version',
            content: 'This will make this version active and deactivate all others. Continue?',
            onOk: async () => {
                const result = await activateSalaryVersion(versionId)
                if (result.success) {
                    Modal.success({
                        content: 'Version activated successfully!'
                    })
                    loadVersions()
                }
            }
        })
    }

    const loadVersions = async () => {
        const result = await getSalaryVersions()
        if (result.data) {
            setVersions(result.data)
        }
    }

    const columns = [
        {
            title: 'Version',
            dataIndex: 'version_name',
            key: 'version_name'
        },
        {
            title: 'Effective Date',
            dataIndex: 'effective_date',
            key: 'effective_date'
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean) => (
                active ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
                ) : (
                    <Tag icon={<ClockCircleOutlined />} color="default">Inactive</Tag>
                )
            )
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString('ar-SA')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: any) => (
                <Space>
                    {!record.is_active && (
                        <Button
                            type="primary"
                            onClick={() => handleActivate(record.id)}
                        >
                            Activate
                        </Button>
                    )}
                    <Button>Preview</Button>
                    <Button danger>Delete</Button>
                </Space>
            )
        }
    ]

    return (
        <div className="p-8">
            <Card title="إدارة سلم الرواتب" className="mb-4">
                <Alert
                    message="Upload Excel File"
                    description="Upload a new salary structure Excel file. The file will be validated and stored as a new version. You can preview and activate it when ready."
                    type="info"
                    showIcon
                    className="mb-4"
                />

                <Upload.Dragger
                    beforeUpload={handleUpload}
                    accept=".xlsx,.xls"
                    maxCount={1}
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag Excel file to upload</p>
                    <p className="ant-upload-hint">
                        Supports .xlsx and .xls files. File will be validated before import.
                    </p>
                </Upload.Dragger>
            </Card>

            <Card title="Salary Versions">
                <Table
                    columns={columns}
                    dataSource={versions}
                    rowKey="id"
                    loading={uploading}
                />
            </Card>
        </div>
    )
}
```

### **4. Update Calculator to Use Database**

**File: `src/components/salary-calculator/CalculatorPage.tsx`** (modified)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getActiveSalaryStructure } from '@/app/actions/salary-import'

export default function CalculatorPage() {
    const [salaryData, setSalaryData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSalaryData()
    }, [])

    const loadSalaryData = async () => {
        const result = await getActiveSalaryStructure()
        if (result.data) {
            setSalaryData(result.data)
        }
        setLoading(false)
    }

    if (loading) {
        return <div>Loading salary data...</div>
    }

    // Use salaryData instead of imported constants
    // ... rest of calculator logic
}
```

---

## 📋 Implementation Checklist

### **Phase 1: Script-Based (Week 1)**
- [ ] Install dependencies (xlsx, zod)
- [ ] Create Excel template with proper sheet names
- [ ] Build import script with validation
- [ ] Test with sample data
- [ ] Document usage for HR team
- [ ] Add to npm scripts: `"import-salary": "ts-node scripts/import-salary-data.ts"`

### **Phase 2: Database-Backed (Week 2-3)**
- [ ] Create Supabase database schema
- [ ] Build server actions for CRUD operations
- [ ] Create admin upload interface
- [ ] Add version management UI
- [ ] Implement activation/deactivation
- [ ] Update calculator to read from database
- [ ] Add caching layer (Redis or in-memory)
- [ ] Test with multiple versions

### **Phase 3: Production Hardening (Week 4)**
- [ ] Add comprehensive error handling
- [ ] Implement audit logging
- [ ] Add preview/diff functionality
- [ ] Create rollback mechanism
- [ ] Add impact analysis (affected employees)
- [ ] Implement approval workflow
- [ ] Add automated backups
- [ ] Performance testing and optimization

---

## 🎯 Recommendation

**Start with Phase 1** for immediate value:
- Low complexity, high ROI
- Git provides version control
- Can be done in 1-2 days

**Upgrade to Phase 2** when:
- HR needs to update frequently (monthly/quarterly)
- Multiple people need to update salary data
- You need runtime version switching
- Audit trail is critical

**Consider Phase 3** for:
- Large organizations (100+ employees)
- Compliance requirements
- Complex approval workflows
- Detailed impact analysis needed

---

## 💰 Cost-Benefit Analysis

| Approach | Implementation Time | Maintenance | Flexibility | Cost |
|----------|-------------------|-------------|-------------|------|
| **Phase 1: Script** | 1-2 days | Low | Medium | Free |
| **Phase 2: Database** | 3-5 days | Medium | High | $0-25/month (Supabase) |
| **Phase 3: Enterprise** | 2-3 weeks | High | Very High | $25-100/month |

---

## 🚦 Next Steps

1. **Create Excel template** with proper structure
2. **Implement Phase 1 script** for immediate use
3. **Test thoroughly** with current salary data
4. **Train HR team** on Excel format and upload process
5. **Plan Phase 2** if needed based on usage

Would you like me to:
1. Create the actual Excel template with sample data?
2. Implement the complete Phase 1 script?
3. Set up the Supabase schema for Phase 2?
4. Create a detailed migration plan?
