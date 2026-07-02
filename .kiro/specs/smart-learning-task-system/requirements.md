# Requirements Document

## Introduction

The Universal Smart Learning Task System upgrades the existing simple daily tasks feature of the 1% Dev Academy LMS into a full-featured, persistent, database-driven learning planner. Students can organize everything they need to learn — whether it exists inside the LMS (courses, lessons, quizzes) or outside it (YouTube videos, GitHub repos, LeetCode problems, documentation). The system serves as the student's personal learning hub, combining internal LMS content and external resources in a single organized workspace, with all data securely stored in Supabase and synced across devices.

## Glossary

- **Task_Manager**: The full smart learning task system being described in this document.
- **Task**: A single learning work item created by a student, stored persistently in the database.
- **Student**: An authenticated user of the 1% Dev Academy LMS who creates and manages tasks.
- **Internal_Link**: A reference to a resource that exists within the LMS (course, module, lesson, quiz, assignment, project, practice lab, certificate, or dashboard page).
- **External_URL**: A URL pointing to a resource outside the LMS (websites, YouTube, GitHub, documentation, PDFs, etc.).
- **Link_Type**: The classification of where a task's destination lives — either `internal` or `external`.
- **Task_Type**: The category of learning activity a task represents (Study, Watch Video, Read Article, Practice Coding, Complete Lesson, Assignment, Revision, Mock Test, Interview Prep, Build Project, Research, Custom).
- **Task_Status**: The current state of a task — one of: `not_started`, `in_progress`, `completed`, `skipped`, `archived`.
- **Priority**: The urgency level of a task — one of: `low`, `medium`, `high`, `critical`.
- **Link_Preview**: A rich metadata card automatically fetched for external URLs, displaying title, favicon, thumbnail, and domain.
- **Recurrence_Rule**: A configuration that causes a task to repeat automatically on a defined schedule (daily, weekdays, weekly, monthly, or custom interval).
- **Streak**: A count of consecutive days on which a student has completed at least one task.
- **Tag**: A short student-defined label that can be attached to multiple tasks for grouping.
- **Dashboard**: The main student home page of the Academy, which shows task summaries and progress widgets.
- **Task_Hub**: The dedicated full-page task management view within the Academy.

---

## Requirements

### Requirement 1: Database-Backed Task Persistence

**User Story:** As a student, I want my tasks to be stored in the database linked to my account, so that my tasks survive logout/login and are available on any device.

#### Acceptance Criteria

1. THE Task_Manager SHALL store every task as a row in the Supabase `tasks` table, linked to the authenticated student's user ID.
2. WHEN a student creates, updates, or deletes a task, THE Task_Manager SHALL reflect the change in the Supabase database within 2 seconds.
3. THE Task_Manager SHALL NOT use browser local storage as the primary or fallback store for task data.
4. WHEN a student logs in on a new device, THE Task_Manager SHALL load all of that student's tasks from the database.
5. THE Task_Manager SHALL enforce row-level security so that a student can only read, create, update, or delete their own tasks.

---

### Requirement 2: Rich Task Schema

**User Story:** As a student, I want each task to hold detailed learning information beyond just a title, so that I can capture everything relevant about a learning activity in one place.

#### Acceptance Criteria

1. THE Task_Manager SHALL persist the following fields for every task: `id`, `user_id`, `title`, `description`, `task_type`, `status`, `priority`, `due_date`, `due_time`, `estimated_duration_minutes`, `link_type`, `internal_link_target`, `internal_link_id`, `external_url`, `course_id`, `category`, `personal_notes`, `tags`, `is_pinned`, `is_archived`, `sort_order`, `recurrence_rule`, `created_at`, `updated_at`.
2. WHEN a student saves a task with only a title, THE Task_Manager SHALL accept the task and treat all other fields as optional with defined defaults.
3. THE Task_Manager SHALL validate that `priority` is one of `low`, `medium`, `high`, `critical` before saving.
4. THE Task_Manager SHALL validate that `task_type` is one of the defined Task_Types before saving.
5. THE Task_Manager SHALL validate that `status` is one of `not_started`, `in_progress`, `completed`, `skipped`, `archived` before saving.
6. IF a student submits a task with an invalid field value, THEN THE Task_Manager SHALL return a descriptive validation error and reject the save.

---

### Requirement 3: Multiple Link Types

**User Story:** As a student, I want to attach either an internal LMS resource or any external URL to a task, so that clicking the task takes me directly to the right learning content.

#### Acceptance Criteria

1. WHEN creating or editing a task, THE Task_Manager SHALL allow the student to choose between `internal` and `external` as the Link_Type.
2. WHERE the Link_Type is `internal`, THE Task_Manager SHALL allow the student to select a destination from: Course, Module, Lesson, Quiz, Assignment, Project, Practice Lab, Certificate, or Dashboard Page.
3. WHERE the Link_Type is `external`, THE Task_Manager SHALL allow the student to enter any valid URL as the External_URL.
4. WHEN a student clicks a task that has an Internal_Link, THE Task_Manager SHALL navigate to the corresponding internal LMS page within the same application.
5. WHEN a student clicks a task that has an External_URL, THE Task_Manager SHALL open the URL in a new browser tab.
6. IF a student saves an `external` task with a URL that fails URL format validation, THEN THE Task_Manager SHALL reject the save and display an error message.
7. IF a student saves an `external` task with a URL that contains a disallowed scheme (anything other than `https` or `http`), THEN THE Task_Manager SHALL reject the save.

---

### Requirement 4: External URL Type Detection and Icons

**User Story:** As a student, I want the system to automatically detect the type of external resource I've linked, so that I can see the correct icon without configuring it manually.

#### Acceptance Criteria

1. WHEN a student enters a valid External_URL, THE Task_Manager SHALL classify it into one of the following resource types: `youtube`, `github`, `pdf`, `google_docs`, `google_drive`, `notion`, `kaggle`, `leetcode`, `hackerrank`, `medium`, `website`.
2. THE Task_Manager SHALL assign the `youtube` type WHEN the URL domain matches `youtube.com` or `youtu.be`.
3. THE Task_Manager SHALL assign the `github` type WHEN the URL domain matches `github.com`.
4. THE Task_Manager SHALL assign the `pdf` type WHEN the URL path ends with `.pdf`.
5. THE Task_Manager SHALL assign the `google_docs` type WHEN the URL domain matches `docs.google.com`.
6. THE Task_Manager SHALL assign the `google_drive` type WHEN the URL domain matches `drive.google.com`.
7. THE Task_Manager SHALL assign the `notion` type WHEN the URL domain matches `notion.so` or `notion.site`.
8. THE Task_Manager SHALL assign the `kaggle` type WHEN the URL domain matches `kaggle.com`.
9. THE Task_Manager SHALL assign the `leetcode` type WHEN the URL domain matches `leetcode.com`.
10. THE Task_Manager SHALL assign the `hackerrank` type WHEN the URL domain matches `hackerrank.com`.
11. THE Task_Manager SHALL assign the `medium` type WHEN the URL domain matches `medium.com`.
12. THE Task_Manager SHALL display a distinct icon for each detected resource type in the task list and task detail views.
13. IF a URL does not match any known resource type, THEN THE Task_Manager SHALL assign type `website` and display a generic globe icon.

---

### Requirement 5: Smart Link Preview

**User Story:** As a student, I want the system to fetch a preview of the external URL I've added, so that I can see the page title, favicon, and thumbnail instead of a raw link.

#### Acceptance Criteria

1. WHEN a student enters a valid External_URL and saves the task, THE Task_Manager SHALL attempt to fetch Open Graph / meta tag data for the URL via a backend proxy endpoint.
2. WHEN metadata is successfully fetched, THE Task_Manager SHALL store and display: website title, favicon URL, thumbnail image URL (if available), and domain name.
3. THE Task_Manager SHALL render the fetched metadata as a Link_Preview card on the task detail view and optionally inline in task list rows.
4. IF metadata fetching fails or times out after 5 seconds, THEN THE Task_Manager SHALL gracefully degrade by displaying the raw URL with the detected resource type icon, without showing an error to the student.
5. THE Task_Manager SHALL fetch link metadata server-side (via the backend) to avoid CORS issues and to prevent exposing the student's browser to unvalidated third-party content.

---

### Requirement 6: Task Organization and Management

**User Story:** As a student, I want to pin, archive, duplicate, reorder, and filter my tasks, so that I can keep my task list organized and focused.

#### Acceptance Criteria

1. WHEN a student pins a task, THE Task_Manager SHALL set `is_pinned = true` and display pinned tasks at the top of all task list views.
2. WHEN a student archives a task, THE Task_Manager SHALL set `is_archived = true` and remove the task from all active views without deleting the row.
3. WHEN a student restores an archived task, THE Task_Manager SHALL set `is_archived = false` and return the task to the active task list.
4. WHEN a student duplicates a task, THE Task_Manager SHALL create a new task row with all fields copied from the original, a " (Copy)" suffix on the title, and a new `id` and `created_at`.
5. WHEN a student reorders tasks by drag-and-drop, THE Task_Manager SHALL persist the new `sort_order` values to the database.
6. THE Task_Manager SHALL support filtering tasks by: category, course, priority, status, and completion state.
7. WHEN a student types in the search box, THE Task_Manager SHALL filter the displayed tasks in real time, matching against title, description, tags, and personal notes.

---

### Requirement 7: Dashboard Task Widgets

**User Story:** As a student, I want to see task summaries on my main dashboard, so that I can quickly understand what needs my attention today without opening the full task hub.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Today's Tasks" widget showing tasks where `due_date` equals today's date and `is_archived = false`.
2. THE Dashboard SHALL display an "Overdue Tasks" count widget showing tasks where `due_date` is before today, `status` is not `completed` or `skipped`, and `is_archived = false`.
3. THE Dashboard SHALL display a "Completed Today" count showing tasks where `status = completed` and `updated_at` is on today's date.
4. THE Dashboard SHALL display a "High Priority" widget showing tasks with `priority = critical` or `priority = high` and `status` not `completed` or `skipped`.
5. THE Dashboard SHALL display a "Pinned Tasks" widget showing tasks where `is_pinned = true` and `is_archived = false`.
6. WHEN a student clicks any task row in a dashboard widget, THE Task_Manager SHALL open the full task detail view.

---

### Requirement 8: Daily View and Time-Based Planning

**User Story:** As a student, I want to switch between Today, Tomorrow, This Week, Next Week, This Month, and All Tasks views, so that I can plan my learning at different time horizons.

#### Acceptance Criteria

1. THE Task_Hub SHALL provide view filters for: Today, Tomorrow, This Week, Next Week, This Month, and All Tasks.
2. WHEN the "Today" view is active, THE Task_Manager SHALL show tasks where `due_date = today`, plus any tasks that are overdue and not completed.
3. WHEN the "Tomorrow" view is active, THE Task_Manager SHALL show tasks where `due_date = tomorrow`.
4. WHEN the "This Week" view is active, THE Task_Manager SHALL show tasks where `due_date` falls within the current Monday–Sunday range.
5. WHEN the "Next Week" view is active, THE Task_Manager SHALL show tasks where `due_date` falls within next Monday–Sunday range.
6. WHEN the "This Month" view is active, THE Task_Manager SHALL show tasks where `due_date` falls within the current calendar month.
7. WHEN the "All Tasks" view is active, THE Task_Manager SHALL show all non-archived tasks sorted by pinned first, then due date ascending, then `sort_order`.
8. THE Task_Hub SHALL display suggested next tasks in the Today view — tasks with the highest priority and earliest due date that are `not_started`.

---

### Requirement 9: Recurring Tasks

**User Story:** As a student, I want to set tasks to repeat on a schedule, so that my daily revision habits and recurring study sessions are automatically recreated.

#### Acceptance Criteria

1. WHEN creating or editing a task, THE Task_Manager SHALL allow the student to set a Recurrence_Rule with one of: `none`, `daily`, `weekdays`, `weekly`, `monthly`, or `custom` with a numeric interval in days.
2. WHEN a recurring task is marked as `completed`, THE Task_Manager SHALL automatically create a new task instance with the next due date calculated from the Recurrence_Rule, copying all fields except `id`, `status` (reset to `not_started`), and `created_at`.
3. THE Task_Manager SHALL calculate the next due date for `daily` as current due date + 1 day, `weekdays` as next Monday–Friday date, `weekly` as current due date + 7 days, `monthly` as the same calendar day of the next month, and `custom` as current due date + interval days.
4. IF no `due_date` is set on a recurring task and it is marked completed, THEN THE Task_Manager SHALL use today's date as the base for calculating the next due date.

---

### Requirement 10: Automatic Status Sync with LMS Progress

**User Story:** As a student, I want a task linked to an LMS lesson or quiz to automatically update its status when I complete that lesson or quiz, so that my task list reflects my real learning progress without manual updates.

#### Acceptance Criteria

1. WHEN a student marks an LMS lesson as complete and a task exists with `link_type = internal`, `internal_link_target = lesson`, and `internal_link_id` matching that lesson's identifier, THEN THE Task_Manager SHALL set that task's `status` to `completed`.
2. WHEN a student completes an LMS quiz and a task exists with `link_type = internal`, `internal_link_target = quiz`, and `internal_link_id` matching that quiz's identifier, THEN THE Task_Manager SHALL set that task's `status` to `completed`.
3. THE automatic status sync SHALL NOT override a task that was already manually set to `skipped` or `archived`.

---

### Requirement 11: Notifications and Reminders

**User Story:** As a student, I want to receive reminders for upcoming and overdue tasks, so that I don't miss important learning deadlines.

#### Acceptance Criteria

1. WHERE browser notification permissions are granted by the student, THE Task_Manager SHALL send a browser notification when a task's `due_date` and `due_time` arrive.
2. WHERE browser notification permissions are granted, THE Task_Manager SHALL send a daily study reminder notification at a student-configured time.
3. WHERE browser notification permissions are granted, THE Task_Manager SHALL send a notification for tasks that become overdue (past `due_date` with `status` not `completed` or `skipped`) when the student opens the application.
4. THE Task_Manager SHALL prompt the student to grant notification permissions the first time the Task_Hub is opened, without blocking use of the feature if permission is denied.

---

### Requirement 12: Learning Analytics

**User Story:** As a student, I want to see analytics about my task completion habits, so that I can understand my learning patterns and stay motivated.

#### Acceptance Criteria

1. THE Task_Manager SHALL calculate and display the following analytics for the authenticated student: total tasks completed, completion percentage (completed / total non-archived tasks), current daily streak (consecutive days with at least one task completed), weekly streak (consecutive weeks with at least one task completed), and total estimated study hours (sum of `estimated_duration_minutes` for completed tasks / 60).
2. THE Task_Manager SHALL display the most studied course (the `course_id` with the highest count of completed tasks).
3. THE Task_Manager SHALL display the most used external resource type (the detected URL type with the highest count of completed tasks).
4. THE Task_Manager SHALL display average task completion time (mean duration between `created_at` and `updated_at` for tasks with `status = completed`).
5. THE analytics data SHALL be computed from the Supabase database and cached client-side for the duration of the session; THE Task_Manager SHALL refresh analytics when a task is completed.

---

### Requirement 13: Performance and Scalability

**User Story:** As a student with thousands of tasks, I want the task list to load quickly, so that the task hub remains responsive even with a large task history.

#### Acceptance Criteria

1. THE Task_Manager SHALL load the initial task list using paginated database queries, fetching no more than 50 tasks per page by default.
2. WHEN a student scrolls to the bottom of the task list, THE Task_Manager SHALL fetch the next page of tasks (lazy loading).
3. THE Task_Manager SHALL index the `tasks` table on `(user_id, due_date)`, `(user_id, status)`, `(user_id, is_pinned)`, and `(user_id, is_archived)` columns to support efficient filtering queries.
4. THE Task_Manager SHALL cache the current page of tasks in memory for the duration of the session and invalidate the cache only when a create, update, or delete operation occurs.
5. WHEN filtering or searching tasks, THE Task_Manager SHALL execute the query against the database (not a full in-memory collection) to avoid loading all tasks into memory.

---

### Requirement 14: Security and Input Validation

**User Story:** As a student, I want to know that all my task data is validated and sanitized, so that malicious content cannot be injected through the task system.

#### Acceptance Criteria

1. THE Task_Manager SHALL validate all External_URL values on the backend before persisting them, rejecting URLs with non-HTTP/HTTPS schemes (e.g., `javascript:`, `data:`, `ftp:`).
2. THE Task_Manager SHALL sanitize all free-text fields (`title`, `description`, `personal_notes`, `category`, `tags`) by stripping HTML tags before persisting.
3. THE Task_Manager SHALL enforce a maximum length on text fields: `title` ≤ 255 characters, `description` ≤ 2000 characters, `personal_notes` ≤ 5000 characters, each tag ≤ 50 characters, maximum 20 tags per task.
4. IF a student submits a task that exceeds any field length limit, THEN THE Task_Manager SHALL return a descriptive error message identifying the offending field without saving the task.
5. THE Task_Manager SHALL enforce authentication on all task API endpoints so that unauthenticated requests return HTTP 401.
6. THE Task_Manager SHALL enforce ownership checks on all task mutation endpoints (update, delete, archive) so that a student cannot modify another student's tasks, returning HTTP 403 if violated.

---

### Requirement 15: User Experience — Task Creation and Editing

**User Story:** As a student, I want a clean, intuitive form to create and edit tasks, so that adding a new learning item takes minimal effort.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a task creation form with the following sections: Basic Info (title, task type, priority, status), Schedule (due date, due time, estimated duration, recurrence), Link (link type selector, internal link target, external URL), Details (course, category, description, personal notes, tags), and Attachments.
2. WHEN a student opens the task creation form, THE Task_Manager SHALL auto-focus the title field.
3. WHEN a student submits the form with the Enter key while the title field is focused, THE Task_Manager SHALL save the task with only the title if no other fields are filled.
4. THE Task_Manager SHALL display an inline preview of the Link_Preview card in the creation form WHEN a valid External_URL is entered and focus leaves the URL input.
5. THE Task_Manager SHALL provide tag auto-complete suggestions based on tags the student has previously used.
6. WHEN a student saves a task successfully, THE Task_Manager SHALL display a brief success notification and return focus to the task list.
