# Simple Salary Import System - Direct File Update

## Overview

A streamlined approach: Upload Excel → Preview Changes → Confirm → Update Code File → Deploy

**No database. No complexity. Just what you need.**

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. HR uploads Excel file via admin page                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Server parses Excel and validates data                  │
│     - Check all required sheets exist                       │
│     - Validate salary ranges (min ≤ avg ≤ max)              │
│     - Check for duplicates                                  │
│     - Validate percentages                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Show interactive preview with diff                      │
│     ┌─────────────────────┬─────────────────────┐          │
│     │   Current Data      │    New Data         │          │
│     ├─────────────────────┼─────────────────────┤          │
│     │ Tech L5: +30%       │ Tech L5: +35% ✏️    │          │
│     │ Egypt: -40%         │ Egypt: -42% ✏️      │          │
│     │ Saudi Bonus: 10%    │ Saudi Bonus: 11% ✏️ │          │
│     └─────────────────────┴─────────────────────┘          │
│                                                             │
│     User can:                                               │
│     ✓ Review changes                                        │
│     ✓ Edit values in preview                                │
│     ✓ Map ambiguous fields                                  │
│     ✓ Add notes for commit message                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User clicks "Apply Changes"                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Server updates salary-data.ts file                      │
│     - Generate new TypeScript code                          │
│     - Write to file system                                  │
│     - Backup old version                                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Optional: Auto-commit to Git                            │
│     git add salary-data.ts                                  │
│     git commit -m "Update salary structure: [user notes]"   │
│     git push                                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Optional: Trigger deployment                            │
│     - Vercel webhook triggers rebuild                       │
│     - Or user manually deploys                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation

### **1. Admin Page: Upload Interface**

**File: `src/app/admin/salary-import/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Upload, Button, Card, Alert } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { uploadAndPreviewSalaryData } from './actions'
import SalaryPreviewDiff from './SalaryPreviewDiff'

export default function SalaryImportPage() {
    const [previewData, setPreviewData] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleUpload = async (file: File) => {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadAndPreviewSalaryData(formData)

        if (result.success) {
            setPreviewData(result.data)
        } else {
            // Show error
            alert(result.error)
        }

        setLoading(false)
        return false // Prevent auto upload
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Card title="Import Salary Structure">
                <Alert
                    message="Upload Excel file to update salary calculator"
                    description="You'll be able to preview and edit changes before applying them."
                    type="info"
                    className="mb-4"
                />

                {!previewData ? (
                    <Upload.Dragger
                        beforeUpload={handleUpload}
                        accept=".xlsx,.xls"
                        maxCount={1}
                        showUploadList={false}
                    >
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag Excel file here
                        </p>
                    </Upload.Dragger>
                ) : (
                    <SalaryPreviewDiff data={previewData} />
                )}
            </Card>
        </div>
    )
}
```

---

### **2. Server Action: Parse & Preview**

**File: `src/app/admin/salary-import/actions.ts`**

```typescript
'use server'

import * as XLSX from 'xlsx'
import { readFile } from 'fs/promises'
import path from 'path'

// Import current data for comparison
import {
    baseSalaries2025,
    newSalaries,
    regionAdjustments,
    levels,
    saudiExtraPercent
} from '@/components/salary-calculator/salary-data'

export async function uploadAndPreviewSalaryData(formData: FormData) {
    try {
        const file = formData.get('file') as File
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer)

        // Parse new data
        const newData = parseExcelWorkbook(workbook)

        // Validate
        const validation = validateSalaryData(newData)
        if (!validation.valid) {
            return { error: validation.errors.join('\n') }
        }

        // Generate diff (compare with current data)
        const diff = generateDiff({
            current: {
                baseSalaries: baseSalaries2025,
                careerTracks: newSalaries,
                regionalAdjustments: regionAdjustments,
                jobLevels: levels,
                saudiBonus: saudiExtraPercent
            },
            new: newData
        })

        return {
            success: true,
            data: {
                newData,
                diff,
                filename: file.name
            }
        }

    } catch (error) {
        return { error: error.message }
    }
}

export async function applyChanges(data: any, commitMessage?: string) {
    'use server'

    try {
        // 1. Generate new TypeScript file content
        const tsContent = generateTypeScriptFile(data)

        // 2. Write to file system
        const filePath = path.join(
            process.cwd(),
            'src/components/salary-calculator/salary-data.ts'
        )

        // Backup current file first
        const backupPath = `${filePath}.backup-${Date.now()}`
        await fs.copyFile(filePath, backupPath)

        // Write new file
        await fs.writeFile(filePath, tsContent, 'utf-8')

        // 3. Optional: Auto-commit to git
        if (process.env.ENABLE_AUTO_COMMIT === 'true') {
            await gitCommitChanges(commitMessage || 'Update salary structure')
        }

        // 4. Optional: Trigger deployment
        if (process.env.VERCEL_DEPLOY_HOOK) {
            await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' })
        }

        return { success: true, backupPath }

    } catch (error) {
        return { error: error.message }
    }
}

function generateDiff(comparison: any) {
    const changes = []

    // Compare base salaries
    comparison.new.baseSalaries.forEach((newSalary: any) => {
        const current = comparison.current.baseSalaries.find(
            (s: any) => s.level === newSalary.level
        )

        if (!current) {
            changes.push({
                type: 'added',
                category: 'baseSalary',
                level: newSalary.level,
                value: newSalary
            })
        } else if (
            current.min !== newSalary.min ||
            current.average !== newSalary.average ||
            current.max !== newSalary.max
        ) {
            changes.push({
                type: 'modified',
                category: 'baseSalary',
                level: newSalary.level,
                old: current,
                new: newSalary
            })
        }
    })

    // Compare career tracks
    comparison.new.careerTracks.forEach((newTrack: any) => {
        const current = comparison.current.careerTracks.find(
            (t: any) => t.departmentKey === newTrack.departmentKey
        )

        if (!current) {
            changes.push({
                type: 'added',
                category: 'careerTrack',
                track: newTrack.departmentKey,
                value: newTrack
            })
        } else {
            // Check each level percentage
            Object.keys(newTrack.levelPercentages).forEach(level => {
                const levelNum = parseFloat(level)
                if (current.levelPercentages[levelNum] !== newTrack.levelPercentages[levelNum]) {
                    changes.push({
                        type: 'modified',
                        category: 'trackPercentage',
                        track: newTrack.departmentKey,
                        level: levelNum,
                        old: current.levelPercentages[levelNum],
                        new: newTrack.levelPercentages[levelNum]
                    })
                }
            })
        }
    })

    // Compare regional adjustments
    comparison.new.regionalAdjustments.forEach((newRegion: any) => {
        const current = comparison.current.regionalAdjustments.find(
            (r: any) => r.value === newRegion.value
        )

        if (!current) {
            changes.push({
                type: 'added',
                category: 'regional',
                location: newRegion.value,
                value: newRegion
            })
        } else if (current.percent !== newRegion.percent) {
            changes.push({
                type: 'modified',
                category: 'regional',
                location: newRegion.value,
                old: current.percent,
                new: newRegion.percent
            })
        }
    })

    return changes
}

function generateTypeScriptFile(data: any): string {
    // Same as before - generate the TypeScript file content
    return `// Auto-generated from Excel import
// Generated at: ${new Date().toISOString()}
// Version: ${data.version}

export interface FloatLevelAdjustments {
    4.5: { min: number; max: number }
    5.5: { min: number; max: number }
    6.5: { min: number; max: number }
    7.5: { min: number; max: number }
}

export interface DepartmentData {
    departmentKey: string
    title: string
    description: string
    levelPercentages: {
        [key: number]: number
    }
    floatLevelAdjustments: FloatLevelAdjustments
}

export const baseSalaries2025 = ${JSON.stringify(data.baseSalaries, null, 4)}

export const saudiExtraPercent = ${data.config.saudiExtraPercent}

export const levels = ${JSON.stringify(data.jobLevels, null, 4)}

export const newSalaries: DepartmentData[] = ${JSON.stringify(data.careerTracks, null, 4)}

export const regionAdjustments = ${JSON.stringify(data.regionalAdjustments, null, 4)}
`
}

async function gitCommitChanges(message: string) {
    const { exec } = require('child_process')
    const util = require('util')
    const execPromise = util.promisify(exec)

    try {
        await execPromise('git add src/components/salary-calculator/salary-data.ts')
        await execPromise(`git commit -m "${message}"`)
        await execPromise('git push')
    } catch (error) {
        console.error('Git commit failed:', error)
        // Don't throw - file update succeeded
    }
}
```

---

### **3. Preview Component: Side-by-Side Diff**

**File: `src/app/admin/salary-import/SalaryPreviewDiff.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Table, Button, Tag, Space, Input, Modal, Tabs } from 'antd'
import { CheckCircleOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons'
import { applyChanges } from './actions'

interface DiffChange {
    type: 'added' | 'modified' | 'removed'
    category: string
    [key: string]: any
}

export default function SalaryPreviewDiff({ data }: { data: any }) {
    const [editedData, setEditedData] = useState(data.newData)
    const [commitMessage, setCommitMessage] = useState('')
    const [applying, setApplying] = useState(false)

    const handleApply = async () => {
        Modal.confirm({
            title: 'Apply Changes?',
            content: `This will update the salary-data.ts file and ${
                process.env.ENABLE_AUTO_COMMIT ? 'commit to git' : 'require manual commit'
            }.`,
            onOk: async () => {
                setApplying(true)
                const result = await applyChanges(editedData, commitMessage)

                if (result.success) {
                    Modal.success({
                        title: 'Changes Applied!',
                        content: `Salary data updated successfully. ${
                            process.env.VERCEL_DEPLOY_HOOK
                                ? 'Deployment triggered.'
                                : 'Please deploy manually.'
                        }`
                    })
                } else {
                    Modal.error({
                        title: 'Failed to Apply',
                        content: result.error
                    })
                }
                setApplying(false)
            }
        })
    }

    const renderChangeType = (type: string) => {
        switch (type) {
            case 'added':
                return <Tag color="green">Added</Tag>
            case 'modified':
                return <Tag color="blue">Modified</Tag>
            case 'removed':
                return <Tag color="red">Removed</Tag>
            default:
                return <Tag>{type}</Tag>
        }
    }

    const baseSalaryColumns = [
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level'
        },
        {
            title: 'Change',
            dataIndex: 'type',
            key: 'type',
            render: renderChangeType
        },
        {
            title: 'Current Min',
            dataIndex: ['old', 'min'],
            key: 'currentMin',
            render: (val: number) => val?.toLocaleString() || '-'
        },
        {
            title: 'New Min',
            dataIndex: ['new', 'min'],
            key: 'newMin',
            render: (val: number) => val?.toLocaleString() || '-'
        },
        {
            title: 'Current Max',
            dataIndex: ['old', 'max'],
            key: 'currentMax',
            render: (val: number) => val?.toLocaleString() || '-'
        },
        {
            title: 'New Max',
            dataIndex: ['new', 'max'],
            key: 'newMax',
            render: (val: number) => val?.toLocaleString() || '-'
        },
        {
            title: 'Change %',
            key: 'change',
            render: (record: any) => {
                if (record.type === 'added') return 'New'
                if (!record.old || !record.new) return '-'

                const change = ((record.new.min - record.old.min) / record.old.min) * 100
                const color = change > 0 ? 'green' : change < 0 ? 'red' : 'default'
                return <Tag color={color}>{change.toFixed(1)}%</Tag>
            }
        }
    ]

    const trackColumns = [
        {
            title: 'Track',
            dataIndex: 'track',
            key: 'track'
        },
        {
            title: 'Level',
            dataIndex: 'level',
            key: 'level'
        },
        {
            title: 'Change',
            dataIndex: 'type',
            key: 'type',
            render: renderChangeType
        },
        {
            title: 'Current %',
            dataIndex: 'old',
            key: 'old',
            render: (val: number) => val !== undefined ? `${val}%` : '-'
        },
        {
            title: 'New %',
            dataIndex: 'new',
            key: 'new',
            render: (val: number) => val !== undefined ? `${val}%` : '-'
        },
        {
            title: 'Difference',
            key: 'diff',
            render: (record: any) => {
                if (record.type === 'added') return 'New'
                if (record.old === undefined || record.new === undefined) return '-'

                const diff = record.new - record.old
                const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'default'
                return <Tag color={color}>{diff > 0 ? '+' : ''}{diff}%</Tag>
            }
        }
    ]

    const baseSalaryChanges = data.diff.filter((c: DiffChange) => c.category === 'baseSalary')
    const trackChanges = data.diff.filter((c: DiffChange) => c.category === 'trackPercentage')
    const regionalChanges = data.diff.filter((c: DiffChange) => c.category === 'regional')

    return (
        <div>
            <div className="mb-4">
                <h3>Preview Changes from: {data.filename}</h3>
                <p>
                    <WarningOutlined className="text-yellow-500" />
                    {' '}Found {data.diff.length} changes. Review carefully before applying.
                </p>
            </div>

            <Tabs
                items={[
                    {
                        key: 'base',
                        label: `Base Salaries (${baseSalaryChanges.length})`,
                        children: (
                            <Table
                                columns={baseSalaryColumns}
                                dataSource={baseSalaryChanges}
                                pagination={false}
                                size="small"
                            />
                        )
                    },
                    {
                        key: 'tracks',
                        label: `Career Tracks (${trackChanges.length})`,
                        children: (
                            <Table
                                columns={trackColumns}
                                dataSource={trackChanges}
                                pagination={false}
                                size="small"
                            />
                        )
                    },
                    {
                        key: 'regional',
                        label: `Regional (${regionalChanges.length})`,
                        children: (
                            <Table
                                dataSource={regionalChanges}
                                pagination={false}
                                size="small"
                            />
                        )
                    }
                ]}
            />

            <div className="mt-6 space-y-4">
                <Input.TextArea
                    placeholder="Commit message (optional): e.g., 'Q2 2025 salary adjustments'"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    rows={2}
                />

                <Space>
                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handleApply}
                        loading={applying}
                    >
                        Apply Changes
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        Cancel
                    </Button>
                </Space>
            </div>
        </div>
    )
}
```

---

## 🎯 **Key Features**

### **1. Visual Diff**
```
Base Salary Level 5:
┌─────────────┬──────────┬──────────┐
│             │ Current  │ New      │
├─────────────┼──────────┼──────────┤
│ Min         │ 24,640   │ 26,000 ✏️│ +5.5%
│ Average     │ 26,320   │ 28,000 ✏️│ +6.4%
│ Max         │ 28,000   │ 30,000 ✏️│ +7.1%
└─────────────┴──────────┴──────────┘

Tech Track:
┌─────────┬──────────┬──────────┐
│ Level   │ Current  │ New      │
├─────────┼──────────┼──────────┤
│ L1      │ +20%     │ +25% ✏️  │ +5pp
│ L5      │ +30%     │ +35% ✏️  │ +5pp
└─────────┴──────────┴──────────┘
```

### **2. Inline Editing**
- Edit values in preview before applying
- Fix any mapping issues
- Adjust values manually

### **3. Safe Application**
- Backup created automatically
- Can rollback via git
- No data loss

### **4. Optional Automation**
- Auto-commit to git (configurable)
- Auto-trigger Vercel deployment (configurable)
- Or manual control

---

## ⚙️ **Configuration**

**Environment Variables:**

```bash
# .env.local

# Optional: Auto-commit changes to git
ENABLE_AUTO_COMMIT=true

# Optional: Auto-deploy to Vercel
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...

# Optional: Require admin password
SALARY_ADMIN_PASSWORD=your-secure-password
```

---

## 🔐 **Security**

**Protect the admin route:**

```typescript
// src/app/admin/salary-import/layout.tsx
export default function AdminLayout({ children }) {
    const { user } = useAuth()

    // Only allow @thmanyah.com emails with admin role
    if (!user?.email?.endsWith('@thmanyah.com')) {
        return <div>Access Denied</div>
    }

    // Optional: Check for admin role
    if (!user.customClaims?.isAdmin) {
        return <div>Admin access required</div>
    }

    return children
}
```

---

## 📊 **Comparison: Database vs Direct File**

| Feature | With Supabase | Direct File Update |
|---------|---------------|-------------------|
| **Complexity** | High | Low |
| **Setup Time** | 1-2 days | 2-4 hours |
| **Dependencies** | Supabase, migrations | None |
| **Version Control** | Database + Git | Git only |
| **Runtime Switching** | Yes | No (requires rebuild) |
| **Calculator Speed** | Slower (DB query) | Faster (compile-time) |
| **Cost** | $0-25/mo | Free |
| **Rollback** | Complex | Simple (git revert) |
| **Audit Trail** | Database | Git history |
| **Multi-Version Support** | Yes | Via branches |
| **Preview Changes** | Yes | Yes |
| **Best For** | Runtime version switching | Simple, fast, maintainable |

---

## ✅ **Why This Approach is Better**

1. **Simpler**: No database, no migrations, no complex queries
2. **Faster**: Compile-time data = instant calculations
3. **Cheaper**: No Supabase subscription
4. **Safer**: Git provides full history and rollback
5. **Familiar**: Developers already know git
6. **Type-Safe**: TypeScript checks at build time
7. **Transparent**: Changes are visible in git diff
8. **Reliable**: Fewer points of failure

---

## 🚀 **Migration from Current Setup**

**Zero changes needed!** Your current calculator works as-is. Just add the admin interface on top.

---

## 📝 **Summary**

**You were right to question Supabase.** For this use case:

- ✅ Excel upload with web UI
- ✅ Preview/diff before applying
- ✅ Direct file update
- ✅ Git for version control
- ✅ Optional auto-commit/deploy
- ❌ No database needed

**This gives you 90% of the benefits with 10% of the complexity.**

---

Want me to implement this simpler version? It's much more straightforward! 🎯
