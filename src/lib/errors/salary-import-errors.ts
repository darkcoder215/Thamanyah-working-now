/**
 * Custom error types for salary import system
 * Provides detailed, actionable error messages
 */

export class SalaryImportError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly details?: any,
		public readonly suggestion?: string,
	) {
		super(message)
		this.name = "SalaryImportError"
		Object.setPrototypeOf(this, SalaryImportError.prototype)
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			details: this.details,
			suggestion: this.suggestion,
		}
	}
}

export class FileParseError extends SalaryImportError {
	constructor(message: string, details?: any, suggestion?: string) {
		super(message, "FILE_PARSE_ERROR", details, suggestion)
		this.name = "FileParseError"
	}
}

export class ValidationError extends SalaryImportError {
	constructor(message: string, details?: any, suggestion?: string) {
		super(message, "VALIDATION_ERROR", details, suggestion)
		this.name = "ValidationError"
	}
}

export class SheetNotFoundError extends SalaryImportError {
	constructor(
		sheetName: string,
		availableSheets: string[],
	) {
		super(
			`Required sheet "${sheetName}" not found`,
			"SHEET_NOT_FOUND",
			{ sheetName, availableSheets },
			`Check that the sheet name is exactly "${sheetName}" (case-sensitive)`,
		)
		this.name = "SheetNotFoundError"
	}
}

export class InvalidDataError extends SalaryImportError {
	constructor(
		sheet: string,
		row: number,
		column: string,
		value: any,
		expectedType: string,
		suggestion?: string,
	) {
		super(
			`Invalid data in sheet "${sheet}", row ${row}, column "${column}"`,
			"INVALID_DATA",
			{ sheet, row, column, value, expectedType },
			suggestion || `Expected ${expectedType}, got ${typeof value}`,
		)
		this.name = "InvalidDataError"
	}
}

export class DuplicateKeyError extends SalaryImportError {
	constructor(
		sheet: string,
		key: string,
		occurrences: number,
	) {
		super(
			`Duplicate key "${key}" found ${occurrences} times in sheet "${sheet}"`,
			"DUPLICATE_KEY",
			{ sheet, key, occurrences },
			"Each key must be unique within the sheet",
		)
		this.name = "DuplicateKeyError"
	}
}

export class RangeValidationError extends SalaryImportError {
	constructor(
		sheet: string,
		row: number,
		field: string,
		value: number,
		min: number,
		max: number,
	) {
		super(
			`Value ${value} out of range in sheet "${sheet}", row ${row}, field "${field}"`,
			"RANGE_VALIDATION_ERROR",
			{ sheet, row, field, value, min, max },
			`Value must be between ${min} and ${max}`,
		)
		this.name = "RangeValidationError"
	}
}

export class MissingRequiredFieldError extends SalaryImportError {
	constructor(
		sheet: string,
		row: number,
		field: string,
	) {
		super(
			`Required field "${field}" is missing in sheet "${sheet}", row ${row}`,
			"MISSING_REQUIRED_FIELD",
			{ sheet, row, field },
			`This field is required and cannot be empty`,
		)
		this.name = "MissingRequiredFieldError"
	}
}

export class FileOperationError extends SalaryImportError {
	constructor(
		operation: "read" | "write" | "backup" | "commit",
		filePath: string,
		originalError: Error,
	) {
		super(
			`Failed to ${operation} file: ${filePath}`,
			"FILE_OPERATION_ERROR",
			{ operation, filePath, originalError: originalError.message },
			operation === "write"
				? "Check file permissions and disk space"
				: "Ensure the file exists and is accessible",
		)
		this.name = "FileOperationError"
	}
}

export class GitOperationError extends SalaryImportError {
	constructor(
		operation: "add" | "commit" | "push",
		originalError: Error,
	) {
		super(
			`Git ${operation} failed`,
			"GIT_OPERATION_ERROR",
			{ operation, originalError: originalError.message },
			operation === "push"
				? "Check network connection and git remote configuration"
				: "Ensure git is properly configured",
		)
		this.name = "GitOperationError"
	}
}

/**
 * Error handler utility
 */
export class ErrorHandler {
	static handle(error: unknown, context: string): SalaryImportError {
		if (error instanceof SalaryImportError) {
			return error
		}

		if (error instanceof Error) {
			return new SalaryImportError(
				`${context}: ${error.message}`,
				"UNKNOWN_ERROR",
				{ originalError: error.message, stack: error.stack },
				"Check the error details and try again",
			)
		}

		return new SalaryImportError(
			`${context}: Unknown error occurred`,
			"UNKNOWN_ERROR",
			{ error: String(error) },
			"Please report this error to support",
		)
	}

	static isRetryable(error: SalaryImportError): boolean {
		const retryableCodes = [
			"FILE_OPERATION_ERROR",
			"GIT_OPERATION_ERROR",
			"FILE_PARSE_ERROR", // May be transient
		]
		return retryableCodes.includes(error.code)
	}

	static formatForUser(error: SalaryImportError): string {
		let message = `❌ ${error.message}\n`

		if (error.suggestion) {
			message += `\n💡 Suggestion: ${error.suggestion}\n`
		}

		if (error.details) {
			message += `\n📋 Details:\n`
			Object.entries(error.details).forEach(([key, value]) => {
				if (key !== "stack" && key !== "originalError") {
					message += `  • ${key}: ${JSON.stringify(value)}\n`
				}
			})
		}

		return message
	}
}

/**
 * Retry utility for operations that may fail transiently
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: {
		maxAttempts?: number
		delayMs?: number
		backoff?: boolean
		onRetry?: (attempt: number, error: Error) => void
	} = {},
): Promise<T> {
	const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry } = options

	let lastError: Error

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation()
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))

			if (attempt === maxAttempts) {
				throw lastError
			}

			if (onRetry) {
				onRetry(attempt, lastError)
			}

			const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}

	throw lastError!
}
