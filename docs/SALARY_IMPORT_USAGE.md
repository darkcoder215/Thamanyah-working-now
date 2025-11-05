# Salary Import - Usage Guide

## 🚀 Quick Start

### Access the Admin Panel

1. Navigate to: `https://your-domain.com/admin/salary-import`
2. You must be logged in with a `@thmanyah.com` email address
3. The page is automatically protected - only authorized users can access it

---

## 📊 Excel File Format

Your Excel file must contain these **6 sheets** (exact names):

### 1. Base Salaries 2025

| Column  | Type   | Example |
|---------|--------|---------|
| Level   | Number | 1, 2, 3, 4.5, 5 |
| Min     | Number | 8000 |
| Average | Number | 9000 |
| Max     | Number | 10000 |

### 2. Career Tracks

| Column       | Type | Example |
|--------------|------|---------|
| Track Key    | Text | tech, business, base-2025 |
| Track Name   | Text | مسار التقنية |
| Description  | Text | التصميم الرقمي، إدارة المنتج... |
| L1%          | Number | 20 |
| L2%          | Number | 15 |
| L3%          | Number | 20 |
| ... (up to L8%) | Number | ... |

### 3. Regional Adjustments

| Column          | Type   | Example |
|-----------------|--------|---------|
| Location        | Text   | riyadh, egypt, jordan |
| Arabic Label    | Text   | الرياض، مصر |
| Adjustment %    | Number | 0, -40, -28 |
| Dynamic Formula | Text   | (optional) DYNAMIC for Egypt |

### 4. Float Level Adjustments

| Column         | Type   | Example |
|----------------|--------|---------|
| Track Key      | Text   | tech, business |
| Level          | Number | 4.5, 5.5, 6.5, 7.5 |
| Min Adjustment | Number | 500 |
| Max Adjustment | Number | -500 |

### 5. Job Levels

| Column            | Type   | Example |
|-------------------|--------|---------|
| Level             | Number | 1, 2, 3 |
| Title AR          | Text   | مساعد، مسؤول |
| Title EN          | Text   | Associate, Officer |
| Managerial AR     | Text   | قائد، مدير |
| Managerial EN     | Text   | Lead, Manager |
| Tech AR           | Text   | مبتدئ، أول |
| Tech EN           | Text   | Junior, Senior |

### 6. Config

| Key                       | Value     |
|---------------------------|-----------|
| saudi_bonus_percent       | 11        |
| manager_adjustment_min    | -5        |
| manager_adjustment_max    | 5         |
| riyadh_relocation_bonus   | 10        |
| version_name              | 2025Q2    |
| effective_date            | 2025-04-01|

---

## 🔄 Upload Process

### Step 1: Prepare Excel File

1. Download the template or export current data
2. Make your changes in Excel
3. Save as `.xlsx` file

### Step 2: Upload & Validate

1. Go to `/admin/salary-import`
2. Drag and drop your Excel file or click to browse
3. System automatically validates:
   - All required sheets present
   - Salary ranges valid (min ≤ avg ≤ max)
   - No duplicate keys
   - Percentages in valid range
   - All required fields filled

### Step 3: Review Preview

If validation passes, you'll see:

**Summary Card:**
- Total number of changes
- Changes by category (Base Salaries, Tracks, Regional, etc.)
- Affected levels
- Impact statistics

**Detailed Tabs:**
- **Base Salaries**: Side-by-side comparison with percentage changes
- **Career Tracks**: Track and level-specific percentage updates
- **Regional**: Location adjustment changes
- **Job Levels**: Title modifications
- **Config**: Configuration updates

### Step 4: Add Commit Message

Optional but recommended:
```
Q2 2025 salary adjustments:
- Tech track Level 5: +5%
- Egypt regional: -42%
- Updated job titles for Level 3
```

### Step 5: Apply Changes

Click **"Apply Changes"** → Confirm

System will:
1. ✅ Create automatic backup (`salary-data.ts.backup-[timestamp]`)
2. ✅ Update `src/components/salary-calculator/salary-data.ts`
3. ✅ Commit to git (if `ENABLE_AUTO_COMMIT=true`)
4. ✅ Push to remote (if `ENABLE_AUTO_PUSH=true`)
5. ✅ Trigger deployment (if `VERCEL_DEPLOY_HOOK` is set)

---

## ⚙️ Configuration

### Optional Environment Variables

Add to your `.env.local`:

```bash
# Auto-commit changes to git
ENABLE_AUTO_COMMIT=true

# Auto-push to remote repository
ENABLE_AUTO_PUSH=true

# Trigger Vercel deployment automatically
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
```

**Recommended Settings:**

- **Development**: All `false` (manual control)
- **Staging**: `ENABLE_AUTO_COMMIT=true`, others `false`
- **Production**: All `true` (full automation)

---

## 🐛 Troubleshooting

### Error: "Missing required sheets"

**Problem**: Sheet names don't match exactly

**Solution**: Sheet names are case-sensitive:
- ✅ "Base Salaries 2025"
- ❌ "base salaries 2025"
- ❌ "Base Salaries"

### Error: "Salary range invalid"

**Problem**: Min, average, or max values are out of order

**Solution**: Ensure `min <= average <= max` for all levels

Example:
- ❌ min=15000, avg=14000, max=16000
- ✅ min=14000, avg=15000, max=16000

### Error: "Duplicate track key"

**Problem**: Same track key used multiple times

**Solution**: Each track must have a unique key:
- ✅ tech, business, base-2025
- ❌ tech, tech, business

### Error: "Percentage must be between -100 and 200"

**Problem**: Invalid percentage value

**Solution**: Check career track percentages:
- Typical range: 0-50%
- Maximum allowed: -100% to 200%

### Warning: "Unusually high percentage"

**Problem**: Percentage over 100%

**Solution**: Double-check the value - system allows it but warns you

---

## 🔄 Rollback Changes

If you need to undo changes:

### Method 1: Restore from Backup

```bash
# List backups
ls src/components/salary-calculator/*.backup-*

# Restore a backup
cp src/components/salary-calculator/salary-data.ts.backup-1234567890 \
   src/components/salary-calculator/salary-data.ts

# Commit
git add src/components/salary-calculator/salary-data.ts
git commit -m "Rollback to backup"
git push
```

### Method 2: Git Revert

```bash
# View recent commits
git log --oneline

# Revert a specific commit
git revert <commit-hash>

# Push
git push
```

**Time to rollback**: ~2 minutes

---

## 📝 Best Practices

### Before Uploading

1. ✅ Review all changes in Excel carefully
2. ✅ Check that version name is unique
3. ✅ Set effective date appropriately
4. ✅ Validate formulas and calculations
5. ✅ Have a backup of current data

### During Preview

1. ✅ Review every tab (Base Salaries, Tracks, Regional, etc.)
2. ✅ Check percentage changes make sense
3. ✅ Verify affected levels are correct
4. ✅ Look for unexpected changes
5. ✅ Read all warnings carefully

### After Applying

1. ✅ Test salary calculator immediately
2. ✅ Verify a few sample calculations
3. ✅ Check all tracks are working
4. ✅ Notify relevant team members
5. ✅ Document changes for future reference

### Commit Messages

Good examples:
```
✅ Q2 2025 salary adjustments: Tech +5%, Egypt -2%
✅ Update base salaries for 2025 market rates
✅ Add new regional adjustment for Tunisia
✅ Fix Level 5 tech track percentage
```

Bad examples:
```
❌ Update
❌ Changes
❌ Fix
❌ ...
```

---

## 📊 Common Scenarios

### Scenario 1: Update Career Track Percentages

**Task**: Increase tech salaries by 5%

**Steps**:
1. Open Excel → Career Tracks sheet
2. Find "tech" row
3. Add 5 to each level: L1: 20→25, L2: 15→20, etc.
4. Update version name: `2025Q2-Tech-Increase`
5. Upload and apply

**Time**: 5 minutes

---

### Scenario 2: Add New Region

**Task**: Add Tunisia with -35% adjustment

**Steps**:
1. Open Excel → Regional Adjustments sheet
2. Add new row:
   - Location: `tunisia`
   - Arabic Label: `تونس`
   - Adjustment %: `-35`
3. Update version name: `2025Q2-Add-Tunisia`
4. Upload and apply

**Time**: 2 minutes

---

### Scenario 3: Update Base Salaries

**Task**: Apply 10% increase to all levels

**Steps**:
1. Open Excel → Base Salaries 2025 sheet
2. Multiply all Min/Average/Max by 1.10
3. Update version name: `2025Q2-Market-Adjustment`
4. Update effective date: `2025-04-01`
5. Upload and apply

**Time**: 10 minutes

---

## 🔐 Security

### Access Control

- ✅ Only `@thmanyah.com` emails can access
- ✅ Requires Firebase authentication
- ✅ Protected route with layout
- ✅ Automatic backups created

### Data Safety

- ✅ Validation before applying
- ✅ Automatic backups with timestamps
- ✅ Git history for full audit trail
- ✅ Preview before committing
- ✅ Rollback capability

### Recommendations

1. Limit admin access to HR team only
2. Always preview changes before applying
3. Use meaningful commit messages
4. Keep backups for at least 6 months
5. Document major changes

---

## 📚 Related Documentation

- [Excel Template Guide](./EXCEL_TEMPLATE_GUIDE.md) - Detailed format specifications
- [Quick Start Guide](./QUICK_START_GUIDE.md) - Implementation guide
- [Salary Import Design](../SALARY_IMPORT_SIMPLE.md) - Technical architecture

---

## 💬 Support

**Need Help?**

1. Check validation error messages
2. Review Excel template guide
3. Test with sample data
4. Contact development team

**Common Questions:**

**Q: Can I add extra columns?**
A: Yes, but they will be ignored. Only specified columns are imported.

**Q: How do I export current data?**
A: Currently manual - copy from `salary-data.ts` to Excel. Export feature coming soon.

**Q: Can multiple people upload at once?**
A: No - last upload wins. Coordinate with team before uploading.

**Q: What if I upload wrong file?**
A: Just refresh the page and upload correct file. Nothing is changed until you click "Apply Changes".

---

**Last Updated**: 2025-01-05
