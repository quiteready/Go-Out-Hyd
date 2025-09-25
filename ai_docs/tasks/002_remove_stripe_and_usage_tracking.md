# Remove All Stripe Integration and Usage Tracking - Convert to RAG Simple

> **Task:** Convert rag-sas application to rag-simple by completely removing all Stripe billing integration and usage metrics tracking systems.

---

## 1. Task Overview

### Task Title

**Title:** Remove All Stripe Integration and Usage Tracking for RAG Simple Conversion

### Goal Statement

**Goal:** Transform the current rag-sas application into a simplified rag-simple version by completely removing all Stripe billing integration, usage metrics tracking, and subscription management features. This will result in a clean, authentication-only RAG application without payment or usage restrictions, suitable as a simple template for RAG applications.

---

## 2. Project Analysis & Current State

### Technology & Architecture

- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Current Billing System:** Stripe integration with subscription tiers (free, basic, pro)

### Current State

Based on comprehensive codebase analysis, the application currently has extensive Stripe billing and usage tracking integration:

**Stripe Integration:**
- Complete subscription management system with server actions (`app/actions/subscriptions.ts`)
- Stripe webhook handling (`app/api/webhooks/stripe/route.ts`)
- Customer portal integration and billing management
- Environment variables for Stripe API keys and configuration

**Usage Tracking System:**
- Complex usage enforcement library (`lib/usage-tracking.ts`)
- Database table for usage events (`lib/drizzle/schema/usage-events.ts`)
- Usage context provider for React components (`contexts/UsageContext.tsx`)
- Real-time usage calculation and limit enforcement

**Database Schema Dependencies:**
- `users.stripe_customer_id` field linking users to Stripe customers
- `userUsageEvents` table tracking individual user actions
- Subscription tier enums and related constraints

### Existing Context Providers Analysis

- **UserContext (`useUser()`):** Available throughout protected routes, provides user authentication data
- **UsageContext (`useUsage()`):** Currently provides subscription tier, usage statistics, billing period data - **TO BE REMOVED**
- **ChatStateContext:** Manages chat-related state, should remain unchanged
- **Context Hierarchy:** UserProvider (app layout) → UsageProvider (protected layout) → page components
- **Available Context Hooks:** `useUser()`, `useUsage()` (to be removed), `useChatState()`

**🔍 Context Coverage Analysis:**
- Usage-related data will be completely removed
- User authentication context will remain unchanged
- Chat functionality context is independent and will be preserved
- Simplified context hierarchy: UserProvider → page components (no usage provider)

## 3. Context & Problem Definition

### Problem Statement

The current rag-sas application contains extensive Stripe billing integration and usage tracking systems that add significant complexity for users who want a simple RAG application. The billing system includes subscription tiers, usage limits, payment processing, and complex state management that is unnecessary for a simplified template. This complexity creates barriers to adoption and maintenance for users who don't need monetization features.

### Success Criteria

- [ ] All Stripe integration completely removed (API calls, webhooks, environment variables)
- [ ] All usage tracking and metrics collection eliminated 
- [ ] Database schema simplified (no subscription or usage tables/fields)
- [ ] UI components cleaned of billing and usage displays
- [ ] Application functions as simple authentication + RAG with no usage restrictions
- [ ] Environment configuration simplified (no Stripe variables required)
- [ ] Template is ready for users who want basic RAG functionality

---

## 4. Development Mode Context

### Development Mode Context

- **🚨 IMPORTANT: This is a template conversion for broader distribution**
- **No backwards compatibility concerns** - complete removal is acceptable
- **Data loss acceptable** - existing subscription/usage data will be deleted
- **Users are template consumers** - they want simplified starting point  
- **Priority: Simplicity and clean architecture** over feature preservation
- **Aggressive removal allowed** - delete entire billing system cleanly

---

## 5. Technical Requirements

### Functional Requirements

- **User Authentication:** Preserve existing Supabase auth system unchanged
- **RAG Functionality:** Maintain all document processing and chat capabilities
- **Admin Features:** Keep admin role system (member/admin roles in users table)
- **Document Management:** Preserve document upload, processing, and management
- **Chat History:** Maintain conversation history and management features

### Non-Functional Requirements

- **Performance:** Improved performance by removing usage tracking overhead
- **Security:** Maintain existing authentication and authorization patterns
- **Usability:** Simplified user experience without billing friction
- **Responsive Design:** Preserve existing mobile/tablet/desktop support
- **Theme Support:** Maintain light/dark mode functionality unchanged

### Technical Constraints

- **Authentication System:** Must preserve Supabase auth implementation
- **Database Structure:** Must maintain core RAG functionality tables (users, documents, conversations)
- **Environment Setup:** Must simplify environment requirements by removing Stripe dependencies

---

## 6. Data & Database Changes

### Database Schema Changes

```sql
-- Remove usage tracking table
DROP TABLE IF EXISTS user_usage_events;

-- Remove Stripe customer reference from users table
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;

-- Note: Keep users table structure otherwise unchanged
-- - id, email, full_name, created_at, updated_at, role remain
-- - This preserves authentication and admin functionality
```

### Data Model Updates

```typescript
// Update user types - remove Stripe references
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "member" | "admin";
  created_at: string;
  updated_at: string;
  // REMOVED: stripe_customer_id
};

// Remove all usage tracking types
// DELETE: UsageStats, SubscriptionTier, UsageCheckResult, etc.
```

### Data Migration Plan

- [ ] **Step 1:** Create database migration to drop usage events table
- [ ] **Step 2:** Remove stripe_customer_id column from users table
- [ ] **Step 3:** Update TypeScript types to reflect schema changes
- [ ] **Step 4:** Test migration rollback capability

### 🚨 MANDATORY: Down Migration Safety Protocol

**CRITICAL REQUIREMENT:** Before running ANY database migration, create the corresponding down migration file:

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_stripe_removal]/` 
- [ ] **Step 4: Generate down.sql** - Create rollback operations with `IF EXISTS` clauses
- [ ] **Step 5: Verify Safety** - Ensure rollback won't break existing installations
- [ ] **Step 6: Apply Migration** - Only after down migration exists, run `npm run db:migrate`

---

## 7. API & Backend Changes

### Server Actions

- [ ] **DELETE ENTIRE FILE:** `app/actions/subscriptions.ts` - All Stripe-related server actions
- [ ] **UPDATE:** Remove usage validation from document upload actions
- [ ] **UPDATE:** Remove usage recording from chat actions

### Database Queries

- [ ] **UPDATE lib/ functions** - Remove usage tracking queries from existing functions
- [ ] **SIMPLIFY:** Document and chat queries no longer need usage validation

### API Routes (Remove Completely)

- [ ] **DELETE:** `app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- [ ] **VERIFY:** No other API routes depend on Stripe functionality

### External Integrations

**🚨 STRIPE INTEGRATION - COMPLETE REMOVAL:**
- All Stripe API integration code will be deleted
- All Stripe environment variables will be removed
- All Stripe webhook handling will be eliminated

---

## 8. Frontend Changes

### Components to Delete Completely

- [ ] **`components/billing/BillingManagementCard.tsx`** - Stripe billing management
- [ ] **`components/billing/`** (entire directory) - All billing-related components
- [ ] **`components/profile/UsageStatisticsCard.tsx`** - Usage tracking displays
- [ ] **`components/chat/UsageTracker.tsx`** - Chat usage tracking
- [ ] **Any components importing from UsageContext** - Need context provider updates

### Page Updates

- [ ] **`app/(protected)/profile/page.tsx`** - Remove billing and usage sections
- [ ] **`app/(public)/terms/page.tsx`** - Remove subscription and billing terms
- [ ] **Navigation components** - Remove billing/subscription menu items

### State Management

- [ ] **DELETE:** `contexts/UsageContext.tsx` - Complete removal
- [ ] **UPDATE:** Remove UsageProvider from protected layout
- [ ] **PRESERVE:** UserContext and ChatStateContext unchanged

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY Context Cleanup:**

- [ ] **✅ Remove UsageContext Provider:** Delete from `app/(protected)/layout.tsx`
- [ ] **✅ Update Hook Usage:** Replace `useUsage()` calls with direct feature access
- [ ] **✅ Simplify Component Props:** Remove usage-related prop drilling
- [ ] **✅ Clean Import Statements:** Remove usage-related imports throughout

**Updated Context Hierarchy:**
```typescript
// Before: UserProvider → UsageProvider → Components
// After:  UserProvider → Components (simplified)
```

---

## 9. Code Changes Overview

### 📂 **Current Implementation (Before)**

```typescript
// Complex usage-gated system with Stripe integration
// contexts/UsageContext.tsx - Complex usage tracking
export const UsageProvider = ({ children }) => {
  const [usageStats, setUsageStats] = useState(null);
  // ... complex usage fetching and validation
};

// components/chat/ChatInput.tsx - Usage validation before actions
const { usageStats, checkMessageLimits } = useUsage();
if (!checkMessageLimits()) {
  // Show upgrade prompt
  return <UpgradePrompt />;
}

// lib/usage-tracking.ts - Complex enforcement system
export async function checkDocumentUploadLimits(userId: string, fileSize: number) {
  const usage = await getUserUsage(userId);
  if (usage.documents.used >= usage.documents.limit) {
    throw new Error("Document limit reached");
  }
  // ... complex validation logic
}
```

### 📂 **After Refactor**

```typescript
// Simplified authentication-only system
// No usage context - direct feature access
// components/chat/ChatInput.tsx - Direct functionality
const user = useUser(); // Only authentication context needed
// Direct chat functionality without usage gates

// Simplified document upload - no limits
export async function uploadDocument(userId: string, file: File) {
  // Direct upload without usage validation
  return await processAndStoreDocument(userId, file);
}

// Clean component structure
export function ProfilePage() {
  const user = useUser();
  return (
    <div>
      <UserProfileCard user={user} />
      {/* No billing or usage components */}
    </div>
  );
}
```

### 🎯 **Key Changes Summary**

- [ ] **Complete Stripe Removal:** ~15 files deleted (actions, webhooks, billing components)
- [ ] **Usage System Elimination:** ~8 files deleted (tracking, validation, context)
- [ ] **Database Simplification:** 2 major schema changes (table drop, column removal) 
- [ ] **Environment Cleanup:** ~8 Stripe environment variables removed
- [ ] **Component Simplification:** Profile and protected pages significantly streamlined

---

## 10. Implementation Plan

### Phase 1: Database Schema Cleanup

**Goal:** Remove all billing and usage tracking database infrastructure

- [ ] **Task 1.1:** Create Down Migration File (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]_stripe_removal/down.sql`
  - Details: Follow drizzle_down_migration.md template for safe rollback
- [ ] **Task 1.2:** Update Database Schema Files
  - Files: `lib/drizzle/schema/users.ts`, delete `lib/drizzle/schema/usage-events.ts`
  - Details: Remove stripe_customer_id field, delete usage events schema
- [ ] **Task 1.3:** Generate and Apply Migration
  - Command: `npm run db:generate` then `npm run db:migrate`
  - Details: Only run after down migration is created

### Phase 2: Environment and Configuration Cleanup

**Goal:** Remove all Stripe-related configuration and dependencies

- [ ] **Task 2.1:** Update Environment Configuration
  - Files: `lib/env.ts`, `shipkit.json`
  - Details: Remove all Stripe environment variables, update template name to "rag-simple"
- [ ] **Task 2.2:** Update Package Dependencies
  - Files: `package.json`
  - Details: Remove Stripe SDK and related dependencies
- [ ] **Task 2.3:** Clean Documentation Files
  - Files: `SETUP.md`, `DEPLOY.md`
  - Details: Remove Stripe setup instructions and billing configuration

### Phase 3: Backend Code Elimination

**Goal:** Remove all server-side billing and usage tracking functionality

- [ ] **Task 3.1:** Delete Stripe Integration Files
  - Files: `app/actions/subscriptions.ts`, `app/api/webhooks/stripe/route.ts`, `lib/stripe.ts`, `lib/stripe-service.ts`
  - Details: Complete removal of Stripe server-side integration
- [ ] **Task 3.2:** Remove Usage Tracking System
  - Files: `lib/usage-tracking.ts`, `lib/usage-tracking-client.ts`, `lib/subscriptions.ts`
  - Details: Delete entire usage enforcement and tracking system
- [ ] **Task 3.3:** Update Existing Server Actions
  - Files: `app/actions/documents.ts`, `app/actions/chat.ts`
  - Details: Remove usage validation from document and chat actions

### Phase 4: Frontend Component Cleanup

**Goal:** Remove all billing and usage tracking UI components

- [ ] **Task 4.1:** Delete Billing Components
  - Files: `components/billing/` (entire directory)
  - Details: Remove BillingManagementCard and related billing UI
- [ ] **Task 4.2:** Remove Usage Display Components  
  - Files: `components/profile/UsageStatisticsCard.tsx`, `components/chat/UsageTracker.tsx`
  - Details: Delete components showing usage metrics and limits
- [ ] **Task 4.3:** Update Profile and Navigation
  - Files: `app/(protected)/profile/page.tsx`, navigation components
  - Details: Remove billing sections and usage-related navigation

### Phase 5: Context Provider Simplification

**Goal:** Remove usage context and simplify state management

- [ ] **Task 5.1:** Delete Usage Context
  - Files: `contexts/UsageContext.tsx`
  - Details: Complete removal of usage context provider and hooks
- [ ] **Task 5.2:** Update Protected Layout
  - Files: `app/(protected)/layout.tsx`
  - Details: Remove UsageProvider from component tree
- [ ] **Task 5.3:** Fix Component Usage References
  - Files: All components using `useUsage()` hook
  - Details: Remove usage hook calls and related functionality

### Phase 6: Legal and Documentation Updates

**Goal:** Update application documentation and legal terms

- [ ] **Task 6.1:** Update Terms of Service
  - Files: `app/(public)/terms/page.tsx`
  - Details: Remove billing, subscription, and payment processing terms
- [ ] **Task 6.2:** Simplify Setup Documentation
  - Files: `SETUP.md`, README files
  - Details: Remove Stripe setup instructions and usage tracking references
- [ ] **Task 6.3:** Update Application Metadata
  - Files: `shipkit.json`, package.json description fields
  - Details: Change from "rag-sas" to "rag-simple", update feature descriptions

### Phase 7: Basic Code Validation (AI-Only)

**Goal:** Verify code quality and functionality without running the application

- [ ] **Task 7.1:** Static Code Analysis
  - Files: All modified TypeScript files
  - Details: Run linting and type checking - never run dev server or build commands
- [ ] **Task 7.2:** Import and Reference Validation
  - Files: All components and services
  - Details: Verify no broken imports or references to removed code
- [ ] **Task 7.3:** Database Schema Validation
  - Files: Database migration files and schema definitions  
  - Details: Verify schema consistency and migration safety

---

## 11. File Structure & Organization

### Files to Delete Completely

```
apps/web/
├── app/actions/subscriptions.ts                    # DELETE: Stripe server actions
├── app/api/webhooks/stripe/route.ts               # DELETE: Stripe webhooks
├── lib/stripe.ts                                  # DELETE: Stripe client config
├── lib/stripe-service.ts                          # DELETE: Stripe service layer
├── lib/usage-tracking.ts                          # DELETE: Usage enforcement
├── lib/usage-tracking-client.ts                   # DELETE: Usage client utilities
├── lib/subscriptions.ts                           # DELETE: Subscription definitions
├── lib/drizzle/schema/usage-events.ts            # DELETE: Usage events schema
├── contexts/UsageContext.tsx                      # DELETE: Usage context provider
├── components/billing/                            # DELETE: Entire directory
├── components/profile/UsageStatisticsCard.tsx    # DELETE: Usage display
├── components/chat/UsageTracker.tsx               # DELETE: Chat usage tracking
└── hooks/use-usage-validation.ts                 # DELETE: Usage validation hooks
```

### Files to Modify

- [ ] **`lib/drizzle/schema/users.ts`** - Remove stripe_customer_id field
- [ ] **`lib/env.ts`** - Remove all Stripe environment variables  
- [ ] **`app/(protected)/layout.tsx`** - Remove UsageProvider
- [ ] **`app/(protected)/profile/page.tsx`** - Remove billing and usage sections
- [ ] **`app/(public)/terms/page.tsx`** - Remove subscription terms
- [ ] **`shipkit.json`** - Update template name and remove billing features
- [ ] **`package.json`** - Remove Stripe dependencies

---

## 12. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** Components still referencing useUsage() hook after context removal
  - **Code Review Focus:** Search all .tsx files for useUsage imports and calls
  - **Potential Fix:** Remove useUsage calls and related conditional rendering
- [ ] **Error Scenario 2:** Server actions trying to validate usage limits that no longer exist
  - **Code Review Focus:** Check document upload and chat actions for usage validation
  - **Potential Fix:** Remove usage checking and allow unrestricted access

### Edge Cases to Consider

- [ ] **Edge Case 1:** Admin users who previously had billing management access
  - **Analysis Approach:** Verify admin role functionality works without billing context
  - **Recommendation:** Ensure admin users retain administrative capabilities for user management
- [ ] **Edge Case 2:** Existing environment configurations with Stripe variables
  - **Analysis Approach:** Check if app handles missing Stripe environment variables gracefully
  - **Recommendation:** Update environment validation to not require Stripe variables

### Security & Access Control Review

- [ ] **Admin Access Control:** Preserve admin-only features (user management) while removing billing
  - **Check:** Admin routes and components still function without billing context
- [ ] **Authentication State:** Ensure simplified authentication flow works correctly  
  - **Check:** User login, registration, and session management unaffected
- [ ] **Data Access:** Verify no unauthorized data access after removing usage restrictions
  - **Check:** Document access and chat functionality respects user ownership
- [ ] **Permission Boundaries:** Ensure admin/member roles still function correctly
  - **Check:** Role-based access control independent of subscription system

---

## 13. Deployment & Configuration

### Environment Variables to Remove

```bash
# Remove these from .env.local and deployment configuration
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_BASIC_PRICE_ID
STRIPE_PRO_PRICE_ID
STRIPE_CUSTOMER_PORTAL_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Deployment Configuration Updates

- [ ] Remove Stripe webhook endpoints from deployment configurations
- [ ] Update environment variable requirements in deployment documentation
- [ ] Simplify environment setup instructions for new users

---

## 14. AI Agent Instructions

### Implementation Approach - COMPLETE REMOVAL STRATEGY

🎯 **EXECUTION STRATEGY: Aggressive Clean Removal**

1. **DELETE AGGRESSIVELY** - No preservation of billing code "just in case"
2. **SIMPLIFY THOROUGHLY** - Remove all complexity related to usage/billing  
3. **CLEAN ARCHITECTURE** - Result should be simple authentication + RAG functionality
4. **NO LEGACY COMMENTS** - Don't leave "removed billing" comments in code
5. **FRESH START MENTALITY** - Code should read as if billing never existed

### Validation Strategy

- **Focus on static analysis** - Use linting and type checking for validation
- **Never run dev server or build** - User already has working development environment
- **Database changes only** - Create and apply migrations as specified
- **No UI testing required** - User will handle visual validation after changes

### Success Metrics

- [ ] All linting passes without Stripe/usage-related errors
- [ ] TypeScript compilation succeeds with simplified types
- [ ] Database migrations apply successfully with rollback capability
- [ ] No broken imports or references to removed functionality
- [ ] Simplified environment configuration (no Stripe variables required)

---

## 15. Second-Order Consequences & Impact Analysis

🔍 **SECOND-ORDER IMPACT ANALYSIS:**

### Breaking Changes Identified

- **Database Schema:** Removal of stripe_customer_id and usage tables affects existing installations
- **Context Providers:** Removing UsageProvider will break components expecting usage context
- **Component Props:** Many components may have props that become unnecessary after usage removal

### Performance Implications

- **Improved Performance:** Removing usage tracking eliminates database queries on every request
- **Simplified State:** Fewer React context providers reduce re-render complexity
- **Faster Page Loads:** No billing/usage data fetching during page initialization

### User Experience Impacts

- **Simplified Onboarding:** No subscription setup or payment required
- **Unrestricted Usage:** No usage limits or upgrade prompts
- **Cleaner Interface:** Simplified profile and navigation without billing sections

### Maintenance Benefits

- **Reduced Complexity:** Significantly fewer files and dependencies to maintain
- **Easier Setup:** No Stripe API keys or webhook configuration required
- **Template Friendly:** Much easier for users to customize and deploy

### Mitigation Strategies Applied

- **Safe Database Migration:** Down migration files created for rollback capability
- **Gradual Implementation:** Phase-based approach allows validation at each step
- **Comprehensive Testing:** Static analysis ensures no broken references
- **Documentation Updates:** All setup instructions updated to reflect simplified requirements

**🔄 USER ATTENTION REQUIRED:**
After implementation, existing users of rag-sas will need to run database migrations. The down migration provides rollback capability if needed, but this is a one-way conversion to simplified architecture.

---

_Template Version: 1.3_
_Created: September 25, 2025_
_Task: 002_remove_stripe_and_usage_tracking.md_
