import React, { useState } from "react"
import { Checkbox, Form, Select } from "antd"
import { JobOfferFormData } from "./JobOfferFormTypes"

interface ManagerSignProps {
	formData: JobOfferFormData
	setFormData: React.Dispatch<React.SetStateAction<JobOfferFormData>>
}

export const managers = [
	{ value: "عبدالرحمن أبومالح", label: "عبدالرحمن أبومالح", jobTitle: "الرئيس التنفيذي" },
	{ value: "أسيل باعبدالله", label: "أسيل باعبدالله", jobTitle: "رئيسة الإنتاج" },
	{ value: "فيصل الغامدي", label: "فيصل الغامدي", jobTitle: "رئيس الأعمال" },
	{ value: "علي بوصالح", label: "علي بوصالح", jobTitle: "رئيس التقنية" },
	{
		value: "البراء العوهلي",
		label: "البراء العوهلي",
		jobTitle: "رئيس ثقافة المنظومة",
	},
	{
		value: "صالح العطر",
		label: "صالح العطر",
		jobTitle: "نائب رئيس التواصل",
	},
	{
		value: "أنس الأهدل",
		label: "أنس الأهدل",
		jobTitle: "نائب الرئيس للنمو والنشر",
	},
	{
		value: "عبدالقدوس الحاج حسين",
		label: "عبدالقدوس الحاج حسين",
		jobTitle: "نائب الرئيس للخدمات المشتركة",
	},
	{
		value: "معاذ الحربي",
		label: "معاذ الحربي",
		jobTitle: "نائب الرئيس للتصميم",
	},
	{ value: "إبراهيم القرعاوي", label: "إبراهيم القرعاوي", jobTitle: "رئيس التسويق" },
]

export default function ManagerSign({ formData, setFormData }: ManagerSignProps) {
	const [showManagerSelect, setShowManagerSelect] = useState(false)

	return (
		<>
			<Form.Item name="signByBoss" valuePropName="checked" className="mb-2!">
				<Checkbox
					onChange={(e) => {
						if (!e.target.checked) {
							setFormData({
								...formData,
								managerSignName: "",
							})
						}
						setShowManagerSelect(e.target.checked)
					}}
				>
					التوقيع من قبل تنفيذي القسم؟
				</Checkbox>
			</Form.Item>

			{showManagerSelect && (
				<Form.Item
					label="اختر المدير"
					name="managerSignName"
					rules={[
						{
							required: true,
							message: "الرجاء اختيار المدير",
						},
					]}
				>
					<Select
						placeholder="اختر المدير"
						options={managers}
						onChange={(value) =>
							setFormData({
								...formData,
								managerSignName: value,
							})
						}
					/>
				</Form.Item>
			)}
		</>
	)
}
