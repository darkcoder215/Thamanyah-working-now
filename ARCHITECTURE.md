# Thamanyah Web Tools - Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Directory Structure](#directory-structure)
5. [Core Components](#core-components)
6. [Key Features](#key-features)
7. [Data Flow](#data-flow)
8. [External Integrations](#external-integrations)
9. [Authentication Flow](#authentication-flow)
10. [Environment Configuration](#environment-configuration)
11. [Development Workflow](#development-workflow)
12. [Deployment Guide](#deployment-guide)

---

## Project Overview

**Thamanyah Web Tools** is an internal HR management web application built for Thamanyah company. It provides a comprehensive suite of tools for managing employment documentation, salary calculations, and recruitment workflows.

### Primary Purpose
- Generate employment offers (permanent, temporary, and freelance contracts)
- Calculate salary grids with detailed allowance breakdowns
- Manage job advertisements and advertiser information
- Integrate recruitment data from multiple sources (Google Sheets, Recruitee API)
- Provide authenticated access restricted to @thmanyah.com email domain

### Project Type
Full-stack, server-side rendered web application with Next.js App Router

### Current Version
0.1.0 (Private)

---

## Technology Stack

### Frontend Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.4.6 | React framework with App Router for SSR/SSG |
| **React** | 19.1.1 | UI library (with React 19 compatibility patch) |
| **TypeScript** | 5.9.2 | Type-safe JavaScript |

### UI & Styling
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Ant Design (antd)** | 5.26.7 | Component library |
| **@ant-design/icons** | 6.0.0 | Icon library |
| **Tailwind CSS** | 4.1.11 | Utility-first CSS framework |
| **PostCSS** | 8.5.6 | CSS transformation |
| **clsx** | 2.1.1 | Conditional className utility |

### Authentication & Authorization
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Firebase** | 12.1.0 | Authentication service |
| **google-auth-library** | 9.15.1 | Google OAuth integration |

### Database & APIs
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Supabase** | 2.54.0 | PostgreSQL database client |
| **@supabase/ssr** | 0.6.1 | Server-side rendering support |
| **googleapis** | 148.0.0 | Google Sheets & Calendar APIs |

### Development Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **pnpm** | 10.12.4 | Package manager |
| **ESLint** | 9.33.0 | Code linting |
| **Prettier** | 3.6.2 | Code formatting |
| **Husky** | 9.1.7 | Git hooks |
| **lint-staged** | 15.5.2 | Pre-commit checks |
| **Turbopack** | (built-in) | Fast build tool (dev mode) |

### Fonts
- **IBM Plex Sans Arabic** - Google Fonts (Arabic support)
- **Thamanyah Custom Fonts** - WOFF2 format (Display, Serif, Sans variants)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Next.js 15 Application (React 19)                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  UI Layer (Ant Design + Tailwind CSS)              │  │  │
│  │  │  - Job Offer Forms                                 │  │  │
│  │  │  - Freelancer Offer Forms                          │  │  │
│  │  │  - Salary Calculator                               │  │  │
│  │  │  - Advertiser Management                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  State Management                                   │  │  │
│  │  │  - AuthContext (React Context)                      │  │  │
│  │  │  - Component State (React Hooks)                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Server (SSR/API)                     │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Server Actions   │  │  API Routes      │                    │
│  │ - Revalidation   │  │  (Future)        │                    │
│  │ - Data Fetching  │  └──────────────────┘                    │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firebase   │ │   Supabase   │ │Google Sheets │ │  Recruitee   │
│     Auth     │ │  PostgreSQL  │ │     API      │ │     API      │
│──────────────│ │──────────────│ │──────────────│ │──────────────│
│ - Google     │ │ - Posts      │ │ - Job Data   │ │ - Candidates │
│   OAuth      │ │ - Advertisers│ │ - Read-only  │ │ - Offers     │
│ - Domain     │ │              │ │              │ │ - Pipelines  │
│   Restrict   │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Architecture Layers

#### 1. Presentation Layer (Client-Side)
- **Location**: `src/app/` and `src/components/`
- **Responsibilities**:
  - Rendering UI components with Ant Design
  - Handling user interactions
  - Form validation and submission
  - Client-side routing (Next.js App Router)
  - Dark/Light mode toggle
  - Print-optimized views

#### 2. Business Logic Layer
- **Location**: `src/lib/`, `src/utils/`, `src/app/actions/`
- **Responsibilities**:
  - Authentication logic (Firebase)
  - Data transformation and validation
  - Server actions for data revalidation
  - Google Sheets API integration
  - Helper utilities (greeting emoji, formatters)

#### 3. Data Access Layer
- **Location**: `src/components/*/lib/queries.ts`
- **Responsibilities**:
  - Supabase database queries
  - Firebase authentication state management
  - External API calls (Google Sheets, Recruitee)
  - Data caching and revalidation

#### 4. External Services Layer
- Firebase Authentication
- Supabase PostgreSQL
- Google Sheets API
- Recruitee Recruitment Platform API

---

## Directory Structure

```
/home/user/Thamanyah-working-now/
│
├── src/                                    # Source code
│   ├── app/                                # Next.js App Router
│   │   ├── (HR)/                           # Route group for HR features
│   │   │   ├── job-offer/                  # Job offer page
│   │   │   │   └── page.tsx               # File: src/app/(HR)/job-offer/page.tsx
│   │   │   └── freelancer-offer/           # Freelancer offer page
│   │   │       └── page.tsx               # File: src/app/(HR)/freelancer-offer/page.tsx
│   │   ├── dashboard/                      # Dashboard page
│   │   │   └── page.tsx                   # File: src/app/dashboard/page.tsx
│   │   ├── offer/                          # Offer type selection page
│   │   │   └── page.tsx                   # File: src/app/offer/page.tsx
│   │   ├── temp-offer/                     # Temporary offer page
│   │   │   └── page.tsx                   # File: src/app/temp-offer/page.tsx
│   │   ├── salary-calculator/              # Salary calculator page
│   │   │   └── page.tsx                   # File: src/app/salary-calculator/page.tsx
│   │   ├── manage-advertisers/             # Advertiser management page
│   │   │   └── page.tsx                   # File: src/app/manage-advertisers/page.tsx
│   │   ├── actions/                        # Server actions
│   │   │   └── spreadsheet.ts             # Google Sheets integration
│   │   ├── actions.ts                      # Revalidation actions
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Home page (greeting)
│   │   └── globals.css                     # Global styles
│   │
│   ├── components/                         # React components
│   │   ├── Form/                           # Form components
│   │   │   ├── EmploymentStatus.tsx        # Employment status input
│   │   │   ├── FormSection.tsx             # Form section wrapper
│   │   │   └── InformationForm.tsx         # Employee information form
│   │   ├── JobOffer/                       # Job offer feature
│   │   │   ├── JobOfferForm.tsx            # Main job offer form
│   │   │   ├── OfferPreview.tsx            # PDF preview component
│   │   │   └── lib/                        # Job offer utilities
│   │   ├── FreelancerOffer/                # Freelancer offer feature
│   │   │   ├── FreelancerOfferForm.tsx     # Freelancer form
│   │   │   └── lib/                        # Freelancer utilities
│   │   ├── TempOffer/                      # Temporary offer feature
│   │   │   ├── TempOfferForm.tsx           # Temp assignment form
│   │   │   └── lib/                        # Temp offer utilities
│   │   ├── manage-advertisers/             # Advertiser management
│   │   │   ├── AddAdvertiserModal.tsx      # Add advertiser modal
│   │   │   ├── CreatePostModal.tsx         # Create job post modal
│   │   │   └── lib/                        # Database queries
│   │   ├── salary-calculator/              # Salary calculator
│   │   │   ├── CalculatorForm.tsx          # Calculator input form
│   │   │   └── lib/                        # Calculation logic
│   │   ├── Shared/                         # Shared UI components
│   │   │   ├── ActionButton.tsx            # Reusable button
│   │   │   ├── ExportButton.tsx            # Export functionality
│   │   │   └── FormSkeleton.tsx            # Loading skeleton
│   │   ├── Login.tsx                       # Login component
│   │   └── ProtectedComponent.tsx          # Protected route wrapper
│   │
│   ├── layout/                             # Layout components
│   │   ├── AntdLayout.tsx                  # Ant Design ConfigProvider
│   │   └── DefaultLayout.tsx               # Auth + Dark mode layout
│   │
│   ├── lib/                                # Core libraries
│   │   ├── context/                        # React Context
│   │   │   └── AuthContext.tsx             # Authentication context
│   │   └── firebase/                       # Firebase configuration
│   │       ├── firebaseConfig.ts           # Firebase initialization
│   │       └── auth.ts                     # Auth functions
│   │
│   └── utils/                              # Utility functions
│       └── helpers.ts                      # Helper functions (greeting, etc.)
│
├── public/                                 # Static assets
│   ├── fonts/                              # Custom Thmanyah fonts
│   │   ├── display/                        # Display font variants
│   │   ├── sans/                           # Sans-serif variants
│   │   └── serif-text/                     # Serif text variants
│   └── icons/                              # SVG/PNG icons
│
├── scripts/                                # Utility scripts
│   └── get-all-recruitee-data.js          # Recruitee API data export
│
├── .husky/                                 # Git hooks configuration
│   └── pre-commit                          # Pre-commit linting
│
├── Configuration Files:
│   ├── package.json                        # Dependencies & scripts
│   ├── tsconfig.json                       # TypeScript config
│   ├── next.config.ts                      # Next.js config
│   ├── postcss.config.mjs                  # PostCSS config
│   ├── eslint.config.mjs                   # ESLint rules
│   ├── .prettierrc                         # Prettier rules
│   ├── .editorconfig                       # Editor settings
│   ├── .env.example                        # Environment template
│   └── pnpm-lock.yaml                      # Dependency lock file
│
└── README.md                               # Project documentation
```

---

## Core Components

### 1. Authentication System

#### **AuthContext** (`src/lib/context/AuthContext.tsx`)
- **Purpose**: Global authentication state management
- **Features**:
  - User state (Firebase User object)
  - Loading state
  - Error handling
  - Sign-in/Sign-out methods
- **Exports**:
  - `useAuth()` hook
  - `AuthProvider` component

#### **DefaultLayout** (`src/layout/DefaultLayout.tsx`)
- **Purpose**: Protected layout wrapper with authentication
- **Features**:
  - Authentication check before rendering
  - Redirects to login if not authenticated
  - User greeting with emoji
  - Dark/Light mode toggle button
  - Logout button with confirmation
  - Hide elements during print
- **Bypass**: Set `NEXT_PUBLIC_PASS_LOGIN=true` for development

#### **Login Component** (`src/components/Login.tsx`)
- **Purpose**: Google OAuth login interface
- **Features**:
  - Google Sign-In button
  - Domain validation (@thmanyah.com)
  - Error display
  - Automatic logout on domain mismatch

#### **Firebase Auth** (`src/lib/firebase/auth.ts`)
- **Purpose**: Authentication business logic
- **Functions**:
  - `signInWithGoogle()` - Google OAuth flow
  - `signOutUser()` - User logout
  - `subscribeToAuthChanges()` - Auth state listener
- **Domain Restriction**: Validates email ends with `@thmanyah.com`

### 2. Layout Components

#### **AntdLayout** (`src/layout/AntdLayout.tsx`)
- **Purpose**: Ant Design configuration provider
- **Features**:
  - Dark/Light theme support
  - RTL (Right-to-Left) configuration for Arabic
  - Arabic locale (ar_EG)
  - Theme customization (primary colors, fonts)
  - Dark mode state management with localStorage

### 3. Feature Components

#### **Job Offer Module** (`src/components/JobOffer/`)
- **JobOfferForm.tsx**: Multi-step form for job offers
  - Employee information
  - Position details (Managerial/Technical/General)
  - Salary and benefits
  - Start date and location
  - A4 print-optimized preview
- **OfferPreview.tsx**: PDF-ready preview with company branding

#### **Freelancer Offer Module** (`src/components/FreelancerOffer/`)
- **FreelancerOfferForm.tsx**: Freelancer contract form
  - Contractor information
  - Project scope
  - Payment terms
  - Duration and deliverables

#### **Temporary Offer Module** (`src/components/TempOffer/`)
- **TempOfferForm.tsx**: Temporary assignment form
  - Temporary employee details
  - Assignment duration
  - Compensation structure

#### **Salary Calculator Module** (`src/components/salary-calculator/`)
- **CalculatorForm.tsx**: Interactive salary calculator
  - Base salary input
  - Allowances breakdown (housing, transportation, etc.)
  - Total compensation calculation
  - Export to Excel/PDF

#### **Advertiser Management Module** (`src/components/manage-advertisers/`)
- **Purpose**: Manage job advertisers and posts
- **Components**:
  - **AddAdvertiserModal.tsx**: Add new advertiser
  - **CreatePostModal.tsx**: Create job posts
- **Database Queries** (`lib/queries.ts`):
  - `getPosts()`: Fetch all posts with advertiser data
  - `getAdvertisers()`: Fetch all advertisers

### 4. Shared Components (`src/components/Shared/`)

- **ActionButton.tsx**: Reusable action button with icons
- **ExportButton.tsx**: Export functionality (PDF/Excel)
- **FormSkeleton.tsx**: Loading state skeleton

---

## Key Features

### 1. Employment Offer Generation
Generate three types of employment documents:

#### A. Job Offers (Permanent Employment)
- **Route**: `/job-offer`
- **Types**: Managerial, Technical, General
- **Includes**:
  - Employee personal information
  - Position title and department
  - Salary structure with allowances
  - Benefits and perks
  - Start date and probation period
  - Print-optimized A4 format

#### B. Freelancer Offers (Contract Work)
- **Route**: `/freelancer-offer`
- **Includes**:
  - Contractor information
  - Scope of work
  - Payment terms and milestones
  - Contract duration
  - Deliverables and KPIs

#### C. Temporary Assignments
- **Route**: `/temp-offer`
- **Includes**:
  - Temporary employee details
  - Assignment period
  - Hourly/daily rate
  - Project description

### 2. Salary Calculator
- **Route**: `/salary-calculator`
- **Features**:
  - Interactive salary grid calculation
  - Allowances breakdown:
    - Housing allowance
    - Transportation allowance
    - Food allowance
    - Mobile/communication allowance
  - Total compensation calculation
  - Comparison with market standards
  - Export results to Excel/PDF

### 3. Advertiser Management
- **Route**: `/manage-advertisers`
- **Features**:
  - View all advertisers (companies)
  - Add new advertisers
  - Create job posts linked to advertisers
  - Edit/Delete advertisers
  - View posts by advertiser
- **Database**: Supabase PostgreSQL
  - `advertisers` table
  - `posts` table (foreign key to advertisers)

### 4. Dashboard & User Profile
- **Route**: `/dashboard`
- **Features**:
  - User information display
  - Quick links to all tools
  - Recent activity (future)
  - User statistics (future)

### 5. Authentication & Security
- **Google OAuth**: Single Sign-On with Google
- **Domain Restriction**: Only @thmanyah.com emails allowed
- **Protected Routes**: All pages require authentication
- **Session Management**: Firebase Auth tokens
- **Dev Bypass**: Optional authentication skip for development

### 6. Localization & Internationalization
- **Language**: Arabic (primary)
- **Direction**: RTL (Right-to-Left)
- **Locale**: ar_EG (Egyptian Arabic)
- **Fonts**:
  - IBM Plex Sans Arabic (Google Fonts)
  - Custom Thamanyah fonts (Display, Serif, Sans)
- **Time-based Greetings**: Emoji changes based on time of day

### 7. Dark/Light Mode
- **Toggle**: Persistent dark/light theme
- **Storage**: localStorage (`theme` key)
- **Scope**: Global (affects all pages)
- **Icon**: Light bulb icon (filled/outlined)

### 8. Print Optimization
- **Format**: A4 page size
- **CSS**: Print-specific styles
- **Hide Elements**: Navigation, buttons hidden during print
- **Fonts**: Print-optimized font sizes

---

## Data Flow

### Authentication Flow
```
User → Login Page → Google OAuth
                        ↓
                  Firebase Auth
                        ↓
              Domain Check (@thmanyah.com)
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
       ✓ Allowed               ✗ Denied
            ↓                       ↓
    AuthContext Update      Auto Logout + Error
            ↓
    Redirect to Dashboard
```

### Data Fetching Flow (Advertiser Management)
```
Page Load → Server Component
                ↓
         Supabase Query (getPosts)
                ↓
    JOIN advertisers ON advertiser_id
                ↓
         Return Data to Client
                ↓
    Render Table with Ant Design
                ↓
    User Action (Add/Edit/Delete)
                ↓
    Server Action → Database Update
                ↓
         Revalidate Path
                ↓
          Re-fetch Data
```

### Google Sheets Integration Flow
```
Server Action (spreadsheet.ts)
        ↓
Google Service Account JWT Auth
        ↓
Google Sheets API Request
        ↓
Fetch Range (NEXT_PUBLIC_POSTS_SHEET_RANGE)
        ↓
Transform Rows to Objects
        ↓
Return to Client Component
```

### Recruitee API Flow (Script)
```
Node Script (get-all-recruitee-data.js)
        ↓
Authenticate with Recruitee API
        ↓
Fetch Candidates, Offers, Stages
        ↓
Rate Limiting (Exponential Backoff)
        ↓
Export to CSV & JSON
        ↓
Save to Local Files
```

---

## External Integrations

### 1. Firebase Authentication
- **Service**: Google Firebase
- **Purpose**: User authentication and authorization
- **Authentication Method**: Google OAuth (popup)
- **Domain Restriction**: @thmanyah.com only
- **Configuration**:
  ```typescript
  // src/lib/firebase/firebaseConfig.ts
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  ```

### 2. Supabase PostgreSQL
- **Service**: Supabase (Postgres database)
- **Purpose**: Store advertisers and job posts
- **Tables**:
  - `advertisers` - Company information
  - `posts` - Job listings with foreign key to advertisers
- **Queries**: `src/components/manage-advertisers/lib/queries.ts`
- **Configuration**:
  ```typescript
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  ```

### 3. Google Sheets API
- **Service**: Google Workspace APIs
- **Purpose**: Read job data from spreadsheets
- **Authentication**: Google Service Account (JWT)
- **Scope**: Read-only access to sheets
- **Configuration**:
  ```typescript
  NEXT_PUBLIC_POSTS_SPREADSHEET_ID  // Spreadsheet ID
  NEXT_PUBLIC_POSTS_SHEET_RANGE     // A1 notation range
  PROJECT_ID                        // Service account project ID
  PRIVATE_KEY                       // Service account private key
  CLIENT_EMAIL                      // Service account email
  ```
- **Implementation**: `src/app/actions/spreadsheet.ts`

### 4. Recruitee API
- **Service**: Recruitee (Recruitment platform)
- **Purpose**: Export candidate and offer data
- **Script**: `scripts/get-all-recruitee-data.js`
- **Features**:
  - Fetch all candidates
  - Fetch all offers
  - Fetch pipeline stages
  - Rate limiting with exponential backoff
  - Export to CSV and JSON
- **Output**:
  - `recruitee-candidates.csv`
  - `recruitee-candidates.json`
  - `recruitee-offers.csv`
  - `recruitee-offers.json`

---

## Authentication Flow

### Detailed Authentication Process

```mermaid
graph TD
    A[User visits any page] --> B{User authenticated?}
    B -->|No| C{NEXT_PUBLIC_PASS_LOGIN=true?}
    C -->|Yes| D[Skip auth, show content]
    C -->|No| E[Show Login component]
    E --> F[User clicks Google Sign-In]
    F --> G[Firebase OAuth popup]
    G --> H{Sign-in successful?}
    H -->|No| I[Show error message]
    H -->|Yes| J{Email ends with @thmanyah.com?}
    J -->|No| K[Auto logout + Error message]
    J -->|Yes| L[Update AuthContext with user]
    L --> M[Store auth token in Firebase]
    M --> N[Redirect to requested page]
    B -->|Yes| O[Show protected content]
    O --> P[Display user greeting]
    P --> Q{User action?}
    Q -->|Logout| R[Show confirmation dialog]
    R -->|Confirm| S[Sign out from Firebase]
    S --> E
    Q -->|Continue| O
```

### Key Files for Authentication

1. **Firebase Configuration** (`src/lib/firebase/firebaseConfig.ts:1-20`)
   - Initializes Firebase app
   - Exports `auth` instance

2. **Auth Functions** (`src/lib/firebase/auth.ts`)
   - `signInWithGoogle()` - Handles Google OAuth
   - `signOutUser()` - Handles logout
   - `subscribeToAuthChanges()` - Listens to auth state

3. **Auth Context** (`src/lib/context/AuthContext.tsx:1-87`)
   - Provides global auth state
   - Manages loading and error states
   - Exports `useAuth()` hook

4. **Protected Layout** (`src/layout/DefaultLayout.tsx:1-93`)
   - Wraps all pages
   - Shows Login component if not authenticated
   - Displays user info and logout button

### Security Considerations

⚠️ **Current Implementation**: Domain restriction is client-side only

**Recommendations**:
1. Add Firebase Security Rules to validate domain server-side
2. Implement custom claims for role-based access
3. Add token refresh logic
4. Implement session timeout
5. Add CSRF protection for forms

Example Firebase Security Rules:
```javascript
// Firebase Console → Authentication → Settings → Authorized domains
// Add: *.thmanyah.com

// Firestore/Realtime DB Rules:
{
  "rules": {
    ".read": "auth != null && auth.token.email_verified == true && auth.token.email.matches(/.*@thmanyah\\.com$/)",
    ".write": "auth != null && auth.token.email.matches(/.*@thmanyah\\.com$/)"
  }
}
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Authentication Bypass (DEV ONLY - set to false in production)
NEXT_PUBLIC_PASS_LOGIN=false

# Admin Password (purpose unclear - verify usage)
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password

# Google Sheets API (Service Account)
NEXT_PUBLIC_POSTS_SPREADSHEET_ID=your-spreadsheet-id
NEXT_PUBLIC_POSTS_SHEET_RANGE=Sheet1!A1:Z1000
PROJECT_ID=your-google-project-id
TYPE=service_account
PRIVATE_KEY_ID=your-private-key-id
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKey\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
CLIENT_ID=your-client-id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Postgres Direct Connection (if needed)
POSTGRES_HOST=db.your-project.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
```

### Environment Variable Usage

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | `src/lib/firebase/firebaseConfig.ts` | Firebase initialization |
| `NEXT_PUBLIC_PASS_LOGIN` | `src/layout/DefaultLayout.tsx:34` | Auth bypass for dev |
| `NEXT_PUBLIC_POSTS_*` | `src/app/actions/spreadsheet.ts` | Google Sheets API |
| `PROJECT_ID`, `PRIVATE_KEY`, etc. | `src/app/actions/spreadsheet.ts` | Google Service Account |
| `NEXT_PUBLIC_SUPABASE_*` | Supabase client initialization | Database connection |

### Security Notes

1. **Never commit `.env.local`** to version control
2. Use `.env.example` as a template (committed)
3. **Rotate keys regularly**, especially service account keys
4. **Restrict API keys** in Firebase and Google Cloud Console
5. **Use different credentials** for dev/staging/production

---

## Development Workflow

### Prerequisites
- **Node.js**: 18.x or higher
- **pnpm**: 10.12.4 (specified in package.json)
- **Git**: For version control
- **Firebase Account**: For authentication
- **Supabase Account**: For database
- **Google Cloud Account**: For Sheets API (optional)

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd Thamanyah-working-now

# 2. Install pnpm (if not installed)
npm install -g pnpm@10.12.4

# 3. Install dependencies
pnpm install

# 4. Create environment file
cp .env.example .env.local
# Edit .env.local with your credentials

# 5. Set up Firebase
# - Create project at https://console.firebase.google.com/
# - Enable Google authentication
# - Add authorized domain: localhost
# - Copy config to .env.local

# 6. Set up Supabase (optional, for advertiser management)
# - Create project at https://supabase.com
# - Run database migrations (create advertisers and posts tables)
# - Copy URL and anon key to .env.local

# 7. Start development server
pnpm dev
```

### Development Commands

```bash
# Start development server (with Turbopack)
pnpm dev
# Open http://localhost:3000

# Build for production
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format

# Check code formatting
pnpm format:check
```

### Code Quality Tools

#### ESLint Configuration
- **File**: `eslint.config.mjs`
- **Extends**: `next/core-web-vitals`, `next/typescript`
- **Auto-fix on commit**: Yes (via lint-staged)

#### Prettier Configuration
- **File**: `.prettierrc`
- **Settings**:
  - Tabs: 4 spaces
  - Line width: 100 characters
  - Trailing commas: All
  - Import sorting: Enabled
  - Tailwind class sorting: Enabled

#### Git Hooks (Husky)
- **Pre-commit**:
  - ESLint with auto-fix on `.ts`, `.tsx`, `.js`, `.jsx`
  - Prettier formatting on all files
  - Prevents commits with linting errors

#### Editor Configuration
- **File**: `.editorconfig`
- **Settings**:
  - Charset: UTF-8
  - Indent: 4 spaces
  - Line ending: LF
  - Trim trailing whitespace
  - Insert final newline

### Development Best Practices

1. **TypeScript**: Always use TypeScript, avoid `any` types
2. **Components**: Use functional components with hooks
3. **Styling**: Prefer Tailwind classes over custom CSS
4. **State Management**: Use React Context for global state
5. **Server Actions**: Use Next.js server actions for data mutations
6. **Imports**: Use absolute imports with `@/` alias
7. **Naming**:
   - Components: PascalCase (`JobOfferForm.tsx`)
   - Utilities: camelCase (`helpers.ts`)
   - Constants: UPPER_SNAKE_CASE
8. **File Organization**: Group by feature, not by type

### Testing Strategy (Future)

**Currently, no tests are implemented.** Recommended setup:

```bash
# Install testing dependencies (future)
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D vitest @vitest/ui
pnpm add -D playwright @playwright/test
```

**Recommended Test Structure**:
```
src/
├── components/
│   └── JobOffer/
│       ├── JobOfferForm.tsx
│       └── __tests__/
│           └── JobOfferForm.test.tsx
```

---

## Deployment Guide

### Vercel Deployment (Recommended)

Vercel is the recommended platform as it's built by the Next.js team.

#### Step 1: Prepare for Deployment

```bash
# 1. Ensure all environment variables are set
# 2. Test production build locally
pnpm build
pnpm start

# 3. Commit all changes
git add .
git commit -m "Prepare for deployment"
git push
```

#### Step 2: Deploy to Vercel

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - Framework: Next.js
   - Build command: `pnpm build`
   - Output directory: `.next`
4. Add environment variables (copy from `.env.local`)
5. Click "Deploy"

#### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:
- All `NEXT_PUBLIC_*` variables
- All Google Service Account variables
- All Supabase variables
- Set `NEXT_PUBLIC_PASS_LOGIN=false` for production

#### Step 4: Configure Domain

1. Add your domain in Vercel settings
2. Update Firebase authorized domains:
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain (e.g., `your-app.vercel.app`)
   - Add custom domain (if applicable)

### Alternative Deployment (Docker)

#### Dockerfile Example

```dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.12.4

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

#### Docker Deployment Commands

```bash
# Build Docker image
docker build -t thamanyah-web-tools .

# Run container
docker run -p 3000:3000 --env-file .env.local thamanyah-web-tools
```

### Post-Deployment Checklist

- [ ] Test authentication with @thmanyah.com email
- [ ] Verify domain restriction works (test with non-thmanyah email)
- [ ] Test all offer forms (job, freelancer, temp)
- [ ] Test salary calculator
- [ ] Test advertiser management (if using Supabase)
- [ ] Test Google Sheets integration (if configured)
- [ ] Verify dark/light mode toggle
- [ ] Test print functionality for offers
- [ ] Check responsive design on mobile
- [ ] Verify all environment variables are set
- [ ] Monitor Firebase usage and quotas
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)

### Monitoring & Maintenance

**Recommended Tools**:
- **Error Tracking**: Sentry, Rollbar, or Vercel Analytics
- **Performance**: Vercel Analytics, Google Lighthouse
- **Uptime Monitoring**: Uptime Robot, Pingdom
- **Logs**: Vercel Logs, Datadog

**Regular Maintenance**:
- Update dependencies monthly: `pnpm update`
- Monitor Firebase authentication logs
- Check Supabase database performance
- Review and rotate API keys quarterly
- Monitor Vercel bandwidth and function usage

---

## Additional Documentation

### Database Schema (Supabase)

#### `advertisers` Table
```sql
CREATE TABLE advertisers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `posts` Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  postId TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  productHandle TEXT,
  productName TEXT,
  advertiser_id INTEGER REFERENCES advertisers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Custom Fonts

The application uses custom Thamanyah fonts located in `public/fonts/`:

- **Display**: `public/fonts/display/` - For headings
- **Sans**: `public/fonts/sans/` - For body text
- **Serif Text**: `public/fonts/serif-text/` - For formal documents

All fonts are in WOFF2 format for optimal performance.

### Print Styles

Print-optimized styles are defined in:
- `src/app/globals.css` - Global print styles
- Individual component styles with `@media print`

**Print Behavior**:
- Navigation and action buttons hidden
- Page size: A4
- Page breaks controlled with CSS
- Optimized font sizes for printing

### RTL (Right-to-Left) Support

The application is fully RTL-compatible for Arabic:
- Ant Design configured with `direction: 'rtl'`
- Tailwind CSS supports RTL utilities
- Custom CSS uses logical properties (start/end instead of left/right)

### Localization

Current locale: **Arabic (Egypt) - ar_EG**

To add more locales:
1. Import locale from `antd/locale`
2. Update `AntdLayout.tsx` with locale switcher
3. Add translation files (if using i18n)

---

## Troubleshooting

### Common Issues

#### 1. Authentication not working
- **Check**: Firebase API keys in `.env.local`
- **Check**: Authorized domains in Firebase Console
- **Check**: `NEXT_PUBLIC_PASS_LOGIN` is set to `false`
- **Check**: User email ends with `@thmanyah.com`

#### 2. Google Sheets API errors
- **Check**: Service account credentials are correct
- **Check**: Service account has access to the spreadsheet
- **Check**: Spreadsheet ID and range are correct
- **Check**: `PRIVATE_KEY` is properly formatted (with newlines)

#### 3. Supabase connection errors
- **Check**: Supabase URL and anon key are correct
- **Check**: Database tables exist
- **Check**: RLS (Row Level Security) policies allow access

#### 4. Build errors
- **Clear cache**: `rm -rf .next`
- **Reinstall dependencies**: `rm -rf node_modules && pnpm install`
- **Check TypeScript errors**: `pnpm lint`

#### 5. Dark mode not persisting
- **Check**: localStorage is enabled in browser
- **Check**: No CORS issues
- **Clear**: localStorage and try again

---

## Future Enhancements

### Planned Features
- [ ] Multi-language support (Arabic + English)
- [ ] Email integration (send offers via email)
- [ ] Digital signatures for offers
- [ ] Approval workflow for offers
- [ ] Offer templates management
- [ ] Analytics dashboard
- [ ] Export offers to PDF server-side
- [ ] Batch offer generation
- [ ] Offer history and audit log

### Technical Improvements
- [ ] Add unit tests (Jest/Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Implement error boundary components
- [ ] Add server-side domain validation
- [ ] Implement rate limiting
- [ ] Add Redis caching layer
- [ ] Optimize images with next/image
- [ ] Add PWA support
- [ ] Implement SSR for all pages
- [ ] Add Storybook for component documentation

### Security Enhancements
- [ ] Implement Firebase Security Rules
- [ ] Add custom claims for role-based access
- [ ] Implement CSRF protection
- [ ] Add session timeout
- [ ] Implement audit logging
- [ ] Add two-factor authentication
- [ ] Encrypt sensitive data in database

---

## Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make changes and test thoroughly**
4. **Ensure code quality**:
   - Run `pnpm lint` and fix all errors
   - Run `pnpm format` to format code
   - Add TypeScript types for all new code
5. **Commit with clear messages**:
   - Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
6. **Push and create Pull Request**
7. **Wait for review and address feedback**

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] No ESLint errors
- [ ] Code is formatted with Prettier
- [ ] New features have comments/documentation
- [ ] No hardcoded credentials or secrets
- [ ] Responsive design tested
- [ ] Arabic RTL layout tested
- [ ] Print styles verified (if applicable)

---

## License

This project is **private** and proprietary to Thamanyah company.

**Copyright © 2024 Thamanyah. All rights reserved.**

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## Contact & Support

For questions, issues, or feature requests:
- **Internal Team**: Contact HR/IT department
- **Technical Lead**: [Specify contact]
- **Documentation**: This file (ARCHITECTURE.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024 | Initial release with job offers, freelancer offers, temp offers, salary calculator, and advertiser management |

---

**Last Updated**: November 5, 2025
**Maintained by**: Thamanyah Development Team
