"use client"

import { useState } from "react"
import { Alert, Card, Modal, Typography, Upload } from "antd"
import { InboxOutlined } from "@ant-design/icons"
import { uploadAndPreviewSalaryData } from "@/app/actions/salary-import"
import SalaryPreviewDiff from "./SalaryPreviewDiff"

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

export default function SalaryImportPage() {
	const [previewData, setPreviewData] = useState<any>(null)
	const [loading, setLoading] = useState(false)

	const handleUpload = async (file: File) => {
		setLoading(true)

		try {
			const formData = new FormData()
			formData.append("file", file)

			const result = await uploadAndPreviewSalaryData(formData)

			if (result.success) {
				setPreviewData(result.data)
			} else {
				// Show validation errors
				Modal.error({
					title: "فشل التحقق من الصحة",
					width: 600,
					content: (
						<div className="space-y-4">
							<Text>{result.error}</Text>

							{result.validationErrors && result.validationErrors.length > 0 && (
								<div>
									<Text strong>الأخطاء:</Text>
									<ul className="list-disc mr-6 mt-2 max-h-96 overflow-y-auto">
										{result.validationErrors.map((error: any, i: number) => (
											<li key={i} className="text-red-600">
												<Text strong>
													{error.sheet}
													{error.row && `، الصف ${error.row}`}
													{error.field && `: ${error.field}`}
												</Text>
												<br />
												{error.message}
												{error.value && (
													<>
														<br />
														<Text type="secondary">القيمة: {JSON.stringify(error.value)}</Text>
													</>
												)}
											</li>
										))}
									</ul>
								</div>
							)}

							{result.validationWarnings && result.validationWarnings.length > 0 && (
								<div>
									<Text strong className="text-yellow-600">
										التحذيرات:
									</Text>
									<ul className="list-disc mr-6 mt-2">
										{result.validationWarnings.map((warning: any, i: number) => (
											<li key={i} className="text-yellow-600">
												{warning.message}
												{warning.suggestion && (
													<>
														<br />
														<Text type="secondary">{warning.suggestion}</Text>
													</>
												)}
											</li>
										))}
									</ul>
								</div>
							)}

							<Alert
								message="الرجاء تصحيح الأخطاء في ملف Excel والمحاولة مرة أخرى."
								type="error"
								showIcon
							/>
						</div>
					),
				})
			}
		} catch (error) {
			Modal.error({
				title: "فشل الرفع",
				content: error instanceof Error ? error.message : "حدث خطأ غير معروف",
			})
		} finally {
			setLoading(false)
		}

		return false // Prevent auto upload
	}

	return (
		<div className="mx-auto min-h-screen max-w-7xl p-8">
			<Card>
				<div className="space-y-6">
					<div>
						<Title level={2}>استيراد هيكل الرواتب</Title>
						<Paragraph>
							قم برفع ملف Excel لتحديث حاسبة الرواتب. ستتمكن من معاينة التغييرات وتأكيدها قبل تطبيقها.
						</Paragraph>
					</div>

					{!previewData ? (
						<div className="space-y-4">
							<Alert
								message="كيف يعمل"
								description={
									<ol className="list-decimal mr-6 space-y-2">
										<li>قم برفع ملف Excel الذي يحتوي على بيانات الرواتب</li>
										<li>يقوم النظام بالتحقق من البيانات وتحليلها</li>
										<li>راجع المقارنة التفصيلية للتغييرات</li>
										<li>أكد لتطبيق التغييرات (يتم إنشاء نسخة احتياطية تلقائياً)</li>
										<li>يتم حفظ التغييرات في git ونشرها</li>
									</ol>
								}
								type="info"
								showIcon
							/>

							<Alert
								message="تنسيق Excel المطلوب"
								description={
									<div>
										<Text>يجب أن يحتوي ملف Excel على هذه الأوراق الست:</Text>
										<ul className="list-disc mr-6 mt-2">
											<li>Base Salaries 2025</li>
											<li>Career Tracks</li>
											<li>Regional Adjustments</li>
											<li>Float Level Adjustments</li>
											<li>Job Levels</li>
											<li>Config</li>
										</ul>
										<Text type="secondary" className="mt-2 block">
											راجع الوثائق للحصول على تفاصيل التنسيق الكاملة.
										</Text>
									</div>
								}
								type="warning"
								showIcon
							/>

							<Dragger
								beforeUpload={handleUpload}
								accept=".xlsx,.xls"
								maxCount={1}
								showUploadList={false}
								disabled={loading}
							>
								<p className="ant-upload-drag-icon">
									<InboxOutlined />
								</p>
								<p className="ant-upload-text">
									{loading ? "جاري المعالجة..." : "اضغط أو اسحب ملف Excel هنا للرفع"}
								</p>
								<p className="ant-upload-hint">
									يدعم ملفات .xlsx و .xls. سيتم التحقق من الملف قبل عرض المعاينة.
								</p>
							</Dragger>
						</div>
					) : (
						<SalaryPreviewDiff data={previewData} />
					)}
				</div>
			</Card>
		</div>
	)
}
