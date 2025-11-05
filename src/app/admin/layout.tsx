"use client"

import React from "react"
import { Alert, Card } from "antd"
import { LockOutlined } from "@ant-design/icons"
import { useAuth } from "@/lib/context/AuthContext"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth()

	// Show loading state
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card loading />
			</div>
		)
	}

	// Check if user is authenticated with @thmanyah.com email
	const isAuthorized = user?.email?.endsWith("@thmanyah.com")

	if (!isAuthorized) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="max-w-md">
					<Alert
						message="Access Denied"
						description={
							<div className="space-y-2">
								<p>You do not have permission to access this admin area.</p>
								<p>
									Only users with @thmanyah.com email addresses can access salary import
									functionality.
								</p>
								{user && (
									<p className="text-sm text-gray-500">Logged in as: {user.email}</p>
								)}
							</div>
						}
						type="error"
						icon={<LockOutlined />}
						showIcon
					/>
				</Card>
			</div>
		)
	}

	return <>{children}</>
}
