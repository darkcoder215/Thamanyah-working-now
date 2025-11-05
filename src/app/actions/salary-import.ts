"use server"

import * as XLSX from "xlsx"
import { writeFile, copyFile } from "fs/promises"
import path from "path"
import { parseExcelWorkbook, generateTypeScriptFile } from "@/lib/excel-parser"
import { validateSalaryData } from "@/lib/salary-validation"
import type { ParsedSalaryData } from "@/lib/excel-parser"

// Import current data for comparison
import {
	baseSalaries2025,
	levels,
	newSalaries,
	regionAdjustments,
	saudiExtraPercent,
} from "@/components/salary-calculator/salary-data"

interface DiffChange {
	type: "added" | "modified" | "removed"
	category: "baseSalary" | "trackPercentage" | "regional" | "jobLevel" | "config"
	[key: string]: any
}

export async function uploadAndPreviewSalaryData(formData: FormData) {
	try {
		const file = formData.get("file") as File
		if (!file) {
			return { error: "No file provided" }
		}

		// Read file buffer
		const buffer = await file.arrayBuffer()
		const workbook = XLSX.read(buffer)

		// Parse Excel data
		const parsedData = parseExcelWorkbook(workbook)

		// Validate data
		const validation = validateSalaryData(parsedData)
		if (!validation.valid) {
			return {
				error: "Validation failed",
				validationErrors: validation.errors,
				validationWarnings: validation.warnings,
			}
		}

		// Generate diff
		const diff = generateDiff(parsedData)

		// Calculate impact
		const impact = calculateImpact(diff, parsedData)

		return {
			success: true,
			data: {
				parsedData,
				diff,
				impact,
				filename: file.name,
				warnings: validation.warnings,
			},
		}
	} catch (error) {
		console.error("Upload error:", error)
		return {
			error: error instanceof Error ? error.message : "Failed to parse Excel file",
		}
	}
}

export async function applyChanges(
	data: ParsedSalaryData,
	commitMessage?: string,
): Promise<{ success?: boolean; error?: string; backupPath?: string }> {
	try {
		// 1. Generate new TypeScript file content
		const tsContent = generateTypeScriptFile(data)

		// 2. File paths
		const filePath = path.join(
			process.cwd(),
			"src/components/salary-calculator/salary-data.ts",
		)
		const backupPath = `${filePath}.backup-${Date.now()}`

		// 3. Backup current file
		try {
			await copyFile(filePath, backupPath)
		} catch (error) {
			console.error("Backup failed:", error)
			return { error: "Failed to create backup" }
		}

		// 4. Write new file
		try {
			await writeFile(filePath, tsContent, "utf-8")
		} catch (error) {
			console.error("Write failed:", error)
			// Restore backup
			await copyFile(backupPath, filePath)
			return { error: "Failed to write new file" }
		}

		// 5. Optional: Auto-commit to git
		if (process.env.ENABLE_AUTO_COMMIT === "true") {
			try {
				await gitCommitChanges(commitMessage || "Update salary structure")
			} catch (error) {
				console.error("Git commit failed:", error)
				// Don't fail the operation - file update succeeded
			}
		}

		// 6. Optional: Trigger deployment
		if (process.env.VERCEL_DEPLOY_HOOK) {
			try {
				await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" })
			} catch (error) {
				console.error("Deploy trigger failed:", error)
				// Don't fail the operation
			}
		}

		return { success: true, backupPath }
	} catch (error) {
		console.error("Apply changes error:", error)
		return {
			error: error instanceof Error ? error.message : "Failed to apply changes",
		}
	}
}

function generateDiff(newData: ParsedSalaryData): DiffChange[] {
	const changes: DiffChange[] = []

	// Compare base salaries
	newData.baseSalaries.forEach((newSalary) => {
		const current = baseSalaries2025.find((s) => s.level === newSalary.level)

		if (!current) {
			changes.push({
				type: "added",
				category: "baseSalary",
				level: newSalary.level,
				value: newSalary,
			})
		} else if (
			current.min !== newSalary.min ||
			current.average !== newSalary.average ||
			current.max !== newSalary.max
		) {
			changes.push({
				type: "modified",
				category: "baseSalary",
				level: newSalary.level,
				old: current,
				new: newSalary,
			})
		}
	})

	// Check for removed levels
	baseSalaries2025.forEach((current) => {
		const exists = newData.baseSalaries.find((s) => s.level === current.level)
		if (!exists) {
			changes.push({
				type: "removed",
				category: "baseSalary",
				level: current.level,
				value: current,
			})
		}
	})

	// Compare career tracks
	newData.careerTracks.forEach((newTrack) => {
		const current = newSalaries.find((t) => t.departmentKey === newTrack.departmentKey)

		if (!current) {
			changes.push({
				type: "added",
				category: "trackPercentage",
				track: newTrack.departmentKey,
				trackName: newTrack.title,
				value: newTrack,
			})
		} else {
			// Check each level percentage
			Object.keys(newTrack.levelPercentages).forEach((levelStr) => {
				const level = parseFloat(levelStr)
				const oldPercent = current.levelPercentages[level]
				const newPercent = newTrack.levelPercentages[level]

				if (oldPercent !== newPercent) {
					changes.push({
						type: "modified",
						category: "trackPercentage",
						track: newTrack.departmentKey,
						trackName: newTrack.title,
						level,
						old: oldPercent,
						new: newPercent,
					})
				}
			})
		}
	})

	// Compare regional adjustments
	newData.regionalAdjustments.forEach((newRegion) => {
		const current = regionAdjustments.find((r) => r.value === newRegion.value)

		if (!current) {
			changes.push({
				type: "added",
				category: "regional",
				location: newRegion.value,
				locationName: newRegion.label,
				value: newRegion,
			})
		} else if (current.percent !== newRegion.percent) {
			changes.push({
				type: "modified",
				category: "regional",
				location: newRegion.value,
				locationName: newRegion.label,
				old: current.percent,
				new: newRegion.percent,
			})
		}
	})

	// Compare job levels (titles)
	newData.jobLevels.forEach((newLevel) => {
		const current = levels.find((l) => l.level === newLevel.level)

		if (!current) {
			changes.push({
				type: "added",
				category: "jobLevel",
				level: newLevel.level,
				value: newLevel,
			})
		} else {
			const titleChanged =
				current.titleAr !== newLevel.titleAr ||
				current.titleEn !== newLevel.titleEn ||
				current.managerialTitleAr !== newLevel.managerialTitleAr ||
				current.managerialTitleEn !== newLevel.managerialTitleEn ||
				current.techTitleAr !== newLevel.techTitleAr ||
				current.techTitleEn !== newLevel.techTitleEn

			if (titleChanged) {
				changes.push({
					type: "modified",
					category: "jobLevel",
					level: newLevel.level,
					old: current,
					new: newLevel,
				})
			}
		}
	})

	// Compare config
	if (saudiExtraPercent !== newData.config.saudiExtraPercent) {
		changes.push({
			type: "modified",
			category: "config",
			field: "saudiExtraPercent",
			old: saudiExtraPercent,
			new: newData.config.saudiExtraPercent,
		})
	}

	return changes
}

function calculateImpact(changes: DiffChange[], newData: ParsedSalaryData) {
	const summary = {
		totalChanges: changes.length,
		baseSalaryChanges: changes.filter((c) => c.category === "baseSalary").length,
		trackChanges: changes.filter((c) => c.category === "trackPercentage").length,
		regionalChanges: changes.filter((c) => c.category === "regional").length,
		jobLevelChanges: changes.filter((c) => c.category === "jobLevel").length,
		configChanges: changes.filter((c) => c.category === "config").length,
	}

	// Calculate affected levels
	const affectedLevels = new Set<number>()
	changes.forEach((change) => {
		if (change.level !== undefined) {
			affectedLevels.add(change.level)
		}
	})

	// Calculate salary impact for base salary changes
	const salaryImpact = changes
		.filter((c) => c.category === "baseSalary" && c.type === "modified")
		.map((change) => {
			const minDiff = change.new.min - change.old.min
			const maxDiff = change.new.max - change.old.max
			const minPercentChange = ((minDiff / change.old.min) * 100).toFixed(2)
			const maxPercentChange = ((maxDiff / change.old.max) * 100).toFixed(2)

			return {
				level: change.level,
				oldMin: change.old.min,
				newMin: change.new.min,
				oldMax: change.old.max,
				newMax: change.new.max,
				minDiff,
				maxDiff,
				minPercentChange: parseFloat(minPercentChange),
				maxPercentChange: parseFloat(maxPercentChange),
			}
		})

	return {
		summary,
		affectedLevels: Array.from(affectedLevels).sort((a, b) => a - b),
		salaryImpact,
	}
}

async function gitCommitChanges(message: string) {
	const { exec } = require("child_process")
	const util = require("util")
	const execPromise = util.promisify(exec)

	try {
		await execPromise("git add src/components/salary-calculator/salary-data.ts")
		await execPromise(`git commit -m "${message.replace(/"/g, '\\"')}"`)

		// Only push if ENABLE_AUTO_PUSH is true
		if (process.env.ENABLE_AUTO_PUSH === "true") {
			await execPromise("git push")
		}
	} catch (error) {
		console.error("Git operations failed:", error)
		throw error
	}
}
