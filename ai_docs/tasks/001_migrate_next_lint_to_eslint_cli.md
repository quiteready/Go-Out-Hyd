# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title

**Title:** Migrate from deprecated `next lint` to ESLint CLI

### Goal Statement

**Goal:** Update the project to use the standard ESLint CLI directly instead of the deprecated `next lint` command, which will be removed in Next.js 16. This ensures long-term compatibility and follows Next.js's recommended migration path while maintaining the same linting functionality.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis

This is a straightforward migration task with a clear, official upgrade path provided by Next.js. No strategic analysis is needed as there's only one recommended solution: using the official Next.js codemod.

---

## 3. Project Analysis & Current State

### Technology & Architecture

- **Frameworks & Versions:** Next.js (latest), React 19
- **Language:** TypeScript 5 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Workspace Structure:** Monorepo with root package.json and apps/web subdirectory

### Current State

The project currently uses the deprecated `next lint` command in `apps/web/package.json` (line 9). The ESLint configuration is already set up with the modern flat config format in `eslint.config.mjs`, extending Next.js recommended configs. All required dependencies are already installed:

- `eslint: ^9`
- `@eslint/eslintrc: ^3`
- `eslint-config-next: 15.3.1`

The deprecation warning appears when running the current lint command, indicating Next.js is preparing to remove this wrapper in version 16.

### Existing Context Providers Analysis

N/A - This is a build tooling/linting configuration change that doesn't affect React context providers.

## 4. Context & Problem Definition

### Problem Statement

The current project uses `next lint` command which is deprecated and will be removed in Next.js 16. This causes deprecation warnings during development and poses a risk for future Next.js upgrades. The migration needs to be completed to:

1. Eliminate deprecation warnings
2. Future-proof the project for Next.js 16
3. Follow Next.js team's recommended migration path
4. Maintain existing linting functionality without disruption

### Success Criteria

- [ ] `next lint` command replaced with direct ESLint CLI usage
- [ ] All existing linting rules and configurations preserved
- [ ] No deprecation warnings when running lint command
- [ ] Linting functionality works identically to before
- [ ] Both workspace-level and app-level lint commands updated
- [ ] CI/CD compatibility maintained

---

## 5. Development Mode Context

### Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements

- Replace `next lint` with ESLint CLI while maintaining identical functionality
- Preserve all existing ESLint configurations and rules
- Update both root-level and app-level package.json scripts
- Ensure workspace-level linting continues to work correctly

### Non-Functional Requirements

- **Performance:** ESLint CLI should run at same or better speed than `next lint`
- **Compatibility:** Must work with existing CI/CD and development workflows
- **Maintainability:** Use standard ESLint CLI for consistency across team

### Technical Constraints

- Must use the official Next.js codemod for safe migration
- Cannot change existing ESLint rules or configurations
- Must maintain workspace structure compatibility

---

## 7. Data & Database Changes

### Database Schema Changes

N/A - This is a linting configuration change with no database impact.

### Data Model Updates

N/A - No data model changes required.

### Data Migration Plan

N/A - No data migration needed.

---

## 8. API & Backend Changes

### Server Actions

N/A - No server-side code changes required.

### Database Queries

N/A - No database query changes needed.

### API Routes

N/A - No API route changes required.

### External Integrations

N/A - No external integration changes needed.

---

## 9. Frontend Changes

### New Components

N/A - No new components required.

### Page Updates

N/A - No page updates required.

### State Management

N/A - No state management changes needed.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Root package.json:**

```json
{
  "scripts": {
    "lint": "npm run lint --workspaces"
  }
}
```

**apps/web/package.json:**

```json
{
  "scripts": {
    "lint": "next lint"
  }
}
```

**apps/web/eslint.config.mjs:**

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### 📂 **After Migration**

The Next.js codemod will automatically update the configuration to use ESLint CLI directly while preserving all existing rules and functionality.

**Expected changes:**

- `apps/web/package.json` lint script updated to use `eslint` instead of `next lint`
- ESLint configuration may be updated to ensure full compatibility
- Workspace-level linting will continue to work through the updated scripts

### 🎯 **Key Changes Summary**

- [ ] **Script Update:** Replace `"lint": "next lint"` with direct ESLint CLI command
- [ ] **Configuration Preservation:** Maintain all existing ESLint rules and configs
- [ ] **Files Modified:** `apps/web/package.json` and potentially `eslint.config.mjs`
- [ ] **Impact:** Eliminates deprecation warnings while maintaining identical linting behavior

---

## 11. Implementation Plan

### Phase 1: Apply Next.js Codemod

**Goal:** Use the official Next.js codemod to safely migrate from `next lint` to ESLint CLI

- [x] **Task 1.1:** Run Next.js Migration Codemod ✓ 2024-12-24
  - Files: `apps/web/package.json`, `eslint.config.mjs`
  - Command: `npx @next/codemod@canary next-lint-to-eslint-cli apps/web --force`
  - Details: Successfully executed codemod, updated lint script and added ignores configuration ✓

### Phase 2: Verification and Testing

**Goal:** Ensure the migration worked correctly and all functionality is preserved

- [x] **Task 2.1:** Verify Lint Script Updates ✓ 2024-12-24
  - Files: `apps/web/package.json` line 9 updated from `"next lint"` to `"eslint ."` ✓
  - Details: Confirmed lint script successfully updated to use ESLint CLI directly ✓
- [x] **Task 2.2:** Test Linting Functionality ✓ 2024-12-24
  - Command: `npm run lint` (from apps/web) - found 6 existing linting issues (3 errors, 3 warnings) ✓
  - Details: ESLint CLI working correctly, no deprecation warnings, finding expected issues ✓
- [x] **Task 2.3:** Check Workspace-Level Linting ✓ 2024-12-24
  - Command: `npm run lint --workspaces` (from root) - successfully ran workspace linting ✓
  - Details: Workspace-level linting continues to work correctly with ESLint CLI ✓

### Phase 3: Basic Code Validation (AI-Only)

**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 3.1:** Code Quality Verification ✓ 2024-12-24
  - Files: TypeScript compilation passed with `tsc --noEmit` ✓
  - Details: No syntax errors in modified configuration files ✓
- [x] **Task 3.2:** Configuration Review ✓ 2024-12-24
  - Files: ESLint config validation with `eslint --print-config` passed ✓
  - Details: Configuration is valid and includes all expected Next.js, React, TypeScript rules ✓

### Phase 4: Comprehensive Code Review (Mandatory)

**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 4.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 4.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 5: User Testing (Only After Code Review)

**Goal:** Request human testing for lint command functionality

- [ ] **Task 5.1:** Present Migration Results
  - Files: Summary of changes made by codemod
  - Details: Provide clear summary of what was changed
- [ ] **Task 5.2:** Request User Command Testing
  - Commands: Test `npm run lint` in both root and apps/web directories
  - Details: Verify no deprecation warnings appear and linting works as expected

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW

🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the web search tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create

N/A - This is a configuration migration, no new files expected.

### Files to Modify

- [ ] **`apps/web/package.json`** - Update lint script from `next lint` to ESLint CLI
- [ ] **`eslint.config.mjs`** (possibly) - May be updated by codemod for compatibility

### Dependencies to Add

N/A - All required dependencies are already installed.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** Codemod fails to run or produces invalid configuration
  - **Code Review Focus:** Check package.json syntax and ESLint config validity
  - **Potential Fix:** Manual script update if codemod doesn't work correctly
- [ ] **Error Scenario 2:** Workspace-level linting stops working after migration
  - **Code Review Focus:** Verify root package.json scripts still work with updated app scripts
  - **Potential Fix:** Adjust root-level lint command if needed

### Edge Cases to Consider

- [ ] **Edge Case 1:** Custom ESLint rules might need adjustment for direct CLI usage
  - **Analysis Approach:** Test linting on various file types in the project
  - **Recommendation:** Verify all existing lint rules continue to work
- [ ] **Edge Case 2:** CI/CD scripts may need updates if they rely on `next lint`
  - **Analysis Approach:** Check if any deployment scripts use the lint command
  - **Recommendation:** Update CI/CD scripts if they reference the old command

### Security & Access Control Review

- [ ] **No Security Impact:** This change only affects development tooling, no security implications

---

## 15. Deployment & Configuration

### Environment Variables

N/A - No environment variable changes required.

---

## 16. AI Agent Instructions

### Communication Preferences

- [ ] Provide clear updates on each step of the migration process
- [ ] Flag any unexpected changes made by the codemod
- [ ] Confirm that linting functionality is preserved

### Implementation Approach - CRITICAL WORKFLOW

🚨 **MANDATORY: Always follow this exact sequence:**

Follow the standard implementation workflow as defined in the task template, starting with the codemod execution and proceeding through verification and testing phases.

### Code Quality Standards

- [ ] Ensure the migration preserves all existing ESLint functionality
- [ ] Verify no deprecation warnings appear after migration
- [ ] Maintain workspace compatibility

---

## 17. Notes & Additional Context

### Research Links

- [Next.js ESLint Migration Documentation](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [Next.js Codemod Documentation](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**

- [ ] **Existing Scripts:** Root-level workspace linting may need adjustment if app-level scripts change significantly
- [ ] **CI/CD Dependencies:** Any deployment scripts using `next lint` will need updates
- [ ] **Developer Workflows:** Team members using `next lint` directly will need to switch to `npm run lint`
- [ ] **IDE Integration:** ESLint IDE plugins should work better with direct ESLint CLI

#### 2. **Ripple Effects Assessment**

- [ ] **Workspace Linting:** Changes to app-level lint script affects root-level workspace commands
- [ ] **Development Scripts:** Other package.json scripts may reference lint command indirectly
- [ ] **Pre-commit Hooks:** If any git hooks use linting, they may need updates

#### 3. **Performance Implications**

- [ ] **Linting Speed:** ESLint CLI may be slightly faster than Next.js wrapper
- [ ] **Memory Usage:** Direct ESLint usage should have lower memory footprint
- [ ] **Startup Time:** Elimination of Next.js wrapper reduces startup overhead

#### 4. **Maintenance Burden**

- [ ] **Consistency:** Using standard ESLint CLI improves consistency with other projects
- [ ] **Debugging:** ESLint errors will be clearer without Next.js wrapper layer
- [ ] **Updates:** Future ESLint updates will be more straightforward

### Critical Issues Identification

#### 🟢 **GREEN FLAGS - Low Risk Migration**

- [ ] **Official Support:** Next.js provides official codemod for safe migration
- [ ] **Backward Compatibility:** ESLint CLI is more standard and widely supported
- [ ] **No Functional Changes:** Linting rules and behavior remain identical
- [ ] **Future Compatibility:** Prepares project for Next.js 16 upgrade

#### ⚠️ **YELLOW FLAGS - Monitor During Migration**

- [ ] **Workspace Scripts:** Ensure root-level workspace linting continues working
- [ ] **Custom Configurations:** Verify any custom ESLint plugins continue working
- [ ] **Team Communication:** Notify team that `next lint` is deprecated

### Mitigation Strategies

#### Configuration Changes

- [ ] **Backup Current Config:** Document current working configuration before migration
- [ ] **Test Thoroughly:** Verify linting works on all file types after migration
- [ ] **Gradual Rollout:** Test in development before updating CI/CD

#### Team Communication

- [ ] **Update Documentation:** Document new lint command usage
- [ ] **Notify Team:** Communicate that `next lint` is deprecated
- [ ] **Update IDE Settings:** Help team update ESLint IDE plugin configurations

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:

- [ ] **Complete Impact Analysis:** This is a low-risk, standard migration with official support
- [ ] **Identify No Critical Issues:** Migration is straightforward with provided tooling
- [ ] **Propose Testing Strategy:** Verify workspace linting continues working
- [ ] **Document Benefits:** Explain why this migration improves the project

---

_Template Version: 1.3_  
_Last Updated: 12/24/2024_  
_Created By: AI Assistant_
