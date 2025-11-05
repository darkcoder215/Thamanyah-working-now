"use client"

import { useState } from "react"
import {
	Alert,
	Button,
	Card,
	Input,
	Modal,
	Space,
	Table,
	Tabs,
	Tag,
	Typography,
	Statistic,
} from "antd"
import {
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	WarningOutlined,
} from "@ant-design/icons"
import { applyChanges } from "@/app/actions/salary-import"
import type { ParsedSalaryData } from "@/lib/excel-parser"

const { Title, Text } = Typography
const { TextArea } = Input

interface PreviewData {
	parsedData: ParsedSalaryData
	diff: any[]
	impact: any
	filename: string
	warnings?: any[]
}

export default function SalaryPreviewDiff({ data }: { data: PreviewData }) {
	const [commitMessage, setCommitMessage] = useState("")
	const [applying, setApplying] = useState(false)

	const handleApply = () => {
		Modal.confirm({
			title: "Apply Changes?",
			icon: <ExclamationCircleOutlined />,
			content: (
				<div className="space-y-2">
					<p>This will:</p>
					<ul className="list-disc mr-6">
						<li>Update the salary-data.ts file</li>
						<li>Create a backup of the current version</li>
						{process.env.NEXT_PUBLIC_ENABLE_AUTO_COMMIT === "true" && (
							<li>Commit changes to git</li>
						)}
						{process.env.NEXT_PUBLIC_VERCEL_DEPLOY_HOOK && (
							<li>Trigger automatic deployment</li>
						)}
					</ul>
					<p className="mt-2 text-gray-500">You can rollback via git if needed.</p>
				</div>
			),
			okText: "Yes, Apply Changes",
			cancelText: "Cancel",
			okButtonProps: { danger: true },
			onOk: async () => {
				setApplying(true)
				try {
					const result = await applyChanges(data.parsedData, commitMessage)

					if (result.success) {
						Modal.success({
							title: "Changes Applied Successfully!",
							content: (
								<div className="space-y-2">
									<p>✓ Salary structure updated</p>
									<p>✓ Backup saved: {result.backupPath}</p>
									{process.env.NEXT_PUBLIC_ENABLE_AUTO_COMMIT === "true" && (
										<p>✓ Committed to git</p>
									)}
									{process.env.NEXT_PUBLIC_VERCEL_DEPLOY_HOOK && (
										<p>⏳ Deployment triggered</p>
									)}
									<p className="mt-4 text-gray-600">
										Your changes will be live in ~2 minutes.
									</p>
								</div>
							),
							onOk: () => {
								window.location.href = "/salary-calculator"
							},
						})
					} else {
						Modal.error({
							title: "Failed to Apply Changes",
							content: result.error,
						})
					}
				} catch (error) {
					Modal.error({
						title: "Error",
						content: error instanceof Error ? error.message : "Unknown error",
					})
				} finally {
					setApplying(false)
				}
			},
		})
	}

	const renderChangeType = (type: string) => {
		switch (type) {
			case "added":
				return <Tag color="green">Added</Tag>
			case "modified":
				return <Tag color="blue">Modified</Tag>
			case "removed":
				return <Tag color="red">Removed</Tag>
			default:
				return <Tag>{type}</Tag>
		}
	}

	const renderPercentageChange = (oldVal?: number, newVal?: number) => {
		if (oldVal === undefined || newVal === undefined) return "-"

		const diff = newVal - oldVal
		const color = diff > 0 ? "green" : diff < 0 ? "red" : "default"
		const sign = diff > 0 ? "+" : ""

		return <Tag color={color}>{`${sign}${diff}pp`}</Tag>
	}

	const renderSalaryChange = (oldVal?: number, newVal?: number) => {
		if (oldVal === undefined || newVal === undefined) return "-"

		const diff = newVal - oldVal
		const percentChange = ((diff / oldVal) * 100).toFixed(1)
		const color = diff > 0 ? "green" : diff < 0 ? "red" : "default"
		const sign = diff > 0 ? "+" : ""

		return (
			<div>
				<Tag color={color}>{`${sign}${diff.toLocaleString()} SAR`}</Tag>
				<Text type="secondary" className="mr-2">
					({sign}
					{percentChange}%)
				</Text>
			</div>
		)
	}

	// Filter changes by category
	const baseSalaryChanges = data.diff.filter((c: any) => c.category === "baseSalary")
	const trackChanges = data.diff.filter((c: any) => c.category === "trackPercentage")
	const regionalChanges = data.diff.filter((c: any) => c.category === "regional")
	const jobLevelChanges = data.diff.filter((c: any) => c.category === "jobLevel")
	const configChanges = data.diff.filter((c: any) => c.category === "config")

	// Table columns
	const baseSalaryColumns = [
		{
			title: "Level",
			dataIndex: "level",
			key: "level",
			width: 80,
		},
		{
			title: "Change",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "Current Min",
			dataIndex: ["old", "min"],
			key: "currentMin",
			render: (val: number) => (val ? val.toLocaleString() : "-"),
		},
		{
			title: "New Min",
			dataIndex: ["new", "min"],
			key: "newMin",
			render: (val: number, record: any) => (
				<div>
					<Text strong>{val?.toLocaleString() || "-"}</Text>
					{record.type === "modified" && renderSalaryChange(record.old?.min, val)}
				</div>
			),
		},
		{
			title: "Current Max",
			dataIndex: ["old", "max"],
			key: "currentMax",
			render: (val: number) => (val ? val.toLocaleString() : "-"),
		},
		{
			title: "New Max",
			dataIndex: ["new", "max"],
			key: "newMax",
			render: (val: number, record: any) => (
				<div>
					<Text strong>{val?.toLocaleString() || "-"}</Text>
					{record.type === "modified" && renderSalaryChange(record.old?.max, val)}
				</div>
			),
		},
	]

	const trackColumns = [
		{
			title: "Track",
			dataIndex: "trackName",
			key: "trackName",
			width: 200,
		},
		{
			title: "Level",
			dataIndex: "level",
			key: "level",
			width: 80,
		},
		{
			title: "Change",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "Current %",
			dataIndex: "old",
			key: "old",
			render: (val: number) => (val !== undefined ? `${val}%` : "-"),
		},
		{
			title: "New %",
			dataIndex: "new",
			key: "new",
			render: (val: number, record: any) => (
				<div>
					<Text strong>{val !== undefined ? `${val}%` : "-"}</Text>
					{record.type === "modified" && renderPercentageChange(record.old, val)}
				</div>
			),
		},
	]

	const regionalColumns = [
		{
			title: "Location",
			dataIndex: "locationName",
			key: "locationName",
		},
		{
			title: "Change",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "Current %",
			dataIndex: "old",
			key: "old",
			render: (val: number) => (val !== undefined ? `${val}%` : "-"),
		},
		{
			title: "New %",
			dataIndex: "new",
			key: "new",
			render: (val: number, record: any) => (
				<div>
					<Text strong>{val !== undefined ? `${val}%` : "-"}</Text>
					{record.type === "modified" && renderPercentageChange(record.old, val)}
				</div>
			),
		},
	]

	return (
		<div className="space-y-6">
			{/* Summary Card */}
			<Card>
				<div className="space-y-4">
					<Title level={4}>Preview Changes from: {data.filename}</Title>

					<Alert
						message={`Found ${data.diff.length} change${data.diff.length !== 1 ? "s" : ""}`}
						description="Review carefully before applying. You can rollback via git if needed."
						type={data.diff.length > 0 ? "warning" : "success"}
						icon={data.diff.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
						showIcon
					/>

					{/* Impact Summary */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<Statistic
							title="Base Salaries"
							value={data.impact.summary.baseSalaryChanges}
							valueStyle={{
								color: data.impact.summary.baseSalaryChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="Career Tracks"
							value={data.impact.summary.trackChanges}
							valueStyle={{
								color: data.impact.summary.trackChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="Regional"
							value={data.impact.summary.regionalChanges}
							valueStyle={{
								color: data.impact.summary.regionalChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="Job Levels"
							value={data.impact.summary.jobLevelChanges}
							valueStyle={{
								color: data.impact.summary.jobLevelChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="Config"
							value={data.impact.summary.configChanges}
							valueStyle={{
								color: data.impact.summary.configChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
					</div>

					{data.warnings && data.warnings.length > 0 && (
						<Alert
							message={`${data.warnings.length} Warning${data.warnings.length !== 1 ? "s" : ""}`}
							description={
								<ul className="list-disc mr-6">
									{data.warnings.map((warning, i) => (
										<li key={i}>{warning.message}</li>
									))}
								</ul>
							}
							type="warning"
							showIcon
						/>
					)}
				</div>
			</Card>

			{/* Changes Tabs */}
			<Card>
				<Tabs
					items={[
						{
							key: "base",
							label: `Base Salaries (${baseSalaryChanges.length})`,
							children:
								baseSalaryChanges.length > 0 ? (
									<Table
										columns={baseSalaryColumns}
										dataSource={baseSalaryChanges}
										pagination={false}
										size="small"
										rowKey={(record) => `${record.level}-${record.type}`}
									/>
								) : (
									<Alert message="No changes to base salaries" type="success" showIcon />
								),
						},
						{
							key: "tracks",
							label: `Career Tracks (${trackChanges.length})`,
							children:
								trackChanges.length > 0 ? (
									<Table
										columns={trackColumns}
										dataSource={trackChanges}
										pagination={false}
										size="small"
										rowKey={(record) => `${record.track}-${record.level}`}
									/>
								) : (
									<Alert message="No changes to career tracks" type="success" showIcon />
								),
						},
						{
							key: "regional",
							label: `Regional (${regionalChanges.length})`,
							children:
								regionalChanges.length > 0 ? (
									<Table
										columns={regionalColumns}
										dataSource={regionalChanges}
										pagination={false}
										size="small"
										rowKey={(record) => record.location}
									/>
								) : (
									<Alert
										message="No changes to regional adjustments"
										type="success"
										showIcon
									/>
								),
						},
						{
							key: "levels",
							label: `Job Levels (${jobLevelChanges.length})`,
							children:
								jobLevelChanges.length > 0 ? (
									<div>
										{jobLevelChanges.map((change, i) => (
											<Card key={i} size="small" className="mb-2">
												<Text>
													Level {change.level}: {renderChangeType(change.type)}
												</Text>
											</Card>
										))}
									</div>
								) : (
									<Alert message="No changes to job levels" type="success" showIcon />
								),
						},
						{
							key: "config",
							label: `Config (${configChanges.length})`,
							children:
								configChanges.length > 0 ? (
									<div>
										{configChanges.map((change, i) => (
											<Card key={i} size="small" className="mb-2">
												<Text>
													{change.field}: {change.old} → <Text strong>{change.new}</Text>
												</Text>
											</Card>
										))}
									</div>
								) : (
									<Alert message="No changes to configuration" type="success" showIcon />
								),
						},
					]}
				/>
			</Card>

			{/* Apply Section */}
			<Card>
				<div className="space-y-4">
					<div>
						<Text strong>Commit Message (optional but recommended)</Text>
						<TextArea
							placeholder="e.g., Q2 2025 adjustments: Tech +5%, Egypt cost update"
							value={commitMessage}
							onChange={(e) => setCommitMessage(e.target.value)}
							rows={3}
							className="mt-2"
						/>
						<Text type="secondary" className="text-sm">
							This helps track changes in git history
						</Text>
					</div>

					<Space>
						<Button
							type="primary"
							size="large"
							icon={<CheckCircleOutlined />}
							onClick={handleApply}
							loading={applying}
							disabled={data.diff.length === 0}
						>
							Apply Changes
						</Button>
						<Button size="large" onClick={() => window.location.reload()}>
							Cancel
						</Button>
					</Space>
				</div>
			</Card>
		</div>
	)
}
