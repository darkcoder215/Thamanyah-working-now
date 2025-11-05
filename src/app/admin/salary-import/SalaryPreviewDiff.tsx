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
			title: "تطبيق التغييرات؟",
			icon: <ExclamationCircleOutlined />,
			content: (
				<div className="space-y-2">
					<p>سيؤدي ذلك إلى:</p>
					<ul className="list-disc mr-6">
						<li>تحديث ملف salary-data.ts</li>
						<li>إنشاء نسخة احتياطية من الإصدار الحالي</li>
						{process.env.NEXT_PUBLIC_ENABLE_AUTO_COMMIT === "true" && (
							<li>حفظ التغييرات في git</li>
						)}
						{process.env.NEXT_PUBLIC_VERCEL_DEPLOY_HOOK && (
							<li>تشغيل النشر التلقائي</li>
						)}
					</ul>
					<p className="mt-2 text-gray-500">يمكنك التراجع عبر git إذا لزم الأمر.</p>
				</div>
			),
			okText: "نعم، طبّق التغييرات",
			cancelText: "إلغاء",
			okButtonProps: { danger: true },
			onOk: async () => {
				setApplying(true)
				try {
					const result = await applyChanges(data.parsedData, commitMessage)

					if (result.success) {
						Modal.success({
							title: "تم تطبيق التغييرات بنجاح!",
							content: (
								<div className="space-y-2">
									<p>✓ تم تحديث هيكل الرواتب</p>
									<p>✓ تم حفظ النسخة الاحتياطية: {result.backupPath}</p>
									{process.env.NEXT_PUBLIC_ENABLE_AUTO_COMMIT === "true" && (
										<p>✓ تم الحفظ في git</p>
									)}
									{process.env.NEXT_PUBLIC_VERCEL_DEPLOY_HOOK && (
										<p>⏳ تم تشغيل النشر</p>
									)}
									<p className="mt-4 text-gray-600">
										ستكون التغييرات مباشرة خلال دقيقتين تقريباً.
									</p>
								</div>
							),
							onOk: () => {
								window.location.href = "/salary-calculator"
							},
						})
					} else {
						Modal.error({
							title: "فشل تطبيق التغييرات",
							content: result.error,
						})
					}
				} catch (error) {
					Modal.error({
						title: "خطأ",
						content: error instanceof Error ? error.message : "خطأ غير معروف",
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
				return <Tag color="green">مضاف</Tag>
			case "modified":
				return <Tag color="blue">معدّل</Tag>
			case "removed":
				return <Tag color="red">محذوف</Tag>
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
			title: "المستوى",
			dataIndex: "level",
			key: "level",
			width: 80,
		},
		{
			title: "التغيير",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "الحد الأدنى الحالي",
			dataIndex: ["old", "min"],
			key: "currentMin",
			render: (val: number) => (val ? val.toLocaleString() : "-"),
		},
		{
			title: "الحد الأدنى الجديد",
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
			title: "الحد الأقصى الحالي",
			dataIndex: ["old", "max"],
			key: "currentMax",
			render: (val: number) => (val ? val.toLocaleString() : "-"),
		},
		{
			title: "الحد الأقصى الجديد",
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
			title: "المسار",
			dataIndex: "trackName",
			key: "trackName",
			width: 200,
		},
		{
			title: "المستوى",
			dataIndex: "level",
			key: "level",
			width: 80,
		},
		{
			title: "التغيير",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "النسبة الحالية",
			dataIndex: "old",
			key: "old",
			render: (val: number) => (val !== undefined ? `${val}%` : "-"),
		},
		{
			title: "النسبة الجديدة",
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
			title: "الموقع",
			dataIndex: "locationName",
			key: "locationName",
		},
		{
			title: "التغيير",
			dataIndex: "type",
			key: "type",
			width: 100,
			render: renderChangeType,
		},
		{
			title: "النسبة الحالية",
			dataIndex: "old",
			key: "old",
			render: (val: number) => (val !== undefined ? `${val}%` : "-"),
		},
		{
			title: "النسبة الجديدة",
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
					<Title level={4}>معاينة التغييرات من: {data.filename}</Title>

					<Alert
						message={`تم العثور على ${data.diff.length} تغيير${data.diff.length !== 1 ? "ات" : ""}`}
						description="راجع بعناية قبل التطبيق. يمكنك التراجع عبر git إذا لزم الأمر."
						type={data.diff.length > 0 ? "warning" : "success"}
						icon={data.diff.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
						showIcon
					/>

					{/* Impact Summary */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<Statistic
							title="الرواتب الأساسية"
							value={data.impact.summary.baseSalaryChanges}
							valueStyle={{
								color: data.impact.summary.baseSalaryChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="المسارات الوظيفية"
							value={data.impact.summary.trackChanges}
							valueStyle={{
								color: data.impact.summary.trackChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="التعديلات الإقليمية"
							value={data.impact.summary.regionalChanges}
							valueStyle={{
								color: data.impact.summary.regionalChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="المستويات الوظيفية"
							value={data.impact.summary.jobLevelChanges}
							valueStyle={{
								color: data.impact.summary.jobLevelChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
						<Statistic
							title="الإعدادات"
							value={data.impact.summary.configChanges}
							valueStyle={{
								color: data.impact.summary.configChanges > 0 ? "#1890ff" : undefined,
							}}
						/>
					</div>

					{data.warnings && data.warnings.length > 0 && (
						<Alert
							message={`${data.warnings.length} تحذير${data.warnings.length !== 1 ? "ات" : ""}`}
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
							label: `الرواتب الأساسية (${baseSalaryChanges.length})`,
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
									<Alert message="لا توجد تغييرات في الرواتب الأساسية" type="success" showIcon />
								),
						},
						{
							key: "tracks",
							label: `المسارات الوظيفية (${trackChanges.length})`,
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
									<Alert message="لا توجد تغييرات في المسارات الوظيفية" type="success" showIcon />
								),
						},
						{
							key: "regional",
							label: `التعديلات الإقليمية (${regionalChanges.length})`,
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
										message="لا توجد تغييرات في التعديلات الإقليمية"
										type="success"
										showIcon
									/>
								),
						},
						{
							key: "levels",
							label: `المستويات الوظيفية (${jobLevelChanges.length})`,
							children:
								jobLevelChanges.length > 0 ? (
									<div>
										{jobLevelChanges.map((change, i) => (
											<Card key={i} size="small" className="mb-2">
												<Text>
													المستوى {change.level}: {renderChangeType(change.type)}
												</Text>
											</Card>
										))}
									</div>
								) : (
									<Alert message="لا توجد تغييرات في المستويات الوظيفية" type="success" showIcon />
								),
						},
						{
							key: "config",
							label: `الإعدادات (${configChanges.length})`,
							children:
								configChanges.length > 0 ? (
									<div>
										{configChanges.map((change, i) => (
											<Card key={i} size="small" className="mb-2">
												<Text>
													{change.field}: {change.old} ← <Text strong>{change.new}</Text>
												</Text>
											</Card>
										))}
									</div>
								) : (
									<Alert message="لا توجد تغييرات في الإعدادات" type="success" showIcon />
								),
						},
					]}
				/>
			</Card>

			{/* Apply Section */}
			<Card>
				<div className="space-y-4">
					<div>
						<Text strong>رسالة الحفظ (اختياري لكن موصى به)</Text>
						<TextArea
							placeholder="مثال: تعديلات الربع الثاني 2025: زيادة التقنية +5%، تحديث تكلفة مصر"
							value={commitMessage}
							onChange={(e) => setCommitMessage(e.target.value)}
							rows={3}
							className="mt-2"
						/>
						<Text type="secondary" className="text-sm">
							هذا يساعد في تتبع التغييرات في سجل git
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
							تطبيق التغييرات
						</Button>
						<Button size="large" onClick={() => window.location.reload()}>
							إلغاء
						</Button>
					</Space>
				</div>
			</Card>
		</div>
	)
}
