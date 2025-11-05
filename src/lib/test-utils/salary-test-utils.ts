/**
 * Test utilities and fixtures for salary import system
 */

import * as XLSX from "xlsx"
import type { ParsedSalaryData } from "../excel-parser.enhanced"

/**
 * Create a mock Excel workbook for testing
 */
export function createMockWorkbook(options?: {
	includeAllSheets?: boolean
	corruptedSheets?: string[]
	emptySheets?: string[]
}): XLSX.WorkBook {
	const wb = XLSX.utils.book_new()

	if (options?.includeAllSheets !== false) {
		// Base Salaries
		const baseSalariesData = [
			["Level", "Min", "Average", "Max"],
			[1, 8000, 9000, 10000],
			[2, 10500, 12000, 13500],
			[3, 13910, 15649, 17388],
			[4, 17600, 19525, 21450],
			[5, 24640, 26320, 28000],
		]
		const baseSalariesWS = XLSX.utils.aoa_to_sheet(baseSalariesData)
		XLSX.utils.book_append_sheet(wb, baseSalariesWS, "Base Salaries 2025")

		// Career Tracks
		const careerTracksData = [
			["Track Key", "Track Name", "Description", "L1%", "L2%", "L3%", "L4%", "L5%"],
			["base-2025", "المسار الأساسي", "المسار العام", 0, 0, 0, 0, 0],
			["tech", "مسار التقنية", "التصميم والتقنية", 20, 15, 20, 25, 30],
		]
		const careerTracksWS = XLSX.utils.aoa_to_sheet(careerTracksData)
		XLSX.utils.book_append_sheet(wb, careerTracksWS, "Career Tracks")

		// Regional Adjustments
		const regionalData = [
			["Location", "Arabic Label", "Adjustment %", "Dynamic Formula"],
			["riyadh", "الرياض", 0, ""],
			["egypt", "مصر", -40, "DYNAMIC"],
		]
		const regionalWS = XLSX.utils.aoa_to_sheet(regionalData)
		XLSX.utils.book_append_sheet(wb, regionalWS, "Regional Adjustments")

		// Float Level Adjustments
		const floatData = [
			["Track Key", "Level", "Min Adjustment", "Max Adjustment"],
			["base-2025", 4.5, 500, -500],
			["base-2025", 5.5, 700, -1000],
		]
		const floatWS = XLSX.utils.aoa_to_sheet(floatData)
		XLSX.utils.book_append_sheet(wb, floatWS, "Float Level Adjustments")

		// Job Levels
		const jobLevelsData = [
			["Level", "Title AR", "Title EN", "Managerial AR", "Managerial EN", "Tech AR", "Tech EN"],
			[1, "مساعد", "Associate", "مساعد", "Associate", "مبتدئ", "Junior"],
			[2, "مسؤول", "Officer", "مسؤول", "Officer", "(المسمى)", "Job Title"],
		]
		const jobLevelsWS = XLSX.utils.aoa_to_sheet(jobLevelsData)
		XLSX.utils.book_append_sheet(wb, jobLevelsWS, "Job Levels")

		// Config
		const configData = [
			["Key", "Value"],
			["saudi_bonus_percent", 11],
			["manager_adjustment_min", -5],
			["manager_adjustment_max", 5],
			["riyadh_relocation_bonus", 10],
			["version_name", "TEST-2025Q1"],
			["effective_date", "2025-01-01"],
		]
		const configWS = XLSX.utils.aoa_to_sheet(configData)
		XLSX.utils.book_append_sheet(wb, configWS, "Config")
	}

	// Handle corrupted or empty sheets
	options?.corruptedSheets?.forEach((sheetName) => {
		const corruptedWS = XLSX.utils.aoa_to_sheet([["Invalid", "Data"]])
		XLSX.utils.book_append_sheet(wb, corruptedWS, sheetName)
	})

	options?.emptySheets?.forEach((sheetName) => {
		const emptyWS = XLSX.utils.aoa_to_sheet([])
		XLSX.utils.book_append_sheet(wb, emptyWS, sheetName)
	})

	return wb
}

/**
 * Create mock parsed data for testing
 */
export function createMockParsedData(): ParsedSalaryData {
	return {
		baseSalaries: [
			{ level: 1, min: 8000, average: 9000, max: 10000 },
			{ level: 2, min: 10500, average: 12000, max: 13500 },
			{ level: 3, min: 13910, average: 15649, max: 17388 },
		],
		careerTracks: [
			{
				departmentKey: "base-2025",
				title: "المسار الأساسي",
				description: "المسار العام",
				levelPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
				floatLevelAdjustments: {
					4.5: { min: 500, max: -500 },
					5.5: { min: 700, max: -1000 },
					6.5: { min: 1000, max: -1750 },
					7.5: { min: 1250, max: -5000 },
				},
			},
			{
				departmentKey: "tech",
				title: "مسار التقنية",
				description: "التصميم والتقنية",
				levelPercentages: { 1: 20, 2: 15, 3: 20, 4: 25, 5: 30 },
				floatLevelAdjustments: {
					4.5: { min: 500, max: -500 },
					5.5: { min: 700, max: -1000 },
					6.5: { min: 1000, max: -1750 },
					7.5: { min: 1250, max: -5000 },
				},
			},
		],
		regionalAdjustments: [
			{ value: "riyadh", label: "الرياض", percent: 0 },
			{ value: "egypt", label: "مصر", dynamicFormula: "EGYPT" },
		],
		jobLevels: [
			{
				level: 1,
				titleAr: "مساعد",
				titleEn: "Associate",
				managerialTitleAr: "مساعد",
				managerialTitleEn: "Associate",
				techTitleAr: "مبتدئ",
				techTitleEn: "Junior",
			},
			{
				level: 2,
				titleAr: "مسؤول",
				titleEn: "Officer",
				managerialTitleAr: "مسؤول",
				managerialTitleEn: "Officer",
				techTitleAr: "(المسمى)",
				techTitleEn: "Job Title",
			},
		],
		config: {
			saudiExtraPercent: 1.11,
			managerAdjustmentRange: { min: -5, max: 5 },
			riyadhRelocationBonus: 10,
			versionName: "TEST-2025Q1",
			effectiveDate: "2025-01-01",
		},
	}
}

/**
 * Test edge cases
 */
export const edgeCases = {
	// Empty data
	emptyBaseSalaries: {
		Level: null,
		Min: undefined,
		Average: "",
		Max: 0,
	},

	// Invalid data types
	invalidTypes: {
		Level: "not a number",
		Min: "8000",
		Average: true,
		Max: { value: 10000 },
	},

	// Out of range values
	outOfRange: {
		Level: 15,
		Min: -1000,
		Average: 0,
		Max: 999999999,
	},

	// Invalid salary ranges
	invalidRange: {
		Level: 1,
		Min: 10000,
		Average: 9000,
		Max: 8000,
	},

	// Missing required fields
	missingFields: {
		Level: 1,
		// Min, Average, Max missing
	},

	// Duplicate keys
	duplicateTrackKeys: [
		{ "Track Key": "tech", "Track Name": "Tech 1" },
		{ "Track Key": "tech", "Track Name": "Tech 2" },
	],

	// Special characters
	specialCharacters: {
		Level: 1,
		Min: "8,000",
		Average: "9.000,00",
		Max: "10k",
	},

	// Float numbers
	floatNumbers: {
		Level: 4.5,
		Min: 17600.5,
		Average: 19525.75,
		Max: 21450.99,
	},

	// Large numbers
	largeNumbers: {
		Level: 1,
		Min: 1000000,
		Average: 2000000,
		Max: 3000000,
	},

	// Negative percentages
	negativePercentages: {
		"Track Key": "tech",
		"Track Name": "Tech",
		"L1%": -50,
		"L2%": -100,
	},

	// Very high percentages
	highPercentages: {
		"Track Key": "tech",
		"Track Name": "Tech",
		"L1%": 500,
		"L2%": 1000,
	},

	// Alternative column names
	alternativeColumns: {
		level: 1, // lowercase
		minimum: 8000, // alternative name
		avg: 9000, // abbreviation
		maximum: 10000,
	},

	// Arabic column names
	arabicColumns: {
		المستوى: 1,
		"الحد الأدنى": 8000,
		المتوسط: 9000,
		"الحد الأقصى": 10000,
	},

	// Mixed language
	mixedLanguage: {
		Level: 1,
		"الحد الأدنى": 8000,
		Average: 9000,
		maximum: 10000,
	},
}

/**
 * Assert helpers for testing
 */
export const assertions = {
	isValidSalaryRange(min: number, average: number, max: number): boolean {
		return min <= average && average <= max && min > 0 && average > 0 && max > 0
	},

	isValidLevel(level: number): boolean {
		return level >= 0 && level <= 10
	},

	isValidPercentage(percent: number): boolean {
		return percent >= -100 && percent <= 200
	},

	hasRequiredFields(obj: any, fields: string[]): boolean {
		return fields.every(
			(field) => obj[field] !== undefined && obj[field] !== null && obj[field] !== "",
		)
	},

	isUniqueArray(arr: any[], key: string): boolean {
		const keys = arr.map((item) => item[key])
		return keys.length === new Set(keys).size
	},
}

/**
 * Generate test report
 */
export function generateTestReport(results: {
	passed: number
	failed: number
	errors: string[]
}): string {
	const total = results.passed + results.failed
	const passRate = ((results.passed / total) * 100).toFixed(2)

	return `
Test Report
===========
Total Tests: ${total}
Passed: ${results.passed} (${passRate}%)
Failed: ${results.failed}

${results.errors.length > 0 ? `\nErrors:\n${results.errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : "All tests passed! ✅"}
	`.trim()
}
