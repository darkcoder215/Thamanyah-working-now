# Quick Start Guide: Salary Import System

## 🚀 Getting Started in 10 Minutes

This guide will help you implement the salary import system quickly.

---

## Step 1: Install Dependencies (2 minutes)

```bash
# Install required packages
pnpm add xlsx zod

# Install type definitions
pnpm add -D @types/node
```

---

## Step 2: Choose Your Implementation Phase

### Option A: Script-Based (Recommended for Start)

**Best for**: Infrequent updates (quarterly/annually), small team

**Time to implement**: 1-2 hours

**Steps**:
1. Copy the import script to `scripts/import-salary-data.ts`
2. Create an Excel file following the template
3. Run the script: `npx ts-node scripts/import-salary-data.ts path/to/file.xlsx`
4. Review generated files
5. Commit and deploy

---

### Option B: Database-Backed (For Production)

**Best for**: Frequent updates, multiple users, version management

**Time to implement**: 1-2 days

**Steps**:
1. Set up Supabase database (schema provided)
2. Create server actions for import/export
3. Build admin upload interface
4. Update calculator to read from database
5. Test and deploy

---

## Step 3: Create Your First Excel Import (5 minutes)

### Quick Template Structure:

```
📄 salary-structure.xlsx
├── 📊 Base Salaries 2025
│   └── Level | Min | Average | Max
├── 📊 Career Tracks
│   └── Track Key | Track Name | Description | L1% | L2% | ...
├── 📊 Regional Adjustments
│   └── Location | Arabic Label | Adjustment % | Dynamic Formula
├── 📊 Float Level Adjustments
│   └── Track Key | Level | Min Adjustment | Max Adjustment
├── 📊 Job Levels
│   └── Level | Title AR | Title EN | ...
└── 📊 Config
    └── Key | Value
```

### Minimal Working Example:

**Sheet 1: Base Salaries 2025**
```
1  | 8000  | 9000  | 10000
2  | 10500 | 12000 | 13500
3  | 13910 | 15649 | 17388
```

**Sheet 2: Career Tracks**
```
base-2025 | المسار الأساسي | Default track | 0 | 0 | 0 | ...
```

**Sheet 3: Regional Adjustments**
```
riyadh | الرياض | 0 |
```

**Sheet 4: Float Level Adjustments**
```
base-2025 | 4.5 | 500 | -500
base-2025 | 5.5 | 700 | -1000
```

**Sheet 5: Job Levels**
```
1 | مساعد | Associate | مساعد | Associate | مبتدئ | Junior
2 | مسؤول | Officer | مسؤول | Officer | (المسمى) | Job Title
```

**Sheet 6: Config**
```
saudi_bonus_percent | 11
manager_adjustment_min | -5
manager_adjustment_max | 5
riyadh_relocation_bonus | 10
version_name | 2025Q1
effective_date | 2025-01-01
```

---

## Step 4: Run Your First Import (1 minute)

### For Script-Based (Phase 1):

```bash
# Add to package.json scripts:
"import-salary": "ts-node scripts/import-salary-data.ts"

# Run import
npm run import-salary ./path/to/salary-structure.xlsx

# Expected output:
# 📂 Reading Excel file: ./path/to/salary-structure.xlsx
# ✅ Validating data...
# ✅ Validation passed!
# ✅ Generated TypeScript file: src/components/salary-calculator/salary-data.ts
# ✅ Saved JSON: src/components/salary-calculator/salary-data.json
# ✅ Import completed successfully!
```

### For Database-Backed (Phase 2):

```bash
# 1. Apply database migrations
psql -h your-db-host -d your-db -f migrations/001_salary_import.sql

# 2. Navigate to admin panel
http://localhost:3000/admin/salary-management

# 3. Upload Excel file via UI
# 4. Preview changes
# 5. Activate version
```

---

## Step 5: Verify Import (2 minutes)

### Check Generated Files:

```bash
# View generated TypeScript file
cat src/components/salary-calculator/salary-data.ts

# View JSON output
cat src/components/salary-calculator/salary-data.json
```

### Test Calculator:

```bash
# Start dev server
npm run dev

# Navigate to calculator
http://localhost:3000/salary-calculator

# Verify:
# - All career tracks appear in dropdown
# - Salary ranges are correct
# - Regional adjustments work
# - Calculations are accurate
```

---

## 🎯 Common Scenarios

### Scenario 1: Update Salary Percentages

**Task**: Increase all tech salaries by 5%

**Steps**:
1. Open Excel file
2. Go to "Career Tracks" sheet
3. Find "tech" row
4. Add 5 to each level percentage
   - L1: 20 → 25
   - L2: 15 → 20
   - etc.
5. Update version name: `2025Q2-Tech-Increase`
6. Save and import

**Time**: 5 minutes

---

### Scenario 2: Add New Location

**Task**: Add Tunisia with -35% adjustment

**Steps**:
1. Open Excel file
2. Go to "Regional Adjustments" sheet
3. Add new row:
   ```
   tunisia | تونس | -35 |
   ```
4. Update version name: `2025Q1-Add-Tunisia`
5. Save and import

**Time**: 2 minutes

---

### Scenario 3: Update Base Salaries for 2026

**Task**: Create 2026 salary structure with 10% increase

**Steps**:
1. Copy current Excel file
2. Rename to `salary-structure-2026.xlsx`
3. Go to "Base Salaries 2025" sheet (rename to "Base Salaries 2026")
4. Multiply all Min/Average/Max by 1.10
5. Update Config sheet:
   - version_name: `2026Q1`
   - effective_date: `2026-01-01`
6. Save and import

**Time**: 10 minutes

---

## 🐛 Troubleshooting

### Error: "Sheet 'Career Tracks' not found"

**Cause**: Sheet name doesn't match exactly

**Fix**:
```bash
# Sheet names are case-sensitive and must match exactly:
- "Base Salaries 2025" (not "base salaries" or "Base Salaries")
- "Career Tracks" (not "career tracks" or "Career Track")
```

---

### Error: "Validation failed: level 3: min must be less than max"

**Cause**: Invalid salary range

**Fix**:
```bash
# Check that min <= average <= max
Level 3: min=15000, avg=14000, max=16000 ❌
Level 3: min=14000, avg=15000, max=16000 ✅
```

---

### Error: "Track key 'tech' not found in Career Tracks"

**Cause**: Float Level Adjustments references non-existent track

**Fix**:
```bash
# Ensure Track Key in Float Level Adjustments matches Career Tracks
Career Tracks: tech, business, base-2025
Float Adjustments: tech, business, base-2025 ✅

Career Tracks: tech, business
Float Adjustments: tech, business, production ❌
```

---

### Warning: "No dynamic formula handler for 'CUSTOM'"

**Cause**: Using unsupported dynamic formula

**Fix**:
```bash
# Currently supported: DYNAMIC, EGYPT
# For custom formulas, implement in code:

// src/utils/salary-calculations.ts
export function applyRegionalAdjustment(
    salary: number,
    location: string,
    level: number
): number {
    if (location === 'custom') {
        // Your custom logic here
        return salary * 0.85
    }
    // ... existing logic
}
```

---

## 📊 Sample Data

### Full Sample Excel Download:

```bash
# Download sample template
curl -O https://your-domain.com/templates/salary-structure-sample.xlsx

# Or copy from project
cp docs/templates/salary-structure-template.xlsx ./my-salary-data.xlsx
```

### Current Production Data Export:

```bash
# Export current active version to Excel
npm run export-salary-data

# Output: salary-data-export-2025-01-01.xlsx
```

---

## 🔄 Update Workflow

### Quarterly Salary Review:

```bash
# 1. Export current data
npm run export-salary-data

# 2. Make changes in Excel
# 3. Validate changes
npm run validate-salary-excel path/to/file.xlsx

# 4. Import (Phase 1)
npm run import-salary path/to/file.xlsx

# 5. Test calculator
npm run dev

# 6. Commit changes
git add src/components/salary-calculator/salary-data.ts
git commit -m "chore: Update salary structure for 2025Q2"
git push

# 7. Deploy
vercel --prod
```

**Time**: 30 minutes

---

## 🎓 Next Steps

### After Basic Setup:

1. **Create validation script** for Excel files before import
2. **Set up automated tests** for salary calculations
3. **Document your specific tracks** and adjustment policies
4. **Train HR team** on Excel template usage
5. **Schedule regular reviews** (quarterly recommended)

### Upgrade to Phase 2:

1. Set up Supabase database
2. Implement upload interface
3. Add version management UI
4. Enable preview/diff functionality
5. Implement audit logging

---

## 📚 Additional Resources

- [Full Design Document](./SALARY_IMPORT_DESIGN.md) - Complete technical specification
- [Excel Template Guide](./EXCEL_TEMPLATE_GUIDE.md) - Detailed Excel format documentation
- [Architecture Documentation](../ARCHITECTURE.md) - System architecture overview
- [API Reference](./API_REFERENCE.md) - Server actions and database queries

---

## ✅ Success Checklist

After completing this guide, you should have:

- [ ] Dependencies installed
- [ ] Import script ready
- [ ] Excel template created
- [ ] First successful import completed
- [ ] Calculator working with new data
- [ ] Changes committed to git
- [ ] Deployment successful
- [ ] HR team trained

---

## 💬 Support

**Questions?** Check:
1. This quick start guide
2. Excel template guide
3. Design document
4. GitHub issues

**Still stuck?** Contact:
- Technical Lead: [email]
- HR Team: [email]
- DevOps: [email]

---

**Estimated Total Time**:
- Phase 1 Setup: 2-4 hours
- First Import: 10-15 minutes
- Regular Updates: 5-10 minutes each

**You're ready to start!** 🚀
