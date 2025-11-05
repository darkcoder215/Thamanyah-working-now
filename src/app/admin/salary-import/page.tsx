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
					title: "Validation Failed",
					width: 600,
					content: (
						<div className="space-y-4">
							<Text>{result.error}</Text>

							{result.validationErrors && result.validationErrors.length > 0 && (
								<div>
									<Text strong>Errors:</Text>
									<ul className="list-disc mr-6 mt-2 max-h-96 overflow-y-auto">
										{result.validationErrors.map((error: any, i: number) => (
											<li key={i} className="text-red-600">
												<Text strong>
													{error.sheet}
													{error.row && `, Row ${error.row}`}
													{error.field && `: ${error.field}`}
												</Text>
												<br />
												{error.message}
												{error.value && (
													<>
														<br />
														<Text type="secondary">Value: {JSON.stringify(error.value)}</Text>
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
										Warnings:
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
								message="Please fix the errors in your Excel file and try again."
								type="error"
								showIcon
							/>
						</div>
					),
				})
			}
		} catch (error) {
			Modal.error({
				title: "Upload Failed",
				content: error instanceof Error ? error.message : "Unknown error occurred",
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
						<Title level={2}>Import Salary Structure</Title>
						<Paragraph>
							Upload an Excel file to update the salary calculator. You'll be able to preview and
							confirm changes before applying them.
						</Paragraph>
					</div>

					{!previewData ? (
						<div className="space-y-4">
							<Alert
								message="How it works"
								description={
									<ol className="list-decimal mr-6 space-y-2">
										<li>Upload your Excel file with salary data</li>
										<li>System validates and parses the data</li>
										<li>Review side-by-side comparison of changes</li>
										<li>Confirm to apply changes (automatic backup created)</li>
										<li>Changes are committed to git and deployed</li>
									</ol>
								}
								type="info"
								showIcon
							/>

							<Alert
								message="Required Excel Format"
								description={
									<div>
										<Text>Your Excel file must contain these 6 sheets:</Text>
										<ul className="list-disc mr-6 mt-2">
											<li>Base Salaries 2025</li>
											<li>Career Tracks</li>
											<li>Regional Adjustments</li>
											<li>Float Level Adjustments</li>
											<li>Job Levels</li>
											<li>Config</li>
										</ul>
										<Text type="secondary" className="mt-2 block">
											See documentation for detailed format specifications.
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
									{loading ? "Processing..." : "Click or drag Excel file here to upload"}
								</p>
								<p className="ant-upload-hint">
									Supports .xlsx and .xls files. File will be validated before showing preview.
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
