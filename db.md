Project event_survey_relational_database {
  database_type: 'PostgreSQL'
  Note: '''
    Relational database model for Event & Survey Management Platform.
    Baseline: SRS Draft v2.1.0 — 22 October 2026.

    This is a future production persistence model. The current Frontend MVP still
    uses json-server Seed Data and Client Memory. Form answers are normalized into
    typed rows so Dashboard, filtering, export, and aggregation do not need to query
    dynamic JSON keys. No Clone Event or Clone Form feature is included.
  '''
}

// READING ORDER
// 01 USERS & ACCESS -> 02 EVENTS -> 03 FORM DEFINITIONS
// -> 04 WHITELIST -> 05 SUBMISSIONS & ANSWERS -> 06 GOVERNANCE
//
// Main participant data path:
// forms -> form_submissions -> submission_answers -> answer_option_selections
// Registration submissions additionally have one registrations row.
// Survey submissions are identified by forms.type = survey.

////////////////////////////////////////////////////
// ENUMS
////////////////////////////////////////////////////

Enum system_role {
  platform_admin
}

Enum account_status {
  invited
  active
  suspended
  removed
}

Enum event_member_role {
  event_admin
  event_sub_user
}

Enum event_status {
  draft
  pending_approval
  published
  closed
  archived
}

Enum form_type {
  registration
  survey
}

Enum form_status {
  draft
  pending_approval
  approved
  rejected
  published
  paused
  closed
  archived
}

Enum field_type {
  short_text
  long_text
  radio
  checkbox
  dropdown
  date
  time
  number
  rating
}

Enum submission_status {
  submitted
  soft_deleted
}

Enum whitelist_entry_status {
  available
  used
  revoked
}

Enum approval_target_type {
  event
  registration_form
  survey_form
}

Enum approval_status {
  pending
  approved
  rejected
  cancelled
}

Enum trash_resource_type {
  event
  form
  form_field
  field_option
  whitelist_entry
  registration
}

Enum deletion_request_status {
  pending
  approved
  rejected
  completed
}

////////////////////////////////////////////////////
// 01 · IDENTITY & EVENT-SCOPED ACCESS
////////////////////////////////////////////////////

Table users [headercolor: #2563EB] {
  id uuid [pk]
  email varchar(320) [not null, unique]
  display_name varchar(160) [not null]
  system_role system_role [not null, default: 'event_user']
  event_id uuid [ref: > events.id]
  event_role event_member_role

  can_manage_dashboard boolean [not null, default: false]
  can_manage_event boolean [not null, default: false]
  can_manage_registration_form boolean [not null, default: false]
  can_manage_survey_form boolean [not null, default: false]
  can_manage_sub_user boolean [not null, default: false]
  can_approve boolean [not null, default: false]
  can_view_unmasked_pii boolean [not null, default: false]

  permission_granted_by_user_id uuid [ref: > users.id]
  permission_updated_at timestamptz
  status account_status [not null, default: 'invited']
  invited_by_user_id uuid [ref: > users.id]
  joined_at timestamptz
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  removed_at timestamptz

  indexes {
    (event_id, event_role, status)
  }

  Note: '''
    Only administrative users have accounts. Participants never require an account.
    Platform Admin has event_id and event_role set to null. Event Admin and Event
    Sub-User store their Event, Event role, and seven permissions directly in this table.
    One account belongs to one Event; another Event requires another account.
    can_view_unmasked_pii covers both screen access and unmasked export.
  '''
}

////////////////////////////////////////////////////
// 02 · EVENT & LOCALIZED CONTENT
////////////////////////////////////////////////////

Table events [headercolor: #7C3AED] {
  id uuid [pk]
  slug varchar(160) [not null, unique]
  status event_status [not null, default: 'draft']
  default_locale varchar(35) [not null, default: 'th']
  language_rotation_seconds int
  starts_at timestamptz
  ends_at timestamptz
  timezone varchar(80) [not null, default: 'Asia/Bangkok']
  banner_url varchar(2048)
  banner_aspect_ratio varchar(8) [not null, default: '3:4']
  created_by_user_id uuid [not null, ref: > users.id]
  published_at timestamptz
  closed_at timestamptz
  archived_at timestamptz
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  deleted_at timestamptz

  indexes {
    (status, starts_at)
    (status, ends_at)
  }

  Note: '''
    Slug and published content are immutable after Publish. Closed stops Registration,
    while Survey may continue. Archived hides the Event and stops every Form.
    language_rotation_seconds accepts null, 30, 60, or 300.
  '''
}

Table event_translations [headercolor: #7C3AED] {
  id uuid [pk]
  event_id uuid [not null, ref: > events.id]
  locale_code varchar(35) [not null]
  title varchar(240) [not null]
  summary text
  description text
  venue_name varchar(240)
  address_text text
  created_at timestamptz [not null]
  updated_at timestamptz [not null]

  indexes {
    (event_id, locale_code) [unique]
  }

  Note: 'Rows define the enabled content languages. Application UI languages remain Thai and English.'
}

////////////////////////////////////////////////////
// 03 · FORM BUILDER
////////////////////////////////////////////////////

Table forms [headercolor: #8B5CF6] {
  id uuid [pk]
  event_id uuid [not null, ref: > events.id]
  type form_type [not null]
  status form_status [not null, default: 'draft']
  opens_at timestamptz
  closes_at timestamptz
  accepting_responses boolean [not null, default: false]
  created_by_user_id uuid [not null, ref: > users.id]
  updated_by_user_id uuid [not null, ref: > users.id]
  published_at timestamptz
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  deleted_at timestamptz

  indexes {
    (event_id, type) [unique]
    (event_id, status)
    (opens_at, closes_at)
  }

  Note: '''
    One Registration Form and one Survey Form per Event. Registration and Survey are
    independent. A published Form may pause intake but its definition cannot be edited.
  '''
}

Table form_translations [headercolor: #8B5CF6] {
  id uuid [pk]
  form_id uuid [not null, ref: > forms.id]
  locale_code varchar(35) [not null]
  title varchar(240) [not null]
  description text
  submit_button_label varchar(120)
  success_message text
  created_at timestamptz [not null]
  updated_at timestamptz [not null]

  indexes {
    (form_id, locale_code) [unique]
  }
}

Table form_fields [headercolor: #8B5CF6] {
  id uuid [pk]
  form_id uuid [not null, ref: > forms.id]
  field_key varchar(100) [not null]
  type field_type [not null]
  display_order int [not null]
  is_required boolean [not null, default: false]
  contains_pii boolean [not null, default: false]
  min_number decimal
  max_number decimal
  min_length int
  max_length int
  validation_pattern varchar(500)
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  deleted_at timestamptz

  indexes {
    (form_id, field_key) [unique]
    (form_id, display_order) [unique]
    (form_id, type)
  }

  Note: 'Participant fields exclude File Upload. File Upload is used only for Whitelist import by Event Admin.'
}

Table field_translations [headercolor: #8B5CF6] {
  id uuid [pk]
  field_id uuid [not null, ref: > form_fields.id]
  locale_code varchar(35) [not null]
  label varchar(500) [not null]
  help_text text
  placeholder varchar(500)
  validation_message text

  indexes {
    (field_id, locale_code) [unique]
  }
}

Table field_options [headercolor: #8B5CF6] {
  id uuid [pk]
  field_id uuid [not null, ref: > form_fields.id]
  option_key varchar(120) [not null]
  display_order int [not null]
  created_at timestamptz [not null]
  deleted_at timestamptz

  indexes {
    (field_id, option_key) [unique]
    (field_id, display_order) [unique]
  }
}

Table field_option_translations [headercolor: #8B5CF6] {
  id uuid [pk]
  option_id uuid [not null, ref: > field_options.id]
  locale_code varchar(35) [not null]
  label varchar(240) [not null]

  indexes {
    (option_id, locale_code) [unique]
  }
}

Table registration_settings [headercolor: #8B5CF6] {
  form_id uuid [pk, ref: - forms.id]
  capacity int
  duplicate_check_enabled boolean [not null, default: false]
  unique_field_id uuid [ref: > form_fields.id]
  whitelist_enabled boolean [not null, default: false]

  Note: '''
    Registration Form only. Null capacity means unlimited. Duplicate and Whitelist
    checks require a Unique Field configured from the same Form. Duplicate checking
    reads submission_answers where field_id equals unique_field_id.
  '''
}

////////////////////////////////////////////////////
// 04 · WHITELIST
////////////////////////////////////////////////////

Table whitelist_entries [headercolor: #D97706] {
  id uuid [pk]
  registration_form_id uuid [not null, ref: > forms.id]
  normalized_unique_value varchar(500) [not null]
  invitation_code varchar(6)
  status whitelist_entry_status [not null, default: 'available']
  used_at timestamptz
  created_at timestamptz [not null]
  deleted_at timestamptz

  indexes {
    (registration_form_id, normalized_unique_value) [unique]
    (registration_form_id, invitation_code) [unique]
    (registration_form_id, status)
  }

  Note: '''
    Invitation code is optional and contains 4-6 random digits. Whitelist upload files
    are transient and are never retained. Validation failure leaves the current list
    unchanged. After confirmation, unused current entries are replaced by the uploaded
    values. Entries already used by Registrations remain only to preserve references
    and are excluded from the active eligibility list. Import history is not retained.
  '''
}

////////////////////////////////////////////////////
// 05 · SUBMISSIONS & NORMALIZED ANSWERS
////////////////////////////////////////////////////

Table form_submissions [headercolor: #059669] {
  id uuid [pk]
  form_id uuid [not null, ref: > forms.id]
  status submission_status [not null, default: 'submitted']
  submitted_language varchar(35)
  submitted_at timestamptz [not null]
  deleted_by_user_id uuid [ref: > users.id]
  deleted_at timestamptz

  indexes {
    (form_id, submitted_at)
    (form_id, status, submitted_at)
    (deleted_at)
  }

  Note: '''
    Shared submission header for Registration and Survey. Registration submissions
    additionally have one registrations row. Survey submissions are identified through
    forms.type = survey and require no subtype table.
  '''
}

Table registrations [headercolor: #D97706] {
  submission_id uuid [pk, ref: - form_submissions.id]
  whitelist_entry_id uuid [unique, ref: > whitelist_entries.id]
  reference_code varchar(6) [not null]

  indexes {
    (reference_code)
  }

  Note: '''
    Registration is never anonymous. A deleted Registration cannot be restored,
    releases its Whitelist entry, and does not consume Capacity. Deletion status
    is read from form_submissions.status to avoid duplicate state columns.
  '''
}

Table submission_answers [headercolor: #059669] {
  id uuid [pk]
  submission_id uuid [not null, ref: > form_submissions.id]
  field_id uuid [not null, ref: > form_fields.id]
  value_text text
  value_number decimal
  value_boolean boolean
  value_date date
  value_time time
  created_at timestamptz [not null]

  indexes {
    (submission_id, field_id) [unique]
    (field_id, value_number)
    (field_id, value_date)
    (field_id, value_boolean)
  }

  Note: '''
    Use exactly one typed value column according to form_fields.type. Radio, Dropdown,
    and Checkbox values are stored in answer_option_selections instead of text.
    This structure is the primary source for Dashboard aggregation and Export.
  '''
}

Table answer_option_selections [headercolor: #059669] {
  answer_id uuid [not null, ref: > submission_answers.id]
  option_id uuid [not null, ref: > field_options.id]

  indexes {
    (answer_id, option_id) [pk]
    (option_id, answer_id)
  }

  Note: 'One row for Radio/Dropdown; multiple rows for Checkbox.'
}

////////////////////////////////////////////////////
// 06 · APPROVAL, EXPORT & GOVERNANCE
////////////////////////////////////////////////////

Table approval_requests [headercolor: #0F766E] {
  id uuid [pk]
  event_id uuid [not null, ref: > events.id]
  target_type approval_target_type [not null]
  target_id uuid [not null]
  requested_by_user_id uuid [not null, ref: > users.id]
  reviewed_by_user_id uuid [ref: > users.id]
  status approval_status [not null, default: 'pending']
  reviewer_note text
  requested_at timestamptz [not null]
  reviewed_at timestamptz

  indexes {
    (target_type, target_id, status)
    (event_id, status)
  }

  Note: 'A member with Approve permission may review their own Event or Form.'
}

Table trash_items [headercolor: #DC2626] {
  id uuid [pk]
  event_id uuid [not null, ref: > events.id]
  resource_type trash_resource_type [not null]
  resource_id uuid [not null]
  display_name varchar(500) [not null]
  deleted_by_user_id uuid [not null, ref: > users.id]
  deleted_at timestamptz [not null]
  restore_allowed boolean [not null, default: true]
  restored_by_user_id uuid [ref: > users.id]
  restored_at timestamptz

  indexes {
    (resource_type, resource_id) [unique]
    (event_id, deleted_at)
  }

  Note: 'All soft-deleted business resources appear in Trash. Registration has restore_allowed=false.'
}

Table hard_delete_requests [headercolor: #DC2626] {
  id uuid [pk]
  event_id uuid [not null, ref: > events.id]
  resource_type trash_resource_type [not null]
  resource_id uuid [not null]
  reason text [not null]
  requested_by_user_id uuid [not null, ref: > users.id]
  reviewed_by_user_id uuid [ref: > users.id]
  status deletion_request_status [not null, default: 'pending']
  requested_at timestamptz [not null]
  reviewed_at timestamptz
  completed_at timestamptz

  indexes {
    (event_id, status)
    (resource_type, resource_id, status)
  }

  Note: '''
    Only Platform Admin may approve. PDPA deletion removes all affected submitted
    data; Registration is not converted to an anonymous Registration.
  '''
}

Table audit_logs [headercolor: #DC2626] {
  id uuid [pk]
  event_id uuid [ref: > events.id]
  actor_user_id uuid [ref: > users.id]
  action varchar(160) [not null]
  resource_type varchar(100) [not null]
  resource_id uuid
  description text
  includes_unmasked_pii boolean [not null, default: false]
  occurred_at timestamptz [not null]

  indexes {
    (event_id, occurred_at)
    (actor_user_id, occurred_at)
    (resource_type, resource_id, occurred_at)
  }

  Note: 'Audit data must not copy participant answers or PII values.'
}

////////////////////////////////////////////////////
// TABLE GROUPS FOR DBDIAGRAM.IO
////////////////////////////////////////////////////

TableGroup group_01_users_access [color: #2563EB, note: 'Start here: administrative accounts, Event assignment, roles, and seven permissions.'] {
  users
}

TableGroup group_02_events_content [color: #7C3AED, note: 'Event lifecycle and localized public content.'] {
  events
  event_translations
}

TableGroup group_03_form_definitions [color: #8B5CF6, note: 'Form structure, translations, fields, options, and Registration configuration.'] {
  forms
  form_translations
  form_fields
  field_translations
  field_options
  field_option_translations
  registration_settings
}

TableGroup group_04_whitelist [color: #D97706, note: 'Current Registration eligibility; confirmed uploads replace the existing entries.'] {
  whitelist_entries
}

TableGroup group_05_submissions_answers [color: #059669, note: 'Participant submissions and normalized answer rows used by Dashboard and Export.'] {
  form_submissions
  registrations
  submission_answers
  answer_option_selections
}

TableGroup group_06_governance [color: #DC2626, note: 'Approval, Trash, permanent deletion requests, and audit evidence. Export is derived without persistence.'] {
  approval_requests
  trash_items
  hard_delete_requests
  audit_logs
}

Note dashboard_design [color: #DBEAFE] {
  '''
    DASHBOARD DATA FLOW

    1. Filter form_submissions by forms.event_id, form_id, status, and submitted_at.
    2. Join submission_answers with form_fields.
    3. Join answer_option_selections with field_options for choice questions.
    4. Aggregate by field type:
       - number/rating: COUNT, AVG, MIN, MAX
       - radio/dropdown/checkbox: COUNT and percentage by option_id
       - date/time: group by date or time range
       - text: count and detail table
    5. Exclude soft-deleted submissions and enforce masked/unmasked PII in the service layer.

    Dashboard, CSV/XLSX export files, QR URLs, Event routes, and aggregate results
    are derived features. They do not require separate source-of-truth tables.
    Unmasked export requires can_view_unmasked_pii.

    REGISTRATION DUPLICATE CHECK
    Normalize the submitted value of registration_settings.unique_field_id and compare
    it with submission_answers for active Registration submissions of the same Form.
  '''
}
