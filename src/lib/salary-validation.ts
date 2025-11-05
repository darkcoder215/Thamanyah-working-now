import type { ParsedSalaryData } from "./excel-parser"
import type { ValidationError, ValidationWarning } from "@/types/salary-import"

export interface ValidationResult {
	valid: boolean
	errors: ValidationError[]
	warnings: ValidationWarning[]
}

export function validateSalaryData(data: ParsedSalaryData): ValidationResult {
	const errors: ValidationError[] = []
	const warnings: ValidationWarning[] = []

	// Validate base salaries
	data.baseSalaries.forEach((salary, index) => {
		if (isNaN(salary.level)) {
			errors.push({
				type: "INVALID_VALUE_RANGE",
				sheet: "Base Salaries",
				row: index + 2,
				field: "level",
				message: "Level must be a valid number",
				value: salary.level,
			})
		}

		if (salary.min <= 0 || salary.average <= 0 || salary.max <= 0) {
			errors.push({
				type: "INVALID_VALUE_RANGE",
				sheet: "Base Salaries",
				row: index + 2,
				field: "salary",
				message: "All salary values must be positive",
				value: { min: salary.min, average: salary.average, max: salary.max },
			})
		}

		if (salary.min > salary.average || salary.average > salary.max) {
			errors.push({
				type: "INVALID_VALUE_RANGE",
				sheet: "Base Salaries",
				row: index + 2,
				field: "salary range",
				message: `Salary range invalid: min (${salary.min}) must be <= average (${salary.average}) must be <= max (${salary.max})`,
				value: { min: salary.min, average: salary.average, max: salary.max },
			})
		}
	})

	// Check for duplicate levels
	const levelCounts = new Map<number, number>()
	data.baseSalaries.forEach((salary) => {
		levelCounts.set(salary.level, (levelCounts.get(salary.level) || 0) + 1)
	})
	levelCounts.forEach((count, level) => {
		if (count > 1) {
			errors.push({
				type: "DUPLICATE_KEY",
				sheet: "Base Salaries",
				field: "level",
				message: `Duplicate level ${level} found ${count} times`,
				value: level,
			})
		}
	})

	// Validate career tracks
	data.careerTracks.forEach((track, index) => {
		if (!track.departmentKey || track.departmentKey.trim() === "") {
			errors.push({
				type: "MISSING_REQUIRED_FIELD",
				sheet: "Career Tracks",
				row: index + 2,
				field: "Track Key",
				message: "Track Key is required",
			})
		}

		if (!track.title || track.title.trim() === "") {
			errors.push({
				type: "MISSING_REQUIRED_FIELD",
				sheet: "Career Tracks",
				row: index + 2,
				field: "Track Name",
				message: "Track Name is required",
			})
		}

		// Validate level percentages
		Object.entries(track.levelPercentages).forEach(([level, percent]) => {
			if (isNaN(percent)) {
				errors.push({
					type: "INVALID_VALUE_RANGE",
					sheet: "Career Tracks",
					row: index + 2,
					field: `L${level}%`,
					message: `Invalid percentage for level ${level}`,
					value: percent,
				})
			}

			if (percent < -100 || percent > 200) {
				errors.push({
					type: "INVALID_VALUE_RANGE",
					sheet: "Career Tracks",
					row: index + 2,
					field: `L${level}%`,
					message: `Percentage must be between -100 and 200, got ${percent}`,
					value: percent,
				})
			}

			if (percent > 100) {
				warnings.push({
					sheet: "Career Tracks",
					row: index + 2,
					field: `L${level}%`,
					message: `Unusually high percentage: ${percent}%. Double-check this value.`,
					suggestion: "Typical ranges are 0-50%",
				})
			}
		})
	})

	// Check for duplicate track keys
	const trackKeys = new Set<string>()
	data.careerTracks.forEach((track, index) => {
		if (trackKeys.has(track.departmentKey)) {
			errors.push({
				type: "DUPLICATE_KEY",
				sheet: "Career Tracks",
				row: index + 2,
				field: "Track Key",
				message: `Duplicate track key: ${track.departmentKey}`,
				value: track.departmentKey,
			})
		}
		trackKeys.add(track.departmentKey)
	})

	// Validate regional adjustments
	data.regionalAdjustments.forEach((region, index) => {
		if (!region.value || region.value.trim() === "") {
			errors.push({
				type: "MISSING_REQUIRED_FIELD",
				sheet: "Regional Adjustments",
				row: index + 2,
				field: "Location",
				message: "Location key is required",
			})
		}

		if (!region.label || region.label.trim() === "") {
			errors.push({
				type: "MISSING_REQUIRED_FIELD",
				sheet: "Regional Adjustments",
				row: index + 2,
				field: "Arabic Label",
				message: "Arabic Label is required",
			})
		}

		if (!region.dynamicFormula && (region.percent === undefined || isNaN(region.percent))) {
			errors.push({
				type: "MISSING_REQUIRED_FIELD",
				sheet: "Regional Adjustments",
				row: index + 2,
				field: "Adjustment %",
				message: "Either Adjustment % or Dynamic Formula must be provided",
			})
		}

		if (region.percent !== undefined && (region.percent < -100 || region.percent > 100)) {
			errors.push({
				type: "INVALID_VALUE_RANGE",
				sheet: "Regional Adjustments",
				row: index + 2,
				field: "Adjustment %",
				message: `Regional adjustment must be between -100% and 100%, got ${region.percent}%`,
				value: region.percent,
			})
		}
	})

	// Validate job levels
	data.jobLevels.forEach((level, index) => {
		if (isNaN(level.level)) {
			errors.push({
				type: "INVALID_VALUE_RANGE",
				sheet: "Job Levels",
				row: index + 2,
				field: "Level",
				message: "Level must be a valid number",
				value: level.level,
			})
		}

		const requiredFields = [
			"titleAr",
			"titleEn",
			"managerialTitleAr",
			"managerialTitleEn",
			"techTitleAr",
			"techTitleEn",
		]
		requiredFields.forEach((field) => {
			if (!level[field as keyof typeof level] || level[field as keyof typeof level] === "") {
				errors.push({
					type: "MISSING_REQUIRED_FIELD",
					sheet: "Job Levels",
					row: index + 2,
					field,
					message: `${field} is required`,
				})
			}
		})
	})

	// Validate config
	if (!data.config.versionName || data.config.versionName.trim() === "") {
		errors.push({
			type: "MISSING_REQUIRED_FIELD",
			sheet: "Config",
			field: "version_name",
			message: "Version name is required",
		})
	}

	if (!data.config.effectiveDate) {
		errors.push({
			type: "MISSING_REQUIRED_FIELD",
			sheet: "Config",
			field: "effective_date",
			message: "Effective date is required",
		})
	}

	if (data.config.saudiExtraPercent < 1 || data.config.saudiExtraPercent > 1.5) {
		errors.push({
			type: "INVALID_VALUE_RANGE",
			sheet: "Config",
			field: "saudi_bonus_percent",
			message: "Saudi bonus must be between 0% and 50%",
			value: data.config.saudiExtraPercent,
		})
	}

	// Cross-validation: Ensure all base salary levels have job level titles
	const jobLevelNumbers = new Set(data.jobLevels.map((l) => l.level))
	data.baseSalaries.forEach((salary) => {
		if (!jobLevelNumbers.has(salary.level)) {
			warnings.push({
				sheet: "Job Levels",
				message: `Base salary level ${salary.level} does not have corresponding job titles`,
				suggestion: "Add job level titles for this level",
			})
		}
	})

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	}
}
