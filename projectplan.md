# Project Plan: Worker Duplication Investigation in Dispatch Page

## Overview
Investigate and fix worker duplication issues in the dispatch page where the same worker ID might appear in multiple locations simultaneously.

## Analysis Tasks

### Phase 1: Investigation and Root Cause Analysis
- [ ] Examine `handleWorkerAssignment` function for incomplete worker removal logic
- [ ] Check drag-and-drop handlers for proper worker cleanup from source locations
- [ ] Analyze worker mapping with keys in React components for potential duplication
- [ ] Identify state update patterns that might leave workers in multiple locations
- [ ] Review Project Manager and Superintendent special slot assignments

### Phase 2: Code Review and Testing
- [ ] Test worker removal from all possible source locations (unassigned, groups, crews, PM/Super slots)
- [ ] Verify worker state updates are atomic and complete
- [ ] Check for race conditions in state updates
- [ ] Ensure proper cleanup when workers are moved between crew times
- [ ] Validate that workers are not duplicated during reset operations

### Phase 3: Potential Fixes
- [ ] Implement comprehensive worker removal before assignment
- [ ] Add validation to prevent duplicate worker IDs across all locations
- [ ] Improve state update logic to ensure atomicity
- [ ] Add debugging/logging for worker movement operations
- [ ] Consider adding worker ID uniqueness validation

## Findings

### Potential Duplication Points Identified:

1. **Project Manager/Superintendent Special Handling**: Lines 505-517 and 545-557 have commented code that suggests PMs and Superintendents might not be properly removed from unassigned workers when assigned to projects, allowing them to exist in multiple locations.

2. **Complex State Updates**: The `handleWorkerAssignment` function (lines 299-416) and `handleDragEnd` function (lines 422-769) have multiple nested state updates that could potentially leave workers in multiple locations if not all branches execute properly.

3. **Crew Time Management**: In drag operations for crew sections (lines 573-645), there's complex logic for removing workers from source locations and adding to target locations that could miss edge cases.

4. **Reset Operation**: The `handleResetWorkers` function (lines 253-297) collects workers from all locations but uses a Set to prevent duplicates, suggesting duplicates might already exist.

### Key Issues Found:

1. **Incomplete Worker Removal**: In `handleWorkerAssignment`, the function removes workers from current location but the removal logic might not cover all edge cases, especially when workers are in special slots (PM/Super).

2. **Race Conditions**: Multiple setState calls in succession could lead to inconsistent state if components re-render between updates.

3. **Missing Validation**: No validation exists to prevent the same worker ID from appearing in multiple locations simultaneously.

## Implementation Details

### Files to Examine:
- `/Users/jacobskinner/Documents/Leaderboards/leaderboards/src/app/dashboard/dispatch/page.tsx` (main dispatch logic)
- `/Users/jacobskinner/Documents/Leaderboards/leaderboards/src/components/dispatch/DispatchGroup.tsx` (group component)
- `/Users/jacobskinner/Documents/Leaderboards/leaderboards/src/components/dispatch/CrewTimeSection.tsx` (crew time component)