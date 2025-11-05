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
						message="تم رفض الدخول"
						description={
							<div className="space-y-2">
								<p>ليس لديك صلاحية للوصول إلى هذه المنطقة الإدارية.</p>
								<p>
									يمكن فقط للمستخدمين الذين لديهم بريد إلكتروني من @thmanyah.com الوصول إلى وظيفة
									استيراد الرواتب.
								</p>
								{user && (
									<p className="text-sm text-gray-500">تم تسجيل الدخول بـ: {user.email}</p>
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
