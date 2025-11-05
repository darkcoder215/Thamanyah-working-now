/**
 * Comprehensive logging system for salary import operations
 * Provides structured logging with levels, contexts, and persistence
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
	timestamp: string
	level: LogLevel
	context: string
	message: string
	data?: any
	userId?: string
	sessionId?: string
}

class SalaryImportLogger {
	private logs: LogEntry[] = []
	private sessionId: string = this.generateSessionId()
	private userId?: string

	constructor() {
		if (typeof window !== "undefined") {
			// Initialize from localStorage if available
			try {
				const stored = localStorage.getItem("salary-import-logs")
				if (stored) {
					this.logs = JSON.parse(stored)
				}
			} catch (error) {
				console.warn("Failed to load logs from localStorage:", error)
			}
		}
	}

	setUserId(userId: string) {
		this.userId = userId
	}

	private generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
	}

	private log(level: LogLevel, context: string, message: string, data?: any) {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			context,
			message,
			data,
			userId: this.userId,
			sessionId: this.sessionId,
		}

		this.logs.push(entry)

		// Console output with colors
		const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}]`
		const style = this.getConsoleStyle(level)

		if (typeof window !== "undefined") {
			console.log(`%c${prefix}`, style, message, data || "")
		} else {
			// Node.js environment
			console.log(prefix, message, data ? JSON.stringify(data) : "")
		}

		// Persist to localStorage (client-side only)
		if (typeof window !== "undefined") {
			try {
				// Keep only last 100 logs
				const recentLogs = this.logs.slice(-100)
				localStorage.setItem("salary-import-logs", JSON.stringify(recentLogs))
			} catch (error) {
				console.warn("Failed to persist logs:", error)
			}
		}

		// In production, could also send to external logging service
		if (level === "error" && process.env.NODE_ENV === "production") {
			this.sendToExternalService(entry)
		}
	}

	private getConsoleStyle(level: LogLevel): string {
		const styles = {
			debug: "color: #888; font-weight: normal",
			info: "color: #0066cc; font-weight: bold",
			warn: "color: #ff9900; font-weight: bold",
			error: "color: #cc0000; font-weight: bold",
		}
		return styles[level]
	}

	debug(context: string, message: string, data?: any) {
		if (process.env.NODE_ENV === "development") {
			this.log("debug", context, message, data)
		}
	}

	info(context: string, message: string, data?: any) {
		this.log("info", context, message, data)
	}

	warn(context: string, message: string, data?: any) {
		this.log("warn", context, message, data)
	}

	error(context: string, message: string, data?: any) {
		this.log("error", context, message, data)
	}

	// Specialized logging methods for common operations
	startOperation(operation: string, details?: any) {
		this.info("OPERATION_START", `Starting: ${operation}`, details)
	}

	endOperation(operation: string, success: boolean, details?: any) {
		if (success) {
			this.info("OPERATION_SUCCESS", `Completed: ${operation}`, details)
		} else {
			this.error("OPERATION_FAILED", `Failed: ${operation}`, details)
		}
	}

	logValidation(passed: boolean, errorCount: number, warningCount: number) {
		const level = passed ? "info" : "error"
		this.log(level, "VALIDATION", `Validation ${passed ? "passed" : "failed"}`, {
			errorCount,
			warningCount,
		})
	}

	logFileOperation(
		operation: "upload" | "parse" | "validate" | "backup" | "write",
		filename: string,
		success: boolean,
		details?: any,
	) {
		const level = success ? "info" : "error"
		this.log(level, `FILE_${operation.toUpperCase()}`, `${operation} ${filename}`, details)
	}

	logDataChange(category: string, changeCount: number, details?: any) {
		this.info("DATA_CHANGE", `${category}: ${changeCount} changes`, details)
	}

	logGitOperation(operation: "commit" | "push", success: boolean, details?: any) {
		const level = success ? "info" : "error"
		this.log(level, `GIT_${operation.toUpperCase()}`, `Git ${operation}`, details)
	}

	// Get logs for display or export
	getLogs(filters?: { level?: LogLevel; context?: string; since?: Date }): LogEntry[] {
		let filtered = [...this.logs]

		if (filters?.level) {
			filtered = filtered.filter((log) => log.level === filters.level)
		}

		if (filters?.context) {
			filtered = filtered.filter((log) => log.context === filters.context)
		}

		if (filters?.since) {
			filtered = filtered.filter((log) => new Date(log.timestamp) >= filters.since!)
		}

		return filtered
	}

	// Get summary statistics
	getSummary() {
		const byLevel = this.logs.reduce(
			(acc, log) => {
				acc[log.level] = (acc[log.level] || 0) + 1
				return acc
			},
			{} as Record<LogLevel, number>,
		)

		const byContext = this.logs.reduce(
			(acc, log) => {
				acc[log.context] = (acc[log.context] || 0) + 1
				return acc
			},
			{} as Record<string, number>,
		)

		return {
			totalLogs: this.logs.length,
			byLevel,
			byContext,
			sessionId: this.sessionId,
			userId: this.userId,
		}
	}

	// Export logs to JSON
	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2)
	}

	// Export logs to CSV
	exportLogsCSV(): string {
		const headers = ["Timestamp", "Level", "Context", "Message", "Data", "User ID", "Session ID"]
		const rows = this.logs.map((log) => [
			log.timestamp,
			log.level,
			log.context,
			log.message,
			JSON.stringify(log.data || ""),
			log.userId || "",
			log.sessionId,
		])

		return [
			headers.join(","),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
		].join("\n")
	}

	// Clear old logs
	clearLogs(olderThan?: Date) {
		if (olderThan) {
			this.logs = this.logs.filter((log) => new Date(log.timestamp) >= olderThan)
		} else {
			this.logs = []
		}

		if (typeof window !== "undefined") {
			localStorage.setItem("salary-import-logs", JSON.stringify(this.logs))
		}
	}

	// Send to external logging service (e.g., Sentry, LogRocket, etc.)
	private async sendToExternalService(entry: LogEntry) {
		// Placeholder for external service integration
		// In production, you would send to services like:
		// - Sentry for error tracking
		// - LogRocket for session replay
		// - Datadog for APM
		// - CloudWatch for AWS
		// etc.

		if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
			// Example: Send to Sentry
			try {
				// Sentry.captureException(entry)
			} catch (error) {
				console.error("Failed to send log to external service:", error)
			}
		}
	}
}

// Singleton instance
export const logger = new SalaryImportLogger()

// Performance measurement utility
export class PerformanceTracker {
	private measurements: Map<string, number> = new Map()

	start(operation: string) {
		this.measurements.set(operation, Date.now())
		logger.debug("PERFORMANCE", `Started measuring: ${operation}`)
	}

	end(operation: string): number {
		const startTime = this.measurements.get(operation)
		if (!startTime) {
			logger.warn("PERFORMANCE", `No start time found for: ${operation}`)
			return 0
		}

		const duration = Date.now() - startTime
		this.measurements.delete(operation)

		logger.info("PERFORMANCE", `${operation} took ${duration}ms`)
		return duration
	}

	measure<T>(operation: string, fn: () => T): T {
		this.start(operation)
		try {
			const result = fn()
			this.end(operation)
			return result
		} catch (error) {
			this.end(operation)
			throw error
		}
	}

	async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		this.start(operation)
		try {
			const result = await fn()
			this.end(operation)
			return result
		} catch (error) {
			this.end(operation)
			throw error
		}
	}
}

export const performance = new PerformanceTracker()
