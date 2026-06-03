# Analysis Report — Jest Tests & Expo Layout Routing

This report presents a thorough read-only investigation of the test outcomes, Expo Router layouts, and navigation screen structures of the `expo-supabase-ai-template` project.

---

## 1. Jest Test Suite Evaluation

### Findings Summary
- **Execution Command**: `npx jest` (ran synchronously via Jest Runner config).
- **Test Outcomes**: 
  - **Passed Test Suites**: 182 / 182 (100% pass rate)
  - **Passed Individual Tests**: 1454 / 1454 (100% pass rate)
  - **Execution Time**: ~8.35 seconds
- **Observation Details**: The testing suite is structurally complete and fully verified. No test assertions failed.

### Highlighted Warnings/Logs during Jest Runs
1. **Async Cleanup & Logging Mismatch**:
   - **Log Verbose**: `Cannot log after tests are done. Did you forget to wait for something async in your test? Attempted to log "An error occurred while requiring the 'ExpoModulesCoreJSLogger' module: Cannot read properties of undefined (reading 'get')".`
   - **Origin**: Triggered by native Expo Modules setup hook during environment instantiation.
2. **Native Event Emitter Warnings (MMKV / DevSettings)**:
   - **Log Verbose**: ``new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.`
   - **Origin**: `src/framework/ui/auto-fix/analyzer.ts:40:19` calling `require('react-native').DevSettings.reload()` when mock events are not clean.
3. **i18n Translation Mapping Warnings**:
   - **Log Verbose**: `[SemanticI18n] Missing mapping for key: unknown.key`
   - **Origin**: Test coverage targeting `SemanticTranslationEngine.test.ts` where fallback values are evaluated.

---

## 2. Expo Layout, Routing, and Screen Structures

We identified three layout and UX degradation vulnerabilities in the navigation structure:

### Issue A: Mismatched Header/Screen Configuration in Tab Screens
- **File Paths**:
  - `src/app/(tabs)/account.tsx` (Line 23, 356)
  - `src/app/(tabs)/openai.tsx` (Line 26, 617)
- **Problem**: 
  These files are rendered inside the `TabLayout` navigation context (which is configured via `<Tabs>` wrapper). However, both screen files import `Stack` and render `<Stack.AvatarRelativeProjection>` (which is `<ExpoStack.Screen>`) to configure header titles dynamically:
  ```typescript
  import { Stack } from '@/src/components/AvatarRelativeProjection';
  // ...
  <Stack.AvatarRelativeProjection options={{ title: 'Account Settings' }} />
  ```
  Since the parent navigator is `Tabs` rather than `Stack`, configuring dynamic options using the `Stack.Screen` wrapper causes Expo Router to ignore the dynamically configured screen options (e.g. customized headers are not populated, leading to UX degradation).
- **UX Impact**: Screen options are ignored or cause mismatch errors on routing.

### Issue B: Unregistered / Unquarantined Tab Screens
- **Directory**: `src/app/(tabs)/`
- **File Paths**:
  - `src/app/(tabs)/audit.tsx` (Autonomic QA System screen)
  - `src/app/(tabs)/process.tsx` (Process Intelligence screen)
- **Problem**:
  In Expo Router, any route component inside a layout directory that is NOT explicitly declared in that layout is auto-generated as a tab at the end of the tab bar with a default title/icon and default options.
  - Neither `audit.tsx` nor `process.tsx` is declared in `src/app/(tabs)/_layout.tsx`.
  - Unlike `openai.tsx` (which is quarantined using `options={{ href: null }}`), these screens will automatically display as tabs with raw names and missing icons.
- **UX Impact**: Unstyled, confusing tabs appear dynamically on the tab bar for developer-centric tools.

### Issue C: Discrepant Administrative Discoverability
- **File Paths**:
  - `src/app/admin/_layout.tsx` (Sub-layout)
  - `src/components/admin/AdminShell.tsx` (Navigation sidebar/header wrapper)
- **Problem**:
  The sub-layout `admin/_layout.tsx` registers 15 screens (e.g., `realtime`, `receipts`, `settings`, `volunteers`, etc.). However, the quick navigation bar in `AdminShell` only lists 4 routes:
  - `Consequence Supervision` (`/admin/consequence-supervision`)
  - `Actor Lab` (`/admin/actor-lab`)
  - `Sermons` (`/admin/sermons`)
  - `Process Intel` (`/admin/intelligence`)
  There is no interactive link or button inside the developer workspace layout allowing navigation to the other 11 administrative panels.
- **UX Impact**: The other 11 admin panels are isolated and orphaned from standard user discoverability.

---

## 3. Recommended Fixes

### Fix A: Resolve Header Mismatches in Tab Screens
Modify `account.tsx` and `openai.tsx` to configure screen options using the `Tabs` context wrapper instead of the `Stack` context wrapper.

**Before (`src/app/(tabs)/account.tsx`)**:
```typescript
import { Stack } from '@/src/components/AvatarRelativeProjection';
// ...
<Stack.AvatarRelativeProjection options={{ title: 'Account Settings' }} />
```

**After (`src/app/(tabs)/account.tsx`)**:
```typescript
import { Tabs } from '@/src/components/AvatarRelativeProjection';
// ...
<Tabs.AvatarRelativeProjection options={{ title: 'Account Settings' }} />
```

*(Perform the corresponding change for `openai.tsx` using `Tabs` instead of `Stack`)*.

---

### Fix B: Quarantine or Formally Register `audit` and `process`
Ensure that the internal debugger screens `audit.tsx` and `process.tsx` do not clutter the primary mobile interface by adding explicit quarantine options.

**Suggested Change in `src/app/(tabs)/_layout.tsx`**:
```typescript
      {/* Tab Screen declarations ... */}
      <Tabs.AvatarRelativeProjection
        name="admin"
        options={{
          title: 'Truex Mission Control',
          tabBarLabel: 'Admin',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="gears" color={color} />,
          tabBarButtonTestID: 'dev-actor-lab-tab',
        }}
      />
      {/* Quarantine Developer/Diagnostics screens from Main Tab Bar */}
      <Tabs.AvatarRelativeProjection
        name="audit"
        options={{
          href: null,
        }}
      />
      <Tabs.AvatarRelativeProjection
        name="process"
        options={{
          href: null,
        }}
      />
```

---

### Fix C: Provide Dynamic Links or Integrate Orphaned Admin Screens
Expand `AdminShell.tsx` navigation options to integrate settings/panels or group minor developer panels under a drop-down/nested list.

**Suggested Extension in `src/components/admin/AdminShell.tsx`**:
```typescript
  const navigationItems = [
    { name: 'Consequence Supervision', route: '/admin/consequence-supervision' },
    { name: 'Actor Lab', route: '/admin/actor-lab' },
    { name: 'Sermons', route: '/admin/sermons' },
    { name: 'Process Intel', route: '/admin/intelligence' },
    { name: 'Realtime', route: '/admin/realtime' },
    { name: 'Receipts', route: '/admin/receipts' },
    { name: 'Settings', route: '/admin/settings' },
  ];
```
This restores structural discoverability to vital diagnostic screens.
