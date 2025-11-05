import * as XLSX from "xlsx"
import type { CareerTrack, BaseSalary, RegionalAdjustment, JobLevel } from "@/types/salary-import"

export const EXCEL_SHEETS = {
	BASE_SALARIES: "Base Salaries 2025",
	CAREER_TRACKS: "Career Tracks",
	REGIONAL_ADJUSTMENTS: "Regional Adjustments",
	FLOAT_ADJUSTMENTS: "Float Level Adjustments",
	JOB_LEVELS: "Job Levels",
	CONFIG: "Config",
} as const

export interface ParsedSalaryData {
	baseSalaries: BaseSalary[]
	careerTracks: CareerTrack[]
	regionalAdjustments: RegionalAdjustment[]
	jobLevels: JobLevel[]
	config: {
		saudiExtraPercent: number
		managerAdjustmentRange: { min: number; max: number }
		riyadhRelocationBonus: number
		versionName: string
		effectiveDate: string
	}
}

export function parseExcelWorkbook(workbook: XLSX.WorkBook): ParsedSalaryData {
	// Check all required sheets exist
	const requiredSheets = Object.values(EXCEL_SHEETS)
	const missingSheets = requiredSheets.filter((sheet) => !workbook.Sheets[sheet])

	if (missingSheets.length > 0) {
		throw new Error(`Missing required sheets: ${missingSheets.join(", ")}`)
	}

	return {
		baseSalaries: parseBaseSalaries(workbook.Sheets[EXCEL_SHEETS.BASE_SALARIES]),
		careerTracks: parseCareerTracks(workbook.Sheets[EXCEL_SHEETS.CAREER_TRACKS]),
		regionalAdjustments: parseRegionalAdjustments(
			workbook.Sheets[EXCEL_SHEETS.REGIONAL_ADJUSTMENTS],
		),
		jobLevels: parseJobLevels(workbook.Sheets[EXCEL_SHEETS.JOB_LEVELS]),
		config: parseConfig(workbook.Sheets[EXCEL_SHEETS.CONFIG]),
	}
}

function parseBaseSalaries(sheet: XLSX.WorkSheet): BaseSalary[] {
	const data = XLSX.utils.sheet_to_json<any>(sheet)

	return data
		.map((row) => ({
			level: parseFloat(row.Level || row.level),
			min: parseInt(row.Min || row.min),
			average: parseInt(row.Average || row.average),
			max: parseInt(row.Max || row.max),
		}))
		.filter((item) => !isNaN(item.level))
}

function parseCareerTracks(sheet: XLSX.WorkSheet): CareerTrack[] {
	const data = XLSX.utils.sheet_to_json<any>(sheet)

	return data.map((row) => {
		const levelPercentages: Record<number, number> = {}

		// Extract L1%, L2%, etc. columns
		for (let i = 1; i <= 8; i++) {
			// Integer levels
			const intKey = `L${i}%`
			if (row[intKey] !== undefined) {
				levelPercentages[i] = parseFloat(row[intKey])
			}

			// Float levels
			const floatKey = `L${i}.5%`
			if (row[floatKey] !== undefined) {
				levelPercentages[i + 0.5] = parseFloat(row[floatKey])
			}
		}

		return {
			departmentKey: row["Track Key"] || row.trackKey,
			title: row["Track Name"] || row.title,
			description: row.Description || row.description || "",
			levelPercentages,
			floatLevelAdjustments: {
				4.5: { min: 500, max: -500 },
				5.5: { min: 700, max: -1000 },
				6.5: { min: 1000, max: -1750 },
				7.5: { min: 1250, max: -5000 },
			},
		}
	})
}

function parseRegionalAdjustments(sheet: XLSX.WorkSheet): RegionalAdjustment[] {
	const data = XLSX.utils.sheet_to_json<any>(sheet)

	return data.map((row) => {
		const adjustment: RegionalAdjustment = {
			value: row.Location || row.location || row.value,
			label: row["Arabic Label"] || row.label,
		}

		const dynamicFormula = row["Dynamic Formula"] || row.dynamicFormula

		if (dynamicFormula === "DYNAMIC" || dynamicFormula === "EGYPT") {
			adjustment.dynamicFormula = "EGYPT"
		} else {
			const percent = parseFloat(row["Adjustment %"] || row.percent || row.adjustmentPercent)
			if (!isNaN(percent)) {
				adjustment.percent = percent
			}
		}

		return adjustment
	})
}

function parseJobLevels(sheet: XLSX.WorkSheet): JobLevel[] {
	const data = XLSX.utils.sheet_to_json<any>(sheet)

	return data.map((row) => ({
		level: parseFloat(row.Level || row.level),
		titleAr: row["Title AR"] || row.titleAr,
		titleEn: row["Title EN"] || row.titleEn,
		managerialTitleAr: row["Managerial AR"] || row.managerialTitleAr,
		managerialTitleEn: row["Managerial EN"] || row.managerialTitleEn,
		techTitleAr: row["Tech AR"] || row.techTitleAr,
		techTitleEn: row["Tech EN"] || row.techTitleEn,
	}))
}

function parseConfig(sheet: XLSX.WorkSheet): ParsedSalaryData["config"] {
	const data = XLSX.utils.sheet_to_json<any>(sheet, { header: ["key", "value"] })

	const config: any = {
		managerAdjustmentRange: {},
	}

	data.forEach((row: any) => {
		const key = row.key
		const value = row.value

		if (!key || key === "Key") return // Skip header row

		switch (key) {
			case "saudi_bonus_percent":
				config.saudiExtraPercent = 1 + parseFloat(value) / 100
				break
			case "manager_adjustment_min":
				config.managerAdjustmentRange.min = parseFloat(value)
				break
			case "manager_adjustment_max":
				config.managerAdjustmentRange.max = parseFloat(value)
				break
			case "riyadh_relocation_bonus":
				config.riyadhRelocationBonus = parseFloat(value)
				break
			case "version_name":
				config.versionName = value
				break
			case "effective_date":
				config.effectiveDate = value
				break
		}
	})

	return config
}

export function generateTypeScriptFile(data: ParsedSalaryData): string {
	return `// Auto-generated from Excel import
// Generated at: ${new Date().toISOString()}
// Version: ${data.config.versionName}
// Effective Date: ${data.config.effectiveDate}

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
		data.regionalAdjustments.map((r) => {
			if (r.dynamicFormula === "EGYPT") {
				return {
					label: r.label,
					value: r.value,
					getPercent: "(level: number) => { if (level >= 4) return -40; if (level <= 1) return -50; const percent = -50 + (level - 1) * (10 / 3); return Math.round(percent * 100) / 100 }",
				}
			}
			return {
				label: r.label,
				value: r.value,
				percent: r.percent,
			}
		}),
		(key, value) => {
			if (typeof value === "string" && value.startsWith("(level: number)")) {
				return value
			}
			return value
		},
		4,
	).replace(/"getPercent": "\(level: number\) => \{[^"]+\}"/g, (match) => {
		return match.replace(/^"getPercent": "/, "getPercent: ").replace(/"$/, "")
	})}
`
}
