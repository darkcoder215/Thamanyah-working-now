# Excel Template Guide for Salary Import

## Overview

This guide explains how to structure your Excel file for importing salary data into the Thamanyah salary calculator.

---

## 📋 Required Sheets

Your Excel file must contain the following sheets (exact names):

1. **Base Salaries 2025**
2. **Career Tracks**
3. **Regional Adjustments**
4. **Float Level Adjustments**
5. **Job Levels**
6. **Config**

---

## 1️⃣ Base Salaries 2025

This sheet contains the baseline salary ranges for each level.

### Columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Level | Number | Yes | Job level (1-8, including 0.5 increments) | 1, 2, 3, 4.5, 5 |
| Min | Number | Yes | Minimum salary for this level | 8000 |
| Average | Number | Yes | Average/midpoint salary | 9000 |
| Max | Number | Yes | Maximum salary for this level | 10000 |

### Example:

```
Level | Min   | Average | Max
------|-------|---------|-------
1     | 8000  | 9000    | 10000
2     | 10500 | 12000   | 13500
3     | 13910 | 15649   | 17388
4     | 17600 | 19525   | 21450
5     | 24640 | 26320   | 28000
6     | 32200 | 34500   | 36800
7     | 42000 | 46200   | 50400
8     | 60200 | 65800   | 71400
```

### Validation Rules:
- ✅ `Min <= Average <= Max`
- ✅ Level must be between 1 and 10
- ✅ All salary values must be positive integers
- ✅ Each level must be unique

---

## 2️⃣ Career Tracks

This sheet defines career paths and their salary adjustments.

### Columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Track Key | Text | Yes | Unique identifier (no spaces, use hyphens) | tech, business, base-2025 |
| Track Name | Text | Yes | Display name in Arabic | مسار التقنية |
| Description | Text | Yes | Track description | التصميم الرقمي، إدارة المنتج... |
| L1% | Number | Yes | Percentage adjustment for Level 1 | 20 |
| L2% | Number | Yes | Percentage adjustment for Level 2 | 15 |
| L3% | Number | Yes | Percentage adjustment for Level 3 | 20 |
| L4% | Number | Yes | Percentage adjustment for Level 4 | 25 |
| L4.5% | Number | Yes | Percentage adjustment for Level 4.5 | 0 |
| L5% | Number | Yes | Percentage adjustment for Level 5 | 30 |
| L5.5% | Number | Yes | Percentage adjustment for Level 5.5 | 0 |
| L6% | Number | Yes | Percentage adjustment for Level 6 | 33 |
| L6.5% | Number | Yes | Percentage adjustment for Level 6.5 | 0 |
| L7% | Number | Yes | Percentage adjustment for Level 7 | 36 |
| L7.5% | Number | Yes | Percentage adjustment for Level 7.5 | 0 |
| L8% | Number | Yes | Percentage adjustment for Level 8 | 31 |

### Example:

```
Track Key | Track Name      | Description                           | L1% | L2% | L3% | L4% | L5% | L6% | L7% | L8%
----------|-----------------|---------------------------------------|-----|-----|-----|-----|-----|-----|-----|-----
base-2025 | المسار الأساسي  | ثقافة المنظومة، التسويق، المحاسبة     | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0
tech      | مسار التقنية    | التصميم الرقمي، إدارة المنتج، البيانات | 20  | 15  | 20  | 25  | 30  | 33  | 36  | 31
business  | مسار الأعمال    | تطوير الأعمال، مبيعات، محلل أعمال     | 20  | 15  | 15  | 20  | 22  | 24  | 26  | 22
```

### Validation Rules:
- ✅ Track Key must be unique and lowercase
- ✅ Percentage can be 0 or positive (no negative values)
- ✅ All level percentages must be provided
- ✅ Float levels (4.5, 5.5, 6.5, 7.5) are typically 0

---

## 3️⃣ Regional Adjustments

This sheet defines location-based salary adjustments.

### Columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Location | Text | Yes | Unique location key | riyadh, egypt, dubai |
| Arabic Label | Text | Yes | Display name in Arabic | الرياض، مصر، دبي |
| Adjustment % | Number | No* | Fixed percentage adjustment | -13, 0, -40 |
| Dynamic Formula | Text | No* | For complex calculations | DYNAMIC, EGYPT |

*One of `Adjustment %` or `Dynamic Formula` must be provided

### Example:

```
Location   | Arabic Label        | Adjustment % | Dynamic Formula
-----------|---------------------|--------------|----------------
riyadh     | الرياض              | 0            |
east       | المنطقة الشرقية    | -13          |
west       | المنطقة الغربية    | -13          |
bahrain    | البحرين             | -10          |
egypt      | مصر                 | -40          | DYNAMIC
jordan     | الاردن              | -28          |
morocco    | المغرب              | -40          |
```

### Dynamic Formulas:

If you specify `DYNAMIC` in the Dynamic Formula column, you need to implement the logic in code. Currently supported:

- **EGYPT**: Level-based adjustment
  - Level 1: -50%
  - Level 4+: -40%
  - Levels 2-3: Gradual interpolation

### Validation Rules:
- ✅ Location key must be unique and lowercase
- ✅ Adjustment % must be between -100 and 100
- ✅ Either Adjustment % or Dynamic Formula must be provided
- ✅ Riyadh should typically be 0% (baseline)

---

## 4️⃣ Float Level Adjustments

This sheet defines adjustments for intermediate levels (4.5, 5.5, 6.5, 7.5).

### Columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Track Key | Text | Yes | Must match Career Track key | tech, business |
| Level | Number | Yes | Float level (4.5, 5.5, 6.5, 7.5) | 4.5 |
| Min Adjustment | Number | Yes | Adjustment to minimum salary | 500 |
| Max Adjustment | Number | Yes | Adjustment to maximum salary | -500 |

### Example:

```
Track Key | Level | Min Adjustment | Max Adjustment
----------|-------|----------------|---------------
base-2025 | 4.5   | 500            | -500
base-2025 | 5.5   | 700            | -1000
base-2025 | 6.5   | 1000           | -1750
base-2025 | 7.5   | 1250           | -5000
tech      | 4.5   | 500            | -500
tech      | 5.5   | 700            | -1000
```

### How Float Levels Work:

Float levels (e.g., 4.5) are calculated as:
- **Min**: Previous level's max + Min Adjustment
- **Max**: Next level's min + Max Adjustment
- **Average**: (Min + Max) / 2

Example for Level 4.5:
```
Level 4 max: 21,450
Level 5 min: 24,640

Level 4.5 min: 21,450 + 500 = 21,950
Level 4.5 max: 24,640 - 500 = 24,140
Level 4.5 average: (21,950 + 24,140) / 2 = 23,045
```

### Validation Rules:
- ✅ Track Key must exist in Career Tracks sheet
- ✅ Level must be 4.5, 5.5, 6.5, or 7.5
- ✅ Each track must have all 4 float levels defined
- ✅ Adjustments can be positive or negative

---

## 5️⃣ Job Levels

This sheet defines job titles for each level in Arabic and English.

### Columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| Level | Number | Yes | Job level | 1, 2, 3, 4.5 |
| Title AR | Text | Yes | Arabic title for regular employees | مساعد، مسؤول، أخصائي |
| Title EN | Text | Yes | English title for regular employees | Associate, Officer, Specialist |
| Managerial AR | Text | Yes | Arabic title for managers | قائد، مدير، مدير قسم |
| Managerial EN | Text | Yes | English title for managers | Lead, Manager, Director |
| Tech AR | Text | Yes | Arabic title for technical roles | مبتدئ، أول، كبير |
| Tech EN | Text | Yes | English title for technical roles | Junior, Senior, Staff |

### Example:

```
Level | Title AR    | Title EN       | Managerial AR | Managerial EN | Tech AR | Tech EN
------|-------------|----------------|---------------|---------------|---------|--------
1     | مساعد       | Associate      | مساعد         | Associate     | مبتدئ   | Junior
2     | مسؤول       | Officer        | مسؤول         | Officer       | (المسمى)| (Job Title)
3     | أخصائي      | Specialist     | أخصائي        | Specialist    | أول     | Senior
4     | كبير        | Staff          | قائد          | Lead          | كبير    | Staff
5     | خبير        | Expert         | مدير          | Manager       | خبير    | Expert
6     | مدير قسم    | Director       | مدير قسم      | Director      | مدير قسم| Director
7     | خبير استشاري| Consultant     | نائب رئيس     | VP            | نائب رئيس| VP
8     | رئيس        | CXO            | رئيس          | CXO           | CTO     | CTO
```

### Validation Rules:
- ✅ Each level must have all 6 title variations
- ✅ Titles must not be empty
- ✅ Levels must match those in Base Salaries sheet

---

## 6️⃣ Config

This sheet contains system-wide configuration values.

### Format:

Two columns: `Key` and `Value`

### Required Keys:

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| saudi_bonus_percent | Number | Saudi nationality bonus (as %) | 11 |
| manager_adjustment_min | Number | Minimum manager discretion adjustment (%) | -5 |
| manager_adjustment_max | Number | Maximum manager discretion adjustment (%) | 5 |
| riyadh_relocation_bonus | Number | Bonus for relocating to Riyadh (%) | 10 |
| version_name | Text | Version identifier | 2025Q1, 2025-Jan |
| effective_date | Date | When this salary structure takes effect | 2025-01-01 |

### Example:

```
Key                        | Value
---------------------------|-------
saudi_bonus_percent        | 11
manager_adjustment_min     | -5
manager_adjustment_max     | 5
riyadh_relocation_bonus    | 10
version_name               | 2025Q1
effective_date             | 2025-01-01
```

### Validation Rules:
- ✅ All keys must be present
- ✅ saudi_bonus_percent: 0-50
- ✅ manager_adjustment_min: -10 to 0
- ✅ manager_adjustment_max: 0 to 10
- ✅ riyadh_relocation_bonus: 0-30
- ✅ effective_date: Valid date in YYYY-MM-DD format

---

## ✅ Pre-Upload Checklist

Before uploading your Excel file, verify:

- [ ] All 6 sheets are present with exact names
- [ ] No empty rows in the middle of data
- [ ] All required columns are present
- [ ] No duplicate keys (Track Key, Location, Level)
- [ ] All percentages are valid numbers
- [ ] Salary ranges are logical (min < avg < max)
- [ ] Version name is unique
- [ ] Effective date is in the future (for new versions)
- [ ] All Arabic and English titles are filled
- [ ] Float levels are defined for all tracks

---

## 🚨 Common Errors

### 1. Missing Sheet
**Error**: "Sheet 'Career Tracks' not found"
**Fix**: Ensure sheet name matches exactly (case-sensitive)

### 2. Invalid Salary Range
**Error**: "Level 3: min (15000) must be less than max (14000)"
**Fix**: Check that min <= average <= max for all levels

### 3. Duplicate Track Key
**Error**: "Duplicate track key 'tech' found in row 5"
**Fix**: Ensure all track keys are unique

### 4. Missing Float Adjustments
**Error**: "Track 'business' missing float level adjustment for 5.5"
**Fix**: Define all float levels (4.5, 5.5, 6.5, 7.5) for each track

### 5. Invalid Percentage
**Error**: "Level percentage must be between -100 and 100, got 150"
**Fix**: Check that all percentage values are reasonable

---

## 📊 Sample Data Download

You can find a complete sample Excel file at:
`/docs/templates/salary-structure-template.xlsx`

This template includes:
- Pre-filled sample data
- Correct formatting
- All required sheets
- Comments and hints

---

## 🔄 Version History Format

When creating new versions, use this naming convention:

- **Quarterly**: `2025Q1`, `2025Q2`, `2025Q3`, `2025Q4`
- **Monthly**: `2025-Jan`, `2025-Feb`, etc.
- **Ad-hoc**: `2025-Adjustment-1`, `2025-Market-Update`

---

## 🆘 Need Help?

If you encounter issues:

1. Check this guide for validation rules
2. Review the sample template
3. Validate your file structure
4. Contact the development team

**Common Questions**:

**Q: Can I add extra columns?**
A: Yes, but they will be ignored. Only specified columns are imported.

**Q: What happens to float levels if I don't provide adjustments?**
A: The import will fail. You must provide adjustments for all float levels.

**Q: Can I skip level 8 (CXO)?**
A: No, all levels from 1-8 must be defined, even if not actively used.

**Q: How do I test my file before uploading?**
A: Use the validation script: `npm run validate-salary-excel path/to/file.xlsx`

---

## 📝 Best Practices

1. **Always backup** the current salary structure before importing
2. **Use version names** that clearly indicate the change (e.g., "2025Q1-Tech-Adjustment")
3. **Test with inactive version** first, review, then activate
4. **Document changes** in the version notes/metadata
5. **Coordinate with HR** before activating a new version
6. **Set effective dates** in advance for scheduled changes

---

Last Updated: 2025-01-01
