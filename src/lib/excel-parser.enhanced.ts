/**
 * Enhanced Excel parser with comprehensive error handling and edge case support
 */

import * as XLSX from "xlsx"
import type { CareerTrack, BaseSalary, RegionalAdjustment, JobLevel } from "@/types/salary-import"
import {
	FileParseError,
	SheetNotFoundError,
	InvalidDataError,
	MissingRequiredFieldError,
} from "./errors/salary-import-errors"
import { logger, performance } from "./logger/salary-import-logger"

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

/**
 * Parse Excel workbook with comprehensive error handling
 */
export function parseExcelWorkbook(workbook: XLSX.WorkBook): ParsedSalaryData {
	try {
		logger.startOperation("Parse Excel Workbook")
		performance.start("parse-workbook")

		// Validate all sheets exist
		validateSheetsExist(workbook)

		// Parse each sheet with error handling
		const result = {
			baseSalaries: performance.measure("parse-base-salaries", () =>
				parseBaseSalaries(workbook.Sheets[EXCEL_SHEETS.BASE_SALARIES]),
			),
			careerTracks: performance.measure("parse-career-tracks", () =>
				parseCareerTracks(workbook.Sheets[EXCEL_SHEETS.CAREER_TRACKS]),
			),
			regionalAdjustments: performance.measure("parse-regional-adjustments", () =>
				parseRegionalAdjustments(workbook.Sheets[EXCEL_SHEETS.REGIONAL_ADJUSTMENTS]),
			),
			jobLevels: performance.measure("parse-job-levels", () =>
				parseJobLevels(workbook.Sheets[EXCEL_SHEETS.JOB_LEVELS]),
			),
			config: performance.measure("parse-config", () =>
				parseConfig(workbook.Sheets[EXCEL_SHEETS.CONFIG]),
			),
		}

		performance.end("parse-workbook")
		logger.endOperation("Parse Excel Workbook", true, {
			baseSalariesCount: result.baseSalaries.length,
			careerTracksCount: result.careerTracks.length,
			regionalAdjustmentsCount: result.regionalAdjustments.length,
			jobLevelsCount: result.jobLevels.length,
		})

		return result
	} catch (error) {
		logger.error("Parse Excel Workbook", "Failed to parse workbook", error)
		throw error
	}
}

function validateSheetsExist(workbook: XLSX.WorkBook) {
	const requiredSheets = Object.values(EXCEL_SHEETS)
	const availableSheets = workbook.SheetNames
	const missingSheets = requiredSheets.filter((sheet) => !workbook.Sheets[sheet])

	if (missingSheets.length > 0) {
		logger.error("Sheet Validation", "Missing required sheets", {
			missing: missingSheets,
			available: availableSheets,
		})
		throw new SheetNotFoundError(missingSheets[0], availableSheets)
	}

	logger.info("Sheet Validation", "All required sheets found")
}

/**
 * Safely get cell value with type checking and defaults
 */
function safeGetValue<T>(
	row: any,
	keys: string[],
	type: "string" | "number" | "boolean",
	defaultValue?: T,
): T {
	for (const key of keys) {
		const value = row[key]
		if (value !== undefined && value !== null && value !== "") {
			switch (type) {
				case "number":
					const num = Number(value)
					if (!isNaN(num)) return num as T
					break
				case "string":
					return String(value).trim() as T
				case "boolean":
					return Boolean(value) as T
			}
		}
	}

	if (defaultValue !== undefined) {
		return defaultValue
	}

	throw new Error(`No valid value found for keys: ${keys.join(", ")}`)
}

function parseBaseSalaries(sheet: XLSX.WorkSheet): BaseSalary[] {
	try {
		logger.info("Parse Base Salaries", "Starting parse")

		// Convert sheet to JSON
		const data = XLSX.utils.sheet_to_json<any>(sheet)

		if (data.length === 0) {
			throw new FileParseError(
				"Base Salaries sheet is empty",
				{ sheet: EXCEL_SHEETS.BASE_SALARIES },
				"Add at least one salary level to the sheet",
			)
		}

		const result: BaseSalary[] = []
		const errors: string[] = []

		data.forEach((row, index) => {
			const rowNum = index + 2 // +2 for header and 0-index

			try {
				// Try multiple possible column names for flexibility
				const level = safeGetValue<number>(row, ["Level", "level", "المستوى"], "number")
				const min = safeGetValue<number>(
					row,
					["Min", "min", "Minimum", "minimum", "الحد الأدنى"],
					"number",
				)
				const average = safeGetValue<number>(
					row,
					["Average", "average", "Avg", "avg", "المتوسط"],
					"number",
				)
				const max = safeGetValue<number>(
					row,
					["Max", "max", "Maximum", "maximum", "الحد الأقصى"],
					"number",
				)

				// Validate level is valid
				if (isNaN(level) || level < 0 || level > 10) {
					throw new InvalidDataError(
						EXCEL_SHEETS.BASE_SALARIES,
						rowNum,
						"Level",
						level,
						"number between 0 and 10",
					)
				}

				// Validate salaries are positive
				if (min <= 0 || average <= 0 || max <= 0) {
					throw new InvalidDataError(
						EXCEL_SHEETS.BASE_SALARIES,
						rowNum,
						"Salary",
						{ min, average, max },
						"positive numbers",
					)
				}

				result.push({ level, min, average, max })
			} catch (error) {
				const errorMsg =
					error instanceof Error
						? error.message
						: `Failed to parse row ${rowNum}: ${JSON.stringify(row)}`
				errors.push(errorMsg)
				logger.warn("Parse Base Salaries", `Row ${rowNum} error`, error)
			}
		})

		if (errors.length > 0 && result.length === 0) {
			throw new FileParseError(
				"Failed to parse any base salary rows",
				{ errors },
				"Check that columns are named correctly: Level, Min, Average, Max",
			)
		}

		logger.info("Parse Base Salaries", `Parsed ${result.length} salary levels`, {
			rowCount: data.length,
			successCount: result.length,
			errorCount: errors.length,
		})

		return result
	} catch (error) {
		logger.error("Parse Base Salaries", "Failed to parse", error)
		throw error
	}
}

function parseCareerTracks(sheet: XLSX.WorkSheet): CareerTrack[] {
	try {
		logger.info("Parse Career Tracks", "Starting parse")

		const data = XLSX.utils.sheet_to_json<any>(sheet)

		if (data.length === 0) {
			throw new FileParseError(
				"Career Tracks sheet is empty",
				{ sheet: EXCEL_SHEETS.CAREER_TRACKS },
				"Add at least one career track to the sheet",
			)
		}

		const result: CareerTrack[] = []
		const errors: string[] = []

		data.forEach((row, index) => {
			const rowNum = index + 2

			try {
				const departmentKey = safeGetValue<string>(
					row,
					["Track Key", "trackKey", "key", "مفتاح المسار"],
					"string",
				)
				const title = safeGetValue<string>(
					row,
					["Track Name", "trackName", "title", "اسم المسار"],
					"string",
				)
				const description = safeGetValue<string>(
					row,
					["Description", "description", "الوصف"],
					"string",
					"",
				)

				// Parse level percentages with multiple possible formats
				const levelPercentages: Record<number, number> = {}

				// Try different percentage column formats
				const percentageFormats = [
					(i: number) => `L${i}%`,
					(i: number) => `L${i}`,
					(i: number) => `Level ${i} %`,
					(i: number) => `level_${i}`,
				]

				for (let i = 1; i <= 8; i++) {
					for (const format of percentageFormats) {
						const key = format(i)
						if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
							levelPercentages[i] = parseFloat(row[key])
							break
						}
					}

					// Also check for float levels
					for (const format of percentageFormats) {
						const key = format(i + 0.5).replace(".5", "\\.5")
						const actualKey = `L${i}.5%`
						if (row[actualKey] !== undefined && row[actualKey] !== null && row[actualKey] !== "") {
							levelPercentages[i + 0.5] = parseFloat(row[actualKey])
							break
						}
					}
				}

				// Warn if no level percentages found
				if (Object.keys(levelPercentages).length === 0) {
					logger.warn("Parse Career Tracks", `No level percentages found for row ${rowNum}`, {
						row,
					})
				}

				result.push({
					departmentKey,
					title,
					description,
					levelPercentages,
					floatLevelAdjustments: {
						4.5: { min: 500, max: -500 },
						5.5: { min: 700, max: -1000 },
						6.5: { min: 1000, max: -1750 },
						7.5: { min: 1250, max: -5000 },
					},
				})
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : `Failed to parse row ${rowNum}`
				errors.push(errorMsg)
				logger.warn("Parse Career Tracks", `Row ${rowNum} error`, error)
			}
		})

		if (errors.length > 0 && result.length === 0) {
			throw new FileParseError(
				"Failed to parse any career track rows",
				{ errors },
				"Check that columns include: Track Key, Track Name, Description, L1%, L2%, ...",
			)
		}

		logger.info("Parse Career Tracks", `Parsed ${result.length} career tracks`, {
			rowCount: data.length,
			successCount: result.length,
			errorCount: errors.length,
		})

		return result
	} catch (error) {
		logger.error("Parse Career Tracks", "Failed to parse", error)
		throw error
	}
}

function parseRegionalAdjustments(sheet: XLSX.WorkSheet): RegionalAdjustment[] {
	try {
		logger.info("Parse Regional Adjustments", "Starting parse")

		const data = XLSX.utils.sheet_to_json<any>(sheet)

		if (data.length === 0) {
			// Regional adjustments are optional, just warn
			logger.warn("Parse Regional Adjustments", "Sheet is empty")
			return []
		}

		const result: RegionalAdjustment[] = []
		const errors: string[] = []

		data.forEach((row, index) => {
			const rowNum = index + 2

			try {
				const value = safeGetValue<string>(
					row,
					["Location", "location", "value", "المنطقة"],
					"string",
				)
				const label = safeGetValue<string>(
					row,
					["Arabic Label", "label", "التسمية"],
					"string",
				)

				const adjustment: RegionalAdjustment = { value, label }

				// Check for dynamic formula
				const dynamicFormula = safeGetValue<string>(
					row,
					["Dynamic Formula", "dynamicFormula", "formula"],
					"string",
					"",
				)

				if (dynamicFormula && (dynamicFormula.toUpperCase() === "DYNAMIC" || dynamicFormula.toUpperCase() === "EGYPT")) {
					adjustment.dynamicFormula = "EGYPT"
				} else {
					// Try to get percentage
					try {
						const percent = safeGetValue<number>(
							row,
							["Adjustment %", "Adjustment", "percent", "النسبة"],
							"number",
						)
						adjustment.percent = percent
					} catch (error) {
						// If no percentage and no formula, default to 0
						logger.warn(
							"Parse Regional Adjustments",
							`Row ${rowNum}: No adjustment % or formula, defaulting to 0`,
						)
						adjustment.percent = 0
					}
				}

				result.push(adjustment)
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : `Failed to parse row ${rowNum}`
				errors.push(errorMsg)
				logger.warn("Parse Regional Adjustments", `Row ${rowNum} error`, error)
			}
		})

		logger.info("Parse Regional Adjustments", `Parsed ${result.length} regional adjustments`, {
			rowCount: data.length,
			successCount: result.length,
			errorCount: errors.length,
		})

		return result
	} catch (error) {
		logger.error("Parse Regional Adjustments", "Failed to parse", error)
		throw error
	}
}

function parseJobLevels(sheet: XLSX.WorkSheet): JobLevel[] {
	try {
		logger.info("Parse Job Levels", "Starting parse")

		const data = XLSX.utils.sheet_to_json<any>(sheet)

		if (data.length === 0) {
			throw new FileParseError(
				"Job Levels sheet is empty",
				{ sheet: EXCEL_SHEETS.JOB_LEVELS },
				"Add at least one job level to the sheet",
			)
		}

		const result: JobLevel[] = []
		const errors: string[] = []

		data.forEach((row, index) => {
			const rowNum = index + 2

			try {
				const level = safeGetValue<number>(row, ["Level", "level", "المستوى"], "number")

				const titleAr = safeGetValue<string>(
					row,
					["Title AR", "titleAr", "العنوان بالعربية"],
					"string",
				)
				const titleEn = safeGetValue<string>(
					row,
					["Title EN", "titleEn", "Title"],
					"string",
				)

				const managerialTitleAr = safeGetValue<string>(
					row,
					["Managerial AR", "managerialTitleAr", "العنوان الإداري"],
					"string",
					titleAr, // Default to regular title if not provided
				)
				const managerialTitleEn = safeGetValue<string>(
					row,
					["Managerial EN", "managerialTitleEn", "Managerial Title"],
					"string",
					titleEn,
				)

				const techTitleAr = safeGetValue<string>(
					row,
					["Tech AR", "techTitleAr", "العنوان التقني"],
					"string",
					titleAr,
				)
				const techTitleEn = safeGetValue<string>(
					row,
					["Tech EN", "techTitleEn", "Tech Title"],
					"string",
					titleEn,
				)

				result.push({
					level,
					titleAr,
					titleEn,
					managerialTitleAr,
					managerialTitleEn,
					techTitleAr,
					techTitleEn,
				})
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : `Failed to parse row ${rowNum}`
				errors.push(errorMsg)
				logger.warn("Parse Job Levels", `Row ${rowNum} error`, error)
			}
		})

		if (errors.length > 0 && result.length === 0) {
			throw new FileParseError(
				"Failed to parse any job level rows",
				{ errors },
				"Check that columns include: Level, Title AR, Title EN, etc.",
			)
		}

		logger.info("Parse Job Levels", `Parsed ${result.length} job levels`, {
			rowCount: data.length,
			successCount: result.length,
			errorCount: errors.length,
		})

		return result
	} catch (error) {
		logger.error("Parse Job Levels", "Failed to parse", error)
		throw error
	}
}

function parseConfig(sheet: XLSX.WorkSheet): ParsedSalaryData["config"] {
	try {
		logger.info("Parse Config", "Starting parse")

		const data = XLSX.utils.sheet_to_json<any>(sheet, { header: ["key", "value"] })

		const config: any = {
			managerAdjustmentRange: {},
		}

		data.forEach((row: any, index) => {
			const rowNum = index + 1
			const key = row.key
			const value = row.value

			// Skip header row and empty rows
			if (
				!key ||
				key === "Key" ||
				key === "key" ||
				value === undefined ||
				value === null ||
				value === ""
			) {
				return
			}

			try {
				switch (key.toLowerCase().trim()) {
					case "saudi_bonus_percent":
					case "saudi bonus percent":
					case "saudi bonus":
						config.saudiExtraPercent = 1 + parseFloat(value) / 100
						break
					case "manager_adjustment_min":
					case "manager adjustment min":
						config.managerAdjustmentRange.min = parseFloat(value)
						break
					case "manager_adjustment_max":
					case "manager adjustment max":
						config.managerAdjustmentRange.max = parseFloat(value)
						break
					case "riyadh_relocation_bonus":
					case "riyadh relocation bonus":
					case "riyadh bonus":
						config.riyadhRelocationBonus = parseFloat(value)
						break
					case "version_name":
					case "version name":
					case "version":
						config.versionName = String(value)
						break
					case "effective_date":
					case "effective date":
					case "date":
						config.effectiveDate = String(value)
						break
					default:
						logger.warn("Parse Config", `Unknown config key: ${key} in row ${rowNum}`)
				}
			} catch (error) {
				logger.warn("Parse Config", `Failed to parse row ${rowNum}`, { key, value, error })
			}
		})

		// Validate required config fields
		const requiredFields = [
			"saudiExtraPercent",
			"managerAdjustmentRange",
			"riyadhRelocationBonus",
			"versionName",
			"effectiveDate",
		]

		const missingFields = requiredFields.filter((field) => !config[field])
		if (missingFields.length > 0) {
			throw new MissingRequiredFieldError(EXCEL_SHEETS.CONFIG, 0, missingFields.join(", "))
		}

		logger.info("Parse Config", "Config parsed successfully", config)

		return config
	} catch (error) {
		logger.error("Parse Config", "Failed to parse", error)
		throw error
	}
}

export function generateTypeScriptFile(data: ParsedSalaryData): string {
	try {
		logger.info("Generate TypeScript", "Starting generation")

		const content = `// Auto-generated from Excel import
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

		logger.info("Generate TypeScript", "Generation completed", {
			contentLength: content.length,
		})

		return content
	} catch (error) {
		logger.error("Generate TypeScript", "Failed to generate", error)
		throw error
	}
}
