"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const now = "2026-10-24T10:00:00Z";
const ts = (iso) => iso;

// Deterministic UUIDs so `npm run seed` stays stable across runs.
function uuid(seed) {
  const hash = crypto.createHash("sha1").update(String(seed)).digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const ids = {
  users: {
    platformAdmin: uuid("users.platformAdmin"),
    eventAdmin1: uuid("users.eventAdmin1"),
    subUser1: uuid("users.subUser1"),
    eventAdmin2: uuid("users.eventAdmin2"),
    eventAdmin3: uuid("users.eventAdmin3"),
  },
  events: {
    tech: uuid("events.tech"),
    wellness: uuid("events.wellness"),
    draft: uuid("events.draft"),
  },
  forms: {
    techReg: uuid("forms.techReg"),
    techSurvey: uuid("forms.techSurvey"),
    wellnessReg: uuid("forms.wellnessReg"),
    wellnessSurvey: uuid("forms.wellnessSurvey"),
    draftReg: uuid("forms.draftReg"),
  },
  fields: {
    techFullName: uuid("fields.techFullName"),
    techEmail: uuid("fields.techEmail"),
    techEmployee: uuid("fields.techEmployee"),
    techTrack: uuid("fields.techTrack"),
    techTopics: uuid("fields.techTopics"),
    techShirt: uuid("fields.techShirt"),
    techRating: uuid("fields.techRating"),
    techRecommend: uuid("fields.techRecommend"),
    techFeedback: uuid("fields.techFeedback"),
    techNps: uuid("fields.techNps"),
    wellFullName: uuid("fields.wellFullName"),
    wellEmail: uuid("fields.wellEmail"),
    wellActivity: uuid("fields.wellActivity"),
    wellDate: uuid("fields.wellDate"),
    wellEnergy: uuid("fields.wellEnergy"),
    wellComment: uuid("fields.wellComment"),
    draftFullName: uuid("fields.draftFullName"),
  },
  options: {
    trackAi: uuid("options.trackAi"),
    trackWeb: uuid("options.trackWeb"),
    trackCloud: uuid("options.trackCloud"),
    topicSecurity: uuid("options.topicSecurity"),
    topicData: uuid("options.topicData"),
    topicProduct: uuid("options.topicProduct"),
    shirtS: uuid("options.shirtS"),
    shirtM: uuid("options.shirtM"),
    shirtL: uuid("options.shirtL"),
    shirtXl: uuid("options.shirtXl"),
    recYes: uuid("options.recYes"),
    recMaybe: uuid("options.recMaybe"),
    recNo: uuid("options.recNo"),
    actYoga: uuid("options.actYoga"),
    actRun: uuid("options.actRun"),
    actNutrition: uuid("options.actNutrition"),
  },
  whitelist: {
    emp001: uuid("whitelist.emp001"),
    emp002: uuid("whitelist.emp002"),
    emp003: uuid("whitelist.emp003"),
    emp004: uuid("whitelist.emp004"),
    emp005: uuid("whitelist.emp005"),
  },
  submissions: {
    techReg1: uuid("submissions.techReg1"),
    techReg2: uuid("submissions.techReg2"),
    techReg3: uuid("submissions.techReg3"),
    wellReg1: uuid("submissions.wellReg1"),
    wellReg2: uuid("submissions.wellReg2"),
    techSurvey1: uuid("submissions.techSurvey1"),
    techSurvey2: uuid("submissions.techSurvey2"),
    techSurvey3: uuid("submissions.techSurvey3"),
    wellSurvey1: uuid("submissions.wellSurvey1"),
  },
};

let nextFieldTrSeq = 1;
let nextOptionTrSeq = 1;
let nextAnswerSeq = 1;
let nextSelectionSeq = 1;

const form_fields = [];
const field_translations = [];
const field_options = [];
const field_option_translations = [];
const form_submissions = [];
const registrations = [];
const submission_answers = [];
const answer_option_selections = [];

function addField(def) {
  form_fields.push({
    id: def.id,
    form_id: def.form_id,
    field_key: def.field_key,
    type: def.type,
    display_order: def.display_order,
    is_required: def.is_required ?? false,
    contains_pii: def.contains_pii ?? false,
    min_number: def.min_number ?? null,
    max_number: def.max_number ?? null,
    min_length: def.min_length ?? null,
    max_length: def.max_length ?? null,
    validation_pattern: def.validation_pattern ?? null,
    created_at: def.created_at || now,
    updated_at: def.updated_at || now,
    deleted_at: null,
  });

  (def.translations || []).forEach((tr) => {
    field_translations.push({
      id: uuid(`field_translations.${nextFieldTrSeq++}`),
      field_id: def.id,
      locale_code: tr.locale_code,
      label: tr.label,
      help_text: tr.help_text ?? null,
      placeholder: tr.placeholder ?? null,
      validation_message: tr.validation_message ?? null,
    });
  });

  (def.options || []).forEach((opt) => {
    field_options.push({
      id: opt.id,
      field_id: def.id,
      option_key: opt.option_key,
      display_order: opt.display_order,
      created_at: now,
      deleted_at: null,
    });
    (opt.translations || []).forEach((tr) => {
      field_option_translations.push({
        id: uuid(`field_option_translations.${nextOptionTrSeq++}`),
        option_id: opt.id,
        locale_code: tr.locale_code,
        label: tr.label,
      });
    });
  });
}

function addTextAnswer(submissionId, fieldId, text) {
  const id = uuid(`submission_answers.${nextAnswerSeq++}`);
  submission_answers.push({
    id,
    submission_id: submissionId,
    field_id: fieldId,
    value_text: text,
    value_number: null,
    value_boolean: null,
    value_date: null,
    value_time: null,
    created_at: now,
  });
  return id;
}

function addNumberAnswer(submissionId, fieldId, number) {
  const id = uuid(`submission_answers.${nextAnswerSeq++}`);
  submission_answers.push({
    id,
    submission_id: submissionId,
    field_id: fieldId,
    value_text: null,
    value_number: number,
    value_boolean: null,
    value_date: null,
    value_time: null,
    created_at: now,
  });
  return id;
}

function addDateAnswer(submissionId, fieldId, date) {
  const id = uuid(`submission_answers.${nextAnswerSeq++}`);
  submission_answers.push({
    id,
    submission_id: submissionId,
    field_id: fieldId,
    value_text: null,
    value_number: null,
    value_boolean: null,
    value_date: date,
    value_time: null,
    created_at: now,
  });
  return id;
}

function addChoiceAnswer(submissionId, fieldId, optionIds) {
  const id = uuid(`submission_answers.${nextAnswerSeq++}`);
  submission_answers.push({
    id,
    submission_id: submissionId,
    field_id: fieldId,
    value_text: null,
    value_number: null,
    value_boolean: null,
    value_date: null,
    value_time: null,
    created_at: now,
  });
  optionIds.forEach((optionId) => {
    answer_option_selections.push({
      id: uuid(`answer_option_selections.${nextSelectionSeq++}`),
      answer_id: id,
      option_id: optionId,
    });
  });
  return id;
}

const users = [
  {
    id: ids.users.platformAdmin,
    email: "admin@example.com",
    display_name: "Ananda Platform Admin",
    system_role: "platform_admin",
    event_id: null,
    event_role: null,
    can_manage_dashboard: true,
    can_manage_event: true,
    can_manage_registration_form: true,
    can_manage_survey_form: true,
    can_manage_sub_user: true,
    can_approve: true,
    can_view_unmasked_pii: true,
    permission_granted_by_user_id: null,
    permission_updated_at: null,
    status: "active",
    invited_by_user_id: null,
    joined_at: ts("2026-09-01T02:00:00Z"),
    created_at: ts("2026-09-01T02:00:00Z"),
    updated_at: ts("2026-09-01T02:00:00Z"),
    removed_at: null,
  },
  {
    id: ids.users.eventAdmin1,
    email: "thanawat@example.com",
    display_name: "Thanawat Ketaya",
    system_role: "event_user",
    event_id: ids.events.tech,
    event_role: "event_admin",
    can_manage_dashboard: true,
    can_manage_event: true,
    can_manage_registration_form: true,
    can_manage_survey_form: true,
    can_manage_sub_user: true,
    can_approve: true,
    can_view_unmasked_pii: true,
    permission_granted_by_user_id: ids.users.platformAdmin,
    permission_updated_at: ts("2026-09-15T04:00:00Z"),
    status: "active",
    invited_by_user_id: ids.users.platformAdmin,
    joined_at: ts("2026-09-02T02:00:00Z"),
    created_at: ts("2026-09-02T02:00:00Z"),
    updated_at: ts("2026-09-15T04:00:00Z"),
    removed_at: null,
  },
  {
    id: ids.users.subUser1,
    email: "kittisak@example.com",
    display_name: "Kittisak Jaidee",
    system_role: "event_user",
    event_id: ids.events.tech,
    event_role: "event_sub_user",
    can_manage_dashboard: true,
    can_manage_event: false,
    can_manage_registration_form: true,
    can_manage_survey_form: true,
    can_manage_sub_user: false,
    can_approve: false,
    can_view_unmasked_pii: false,
    permission_granted_by_user_id: ids.users.eventAdmin1,
    permission_updated_at: ts("2026-09-16T03:00:00Z"),
    status: "active",
    invited_by_user_id: ids.users.eventAdmin1,
    joined_at: ts("2026-09-10T02:00:00Z"),
    created_at: ts("2026-09-10T02:00:00Z"),
    updated_at: ts("2026-09-16T03:00:00Z"),
    removed_at: null,
  },
  {
    id: ids.users.eventAdmin2,
    email: "mali@example.com",
    display_name: "Mali Charoenpol",
    system_role: "event_user",
    event_id: ids.events.wellness,
    event_role: "event_admin",
    can_manage_dashboard: true,
    can_manage_event: true,
    can_manage_registration_form: true,
    can_manage_survey_form: true,
    can_manage_sub_user: true,
    can_approve: true,
    can_view_unmasked_pii: false,
    permission_granted_by_user_id: ids.users.platformAdmin,
    permission_updated_at: ts("2026-09-20T04:00:00Z"),
    status: "active",
    invited_by_user_id: ids.users.platformAdmin,
    joined_at: ts("2026-09-03T02:00:00Z"),
    created_at: ts("2026-09-03T02:00:00Z"),
    updated_at: ts("2026-09-20T04:00:00Z"),
    removed_at: null,
  },
  {
    id: ids.users.eventAdmin3,
    email: "pim@example.com",
    display_name: "Pimchanok Siriwong",
    system_role: "event_user",
    event_id: ids.events.draft,
    event_role: "event_admin",
    can_manage_dashboard: true,
    can_manage_event: true,
    can_manage_registration_form: true,
    can_manage_survey_form: true,
    can_manage_sub_user: true,
    can_approve: true,
    can_view_unmasked_pii: true,
    permission_granted_by_user_id: ids.users.platformAdmin,
    permission_updated_at: ts("2026-10-01T04:00:00Z"),
    status: "active",
    invited_by_user_id: ids.users.platformAdmin,
    joined_at: ts("2026-10-01T02:00:00Z"),
    created_at: ts("2026-10-01T02:00:00Z"),
    updated_at: ts("2026-10-01T04:00:00Z"),
    removed_at: null,
  },
];

const events = [
  {
    id: ids.events.tech,
    slug: "tech-summit-2026",
    status: "published",
    default_locale: "th",
    language_rotation_seconds: 60,
    starts_at: ts("2026-11-15T01:00:00Z"),
    ends_at: ts("2026-11-15T10:00:00Z"),
    timezone: "Asia/Bangkok",
    banner_url: "https://cdn.example.com/banners/tech-summit-2026.jpg",
    banner_aspect_ratio: "3:4",
    created_by_user_id: ids.users.eventAdmin1,
    published_at: ts("2026-10-01T08:00:00Z"),
    closed_at: null,
    archived_at: null,
    created_at: ts("2026-09-15T03:00:00Z"),
    updated_at: ts("2026-10-01T08:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.events.wellness,
    slug: "wellness-day-2026",
    status: "published",
    default_locale: "th",
    language_rotation_seconds: 30,
    starts_at: ts("2026-12-05T02:00:00Z"),
    ends_at: ts("2026-12-05T09:00:00Z"),
    timezone: "Asia/Bangkok",
    banner_url: "https://cdn.example.com/banners/wellness-day-2026.jpg",
    banner_aspect_ratio: "3:4",
    created_by_user_id: ids.users.eventAdmin2,
    published_at: ts("2026-10-10T08:00:00Z"),
    closed_at: null,
    archived_at: null,
    created_at: ts("2026-09-20T03:00:00Z"),
    updated_at: ts("2026-10-10T08:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.events.draft,
    slug: "community-meetup-draft",
    status: "draft",
    default_locale: "th",
    language_rotation_seconds: null,
    starts_at: ts("2027-01-20T03:00:00Z"),
    ends_at: ts("2027-01-20T08:00:00Z"),
    timezone: "Asia/Bangkok",
    banner_url: null,
    banner_aspect_ratio: "3:4",
    created_by_user_id: ids.users.eventAdmin3,
    published_at: null,
    closed_at: null,
    archived_at: null,
    created_at: ts("2026-10-05T03:00:00Z"),
    updated_at: ts("2026-10-20T03:00:00Z"),
    deleted_at: null,
  },
];

const event_translations = [
  {    id: uuid("event_translations.1"),
    event_id: ids.events.tech,
    locale_code: "th",
    title: "เทคซัมมิต 2026",
    summary: "งานรวมตัวนักพัฒนาและผู้สนใจเทคโนโลยีในไทย",
    description:
      "ร่วมฟังบรรยาย อัปเดตเทรนด์ และเชื่อมต่อกับชุมชนนักพัฒนา ทั้ง AI, Web และ Cloud",
    venue_name: "ศูนย์ประชุมแห่งชาติสิริกิติ์",
    address_text: "60 ถนนรัชดาภิเษก คลองเตย กรุงเทพมหานคร 10110",
    created_at: ts("2026-09-15T03:00:00Z"),
    updated_at: ts("2026-10-01T08:00:00Z"),
  },
  {    id: uuid("event_translations.2"),
    event_id: ids.events.tech,
    locale_code: "en",
    title: "Tech Summit 2026",
    summary: "A gathering for developers and technology enthusiasts in Thailand",
    description:
      "Join talks, trend updates, and community networking across AI, Web, and Cloud.",
    venue_name: "Queen Sirikit National Convention Center",
    address_text: "60 Ratchadaphisek Road, Khlong Toei, Bangkok 10110",
    created_at: ts("2026-09-15T03:00:00Z"),
    updated_at: ts("2026-10-01T08:00:00Z"),
  },
  {    id: uuid("event_translations.3"),
    event_id: ids.events.wellness,
    locale_code: "th",
    title: "วันสุขภาพองค์กร 2026",
    summary: "กิจกรรมสุขภาพและสมดุลชีวิตสำหรับพนักงาน",
    description: "เวิร์กช็อปโยคะ โภชนาการ และการจัดการความเครียดในที่ทำงาน",
    venue_name: "สวนลุมพินี",
    address_text: "ถนนราชดำริ ปทุมวัน กรุงเทพมหานคร 10330",
    created_at: ts("2026-09-20T03:00:00Z"),
    updated_at: ts("2026-10-10T08:00:00Z"),
  },
  {    id: uuid("event_translations.4"),
    event_id: ids.events.wellness,
    locale_code: "en",
    title: "Corporate Wellness Day 2026",
    summary: "Health and work-life balance activities for employees",
    description: "Workshops on yoga, nutrition, and workplace stress management.",
    venue_name: "Lumphini Park",
    address_text: "Ratchadamri Road, Pathum Wan, Bangkok 10330",
    created_at: ts("2026-09-20T03:00:00Z"),
    updated_at: ts("2026-10-10T08:00:00Z"),
  },
  {    id: uuid("event_translations.5"),
    event_id: ids.events.draft,
    locale_code: "th",
    title: "มีตอัปชุมชน (ร่าง)",
    summary: "ร่างอีเวนต์สำหรับทดสอบสถานะ draft",
    description: "รายละเอียดยังไม่เผยแพร่",
    venue_name: "Co-working Space ย่านอารีย์",
    address_text: "พหลโยธิน กรุงเทพมหานคร",
    created_at: ts("2026-10-05T03:00:00Z"),
    updated_at: ts("2026-10-20T03:00:00Z"),
  },
  {    id: uuid("event_translations.6"),
    event_id: ids.events.draft,
    locale_code: "en",
    title: "Community Meetup (Draft)",
    summary: "Draft event used for testing draft status",
    description: "Details are not published yet.",
    venue_name: "Ari Co-working Space",
    address_text: "Phahonyothin, Bangkok",
    created_at: ts("2026-10-05T03:00:00Z"),
    updated_at: ts("2026-10-20T03:00:00Z"),
  },
];

const forms = [
  {
    id: ids.forms.techReg,
    event_id: ids.events.tech,
    type: "registration",
    status: "published",
    opens_at: ts("2026-10-01T08:00:00Z"),
    closes_at: ts("2026-11-14T17:00:00Z"),
    accepting_responses: true,
    created_by_user_id: ids.users.eventAdmin1,
    updated_by_user_id: ids.users.eventAdmin1,
    published_at: ts("2026-10-01T08:00:00Z"),
    created_at: ts("2026-09-16T04:00:00Z"),
    updated_at: ts("2026-10-01T08:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.forms.techSurvey,
    event_id: ids.events.tech,
    type: "survey",
    status: "published",
    opens_at: ts("2026-11-15T10:00:00Z"),
    closes_at: ts("2026-11-30T17:00:00Z"),
    accepting_responses: true,
    created_by_user_id: ids.users.eventAdmin1,
    updated_by_user_id: ids.users.subUser1,
    published_at: ts("2026-10-01T08:10:00Z"),
    created_at: ts("2026-09-16T05:00:00Z"),
    updated_at: ts("2026-10-01T08:10:00Z"),
    deleted_at: null,
  },
  {
    id: ids.forms.wellnessReg,
    event_id: ids.events.wellness,
    type: "registration",
    status: "published",
    opens_at: ts("2026-10-10T08:00:00Z"),
    closes_at: ts("2026-12-04T17:00:00Z"),
    accepting_responses: true,
    created_by_user_id: ids.users.eventAdmin2,
    updated_by_user_id: ids.users.eventAdmin2,
    published_at: ts("2026-10-10T08:00:00Z"),
    created_at: ts("2026-09-21T04:00:00Z"),
    updated_at: ts("2026-10-10T08:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.forms.wellnessSurvey,
    event_id: ids.events.wellness,
    type: "survey",
    status: "published",
    opens_at: ts("2026-12-05T09:00:00Z"),
    closes_at: ts("2026-12-20T17:00:00Z"),
    accepting_responses: true,
    created_by_user_id: ids.users.eventAdmin2,
    updated_by_user_id: ids.users.eventAdmin2,
    published_at: ts("2026-10-10T08:10:00Z"),
    created_at: ts("2026-09-21T05:00:00Z"),
    updated_at: ts("2026-10-10T08:10:00Z"),
    deleted_at: null,
  },
  {
    id: ids.forms.draftReg,
    event_id: ids.events.draft,
    type: "registration",
    status: "draft",
    opens_at: null,
    closes_at: null,
    accepting_responses: false,
    created_by_user_id: ids.users.eventAdmin3,
    updated_by_user_id: ids.users.eventAdmin3,
    published_at: null,
    created_at: ts("2026-10-06T04:00:00Z"),
    updated_at: ts("2026-10-20T04:00:00Z"),
    deleted_at: null,
  },
];

const form_translations = [
  {    id: uuid("form_translations.1"),
    form_id: ids.forms.techReg,
    locale_code: "th",
    title: "ลงทะเบียน Tech Summit 2026",
    description: "กรอกข้อมูลเพื่อรับบัตรเข้างาน",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.2"),
    form_id: ids.forms.techReg,
    locale_code: "en",
    title: "Register for Tech Summit 2026",
    description: "Fill in your details to receive an event ticket.",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.3"),
    form_id: ids.forms.techSurvey,
    locale_code: "th",
    title: "แบบสอบถามหลังงาน Tech Summit",
    description: "ช่วยให้คะแนนและข้อเสนอแนะหลังเข้าร่วมงาน",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.4"),
    form_id: ids.forms.techSurvey,
    locale_code: "en",
    title: "Tech Summit Post-Event Survey",
    description: "Please rate the event and share feedback.",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.5"),
    form_id: ids.forms.wellnessReg,
    locale_code: "th",
    title: "ลงทะเบียนวันสุขภาพองค์กร",
    description: "จองที่นั่งสำหรับกิจกรรมสุขภาพ",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.6"),
    form_id: ids.forms.wellnessReg,
    locale_code: "en",
    title: "Wellness Day Registration",
    description: "Reserve your spot for wellness activities.",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.7"),
    form_id: ids.forms.wellnessSurvey,
    locale_code: "th",
    title: "แบบสอบถามวันสุขภาพ",
    description: "ประเมินกิจกรรมและสุขภาพโดยรวม",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.8"),
    form_id: ids.forms.wellnessSurvey,
    locale_code: "en",
    title: "Wellness Day Survey",
    description: "Rate the activities and your overall wellness experience.",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.9"),
    form_id: ids.forms.draftReg,
    locale_code: "th",
    title: "ลงทะเบียนมีตอัป (ร่าง)",
    description: "ฟอร์มยังไม่เผยแพร่",    created_at: now,
    updated_at: now,
  },
  {    id: uuid("form_translations.10"),
    form_id: ids.forms.draftReg,
    locale_code: "en",
    title: "Meetup Registration (Draft)",
    description: "This form is not published yet.",    created_at: now,
    updated_at: now,
  },
];

addField({
  id: ids.fields.techFullName,
  form_id: ids.forms.techReg,
  field_key: "full_name",
  type: "short_text",
  display_order: 1,
  is_required: true,
  contains_pii: true,
  max_length: 160,
  translations: [
    {
      locale_code: "th",
      label: "ชื่อ-นามสกุล",
      help_text: "ใช้ชื่อจริงตามบัตร",
      placeholder: "เช่น สมชาย ใจดี",
      validation_message: "กรุณากรอกชื่อ-นามสกุล",
    },
    {
      locale_code: "en",
      label: "Full name",
      help_text: "Use your legal name",
      placeholder: "e.g. Somchai Jaidee",
      validation_message: "Please enter your full name",
    },
  ],
});

addField({
  id: ids.fields.techEmail,
  form_id: ids.forms.techReg,
  field_key: "email",
  type: "short_text",
  display_order: 2,
  is_required: true,
  contains_pii: true,
  max_length: 320,
  validation_pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
  translations: [
    {
      locale_code: "th",
      label: "อีเมล",
      help_text: "ใช้สำหรับส่งบัตรเข้างาน",
      placeholder: "you@example.com",
      validation_message: "รูปแบบอีเมลไม่ถูกต้อง",
    },
    {
      locale_code: "en",
      label: "Email",
      help_text: "Used to send your ticket",
      placeholder: "you@example.com",
      validation_message: "Invalid email format",
    },
  ],
});

addField({
  id: ids.fields.techEmployee,
  form_id: ids.forms.techReg,
  field_key: "employee_id",
  type: "short_text",
  display_order: 3,
  is_required: true,
  contains_pii: true,
  max_length: 40,
  translations: [
    {
      locale_code: "th",
      label: "รหัสพนักงาน",
      help_text: "ต้องอยู่ในรายชื่อ whitelist",
      placeholder: "EMP001",
      validation_message: "กรุณากรอกรหัสพนักงาน",
    },
    {
      locale_code: "en",
      label: "Employee ID",
      help_text: "Must exist in the whitelist",
      placeholder: "EMP001",
      validation_message: "Please enter your employee ID",
    },
  ],
});

addField({
  id: ids.fields.techTrack,
  form_id: ids.forms.techReg,
  field_key: "interest_track",
  type: "radio",
  display_order: 4,
  is_required: true,
  translations: [
    {
      locale_code: "th",
      label: "แทร็กที่สนใจ",
      help_text: "เลือก 1 แทร็ก",
      validation_message: "กรุณาเลือกแทร็ก",
    },
    {
      locale_code: "en",
      label: "Interest track",
      help_text: "Choose one track",
      validation_message: "Please select a track",
    },
  ],
  options: [
    {
      id: ids.options.trackAi,
      option_key: "ai",
      display_order: 1,
      translations: [
        { locale_code: "th", label: "ปัญญาประดิษฐ์" },
        { locale_code: "en", label: "Artificial Intelligence" },
      ],
    },
    {
      id: ids.options.trackWeb,
      option_key: "web",
      display_order: 2,
      translations: [
        { locale_code: "th", label: "เว็บและฟรอนต์เอนด์" },
        { locale_code: "en", label: "Web & Frontend" },
      ],
    },
    {
      id: ids.options.trackCloud,
      option_key: "cloud",
      display_order: 3,
      translations: [
        { locale_code: "th", label: "คลาวด์และเดฟออปส์" },
        { locale_code: "en", label: "Cloud & DevOps" },
      ],
    },
  ],
});

addField({
  id: ids.fields.techTopics,
  form_id: ids.forms.techReg,
  field_key: "topics",
  type: "checkbox",
  display_order: 5,
  translations: [
    {
      locale_code: "th",
      label: "หัวข้อที่อยากฟังเพิ่ม",
      help_text: "เลือกได้หลายข้อ",
    },
    {
      locale_code: "en",
      label: "Extra topics of interest",
      help_text: "Select all that apply",
    },
  ],
  options: [
    {
      id: ids.options.topicSecurity,
      option_key: "security",
      display_order: 1,
      translations: [
        { locale_code: "th", label: "ความปลอดภัย" },
        { locale_code: "en", label: "Security" },
      ],
    },
    {
      id: ids.options.topicData,
      option_key: "data",
      display_order: 2,
      translations: [
        { locale_code: "th", label: "ข้อมูลและการวิเคราะห์" },
        { locale_code: "en", label: "Data & Analytics" },
      ],
    },
    {
      id: ids.options.topicProduct,
      option_key: "product",
      display_order: 3,
      translations: [
        { locale_code: "th", label: "ผลิตภัณฑ์และ UX" },
        { locale_code: "en", label: "Product & UX" },
      ],
    },
  ],
});

addField({
  id: ids.fields.techShirt,
  form_id: ids.forms.techReg,
  field_key: "tshirt_size",
  type: "dropdown",
  display_order: 6,
  is_required: true,
  translations: [
    {
      locale_code: "th",
      label: "ขนาดเสื้อ",
      placeholder: "เลือกขนาด",
      validation_message: "กรุณาเลือกขนาดเสื้อ",
    },
    {
      locale_code: "en",
      label: "T-shirt size",
      placeholder: "Select a size",
      validation_message: "Please select a t-shirt size",
    },
  ],
  options: [
    {
      id: ids.options.shirtS,
      option_key: "s",
      display_order: 1,
      translations: [
        { locale_code: "th", label: "เอส (S)" },
        { locale_code: "en", label: "Small (S)" },
      ],
    },
    {
      id: ids.options.shirtM,
      option_key: "m",
      display_order: 2,
      translations: [
        { locale_code: "th", label: "เอ็ม (M)" },
        { locale_code: "en", label: "Medium (M)" },
      ],
    },
    {
      id: ids.options.shirtL,
      option_key: "l",
      display_order: 3,
      translations: [
        { locale_code: "th", label: "แอล (L)" },
        { locale_code: "en", label: "Large (L)" },
      ],
    },
    {
      id: ids.options.shirtXl,
      option_key: "xl",
      display_order: 4,
      translations: [
        { locale_code: "th", label: "เอ็กซ์แอล (XL)" },
        { locale_code: "en", label: "Extra Large (XL)" },
      ],
    },
  ],
});

addField({
  id: ids.fields.techRating,
  form_id: ids.forms.techSurvey,
  field_key: "overall_rating",
  type: "rating",
  display_order: 1,
  is_required: true,
  min_number: 1,
  max_number: 5,
  translations: [
    {
      locale_code: "th",
      label: "คะแนนความพึงพอใจโดยรวม",
      help_text: "1 = น้อยที่สุด, 5 = มากที่สุด",
      validation_message: "กรุณาให้คะแนน",
    },
    {
      locale_code: "en",
      label: "Overall satisfaction rating",
      help_text: "1 = lowest, 5 = highest",
      validation_message: "Please provide a rating",
    },
  ],
});

addField({
  id: ids.fields.techRecommend,
  form_id: ids.forms.techSurvey,
  field_key: "would_recommend",
  type: "radio",
  display_order: 2,
  is_required: true,
  translations: [
    {
      locale_code: "th",
      label: "จะแนะนำงานนี้ให้เพื่อนหรือไม่",
      validation_message: "กรุณาเลือกคำตอบ",
    },
    {
      locale_code: "en",
      label: "Would you recommend this event?",
      validation_message: "Please select an answer",
    },
  ],
  options: [
    {
      id: ids.options.recYes,
      option_key: "yes",
      display_order: 1,
      translations: [
        { locale_code: "th", label: "ใช่" },
        { locale_code: "en", label: "Yes" },
      ],
    },
    {
      id: ids.options.recMaybe,
      option_key: "maybe",
      display_order: 2,
      translations: [
        { locale_code: "th", label: "อาจจะ" },
        { locale_code: "en", label: "Maybe" },
      ],
    },
    {
      id: ids.options.recNo,
      option_key: "no",
      display_order: 3,
      translations: [
        { locale_code: "th", label: "ไม่" },
        { locale_code: "en", label: "No" },
      ],
    },
  ],
});

addField({
  id: ids.fields.techFeedback,
  form_id: ids.forms.techSurvey,
  field_key: "feedback",
  type: "long_text",
  display_order: 3,
  max_length: 2000,
  translations: [
    {
      locale_code: "th",
      label: "ข้อเสนอแนะเพิ่มเติม",
      help_text: "บอกสิ่งที่ชอบหรืออยากให้ปรับ",
      placeholder: "พิมพ์ความคิดเห็นของคุณ",
    },
    {
      locale_code: "en",
      label: "Additional feedback",
      help_text: "Tell us what you liked or what we should improve",
      placeholder: "Type your feedback",
    },
  ],
});

addField({
  id: ids.fields.techNps,
  form_id: ids.forms.techSurvey,
  field_key: "nps_score",
  type: "number",
  display_order: 4,
  is_required: true,
  min_number: 0,
  max_number: 10,
  translations: [
    {
      locale_code: "th",
      label: "คะแนน NPS (0-10)",
      help_text: "โอกาสที่คุณจะแนะนำงานนี้",
      placeholder: "8",
      validation_message: "กรอกตัวเลข 0 ถึง 10",
    },
    {
      locale_code: "en",
      label: "NPS score (0-10)",
      help_text: "Likelihood that you would recommend this event",
      placeholder: "8",
      validation_message: "Enter a number from 0 to 10",
    },
  ],
});

addField({
  id: ids.fields.wellFullName,
  form_id: ids.forms.wellnessReg,
  field_key: "full_name",
  type: "short_text",
  display_order: 1,
  is_required: true,
  contains_pii: true,
  translations: [
    {
      locale_code: "th",
      label: "ชื่อ-นามสกุล",
      placeholder: "ชื่อของคุณ",
      validation_message: "จำเป็นต้องกรอก",
    },
    {
      locale_code: "en",
      label: "Full name",
      placeholder: "Your name",
      validation_message: "Required",
    },
  ],
});

addField({
  id: ids.fields.wellEmail,
  form_id: ids.forms.wellnessReg,
  field_key: "email",
  type: "short_text",
  display_order: 2,
  is_required: true,
  contains_pii: true,
  translations: [
    {
      locale_code: "th",
      label: "อีเมล",
      placeholder: "you@company.com",
      validation_message: "รูปแบบอีเมลไม่ถูกต้อง",
    },
    {
      locale_code: "en",
      label: "Email",
      placeholder: "you@company.com",
      validation_message: "Invalid email format",
    },
  ],
});

addField({
  id: ids.fields.wellActivity,
  form_id: ids.forms.wellnessReg,
  field_key: "preferred_activity",
  type: "dropdown",
  display_order: 3,
  is_required: true,
  translations: [
    {
      locale_code: "th",
      label: "กิจกรรมที่สนใจ",
      placeholder: "เลือกกิจกรรม",
      validation_message: "กรุณาเลือกกิจกรรม",
    },
    {
      locale_code: "en",
      label: "Preferred activity",
      placeholder: "Choose an activity",
      validation_message: "Please choose an activity",
    },
  ],
  options: [
    {
      id: ids.options.actYoga,
      option_key: "yoga",
      display_order: 1,
      translations: [
        { locale_code: "th", label: "โยคะ" },
        { locale_code: "en", label: "Yoga" },
      ],
    },
    {
      id: ids.options.actRun,
      option_key: "running",
      display_order: 2,
      translations: [
        { locale_code: "th", label: "วิ่งเพื่อสุขภาพ" },
        { locale_code: "en", label: "Health run" },
      ],
    },
    {
      id: ids.options.actNutrition,
      option_key: "nutrition",
      display_order: 3,
      translations: [
        { locale_code: "th", label: "โภชนาการ" },
        { locale_code: "en", label: "Nutrition" },
      ],
    },
  ],
});

addField({
  id: ids.fields.wellDate,
  form_id: ids.forms.wellnessReg,
  field_key: "preferred_date",
  type: "date",
  display_order: 4,
  translations: [
    {
      locale_code: "th",
      label: "วันที่สะดวก (ถ้ามีรอบย่อย)",
    },
    {
      locale_code: "en",
      label: "Preferred date (if sessions vary)",
    },
  ],
});

addField({
  id: ids.fields.wellEnergy,
  form_id: ids.forms.wellnessSurvey,
  field_key: "energy_level",
  type: "rating",
  display_order: 1,
  is_required: true,
  min_number: 1,
  max_number: 5,
  translations: [
    {
      locale_code: "th",
      label: "ระดับพลังงานหลังกิจกรรม",
      validation_message: "กรุณาให้คะแนน",
    },
    {
      locale_code: "en",
      label: "Energy level after activities",
      validation_message: "Please rate",
    },
  ],
});

addField({
  id: ids.fields.wellComment,
  form_id: ids.forms.wellnessSurvey,
  field_key: "comment",
  type: "long_text",
  display_order: 2,
  translations: [
    {
      locale_code: "th",
      label: "ความคิดเห็น",
      placeholder: "พิมพ์ได้ที่นี่",
    },
    {
      locale_code: "en",
      label: "Comments",
      placeholder: "Type here",
    },
  ],
});

addField({
  id: ids.fields.draftFullName,
  form_id: ids.forms.draftReg,
  field_key: "full_name",
  type: "short_text",
  display_order: 1,
  is_required: true,
  contains_pii: true,
  translations: [
    { locale_code: "th", label: "ชื่อ" },
    { locale_code: "en", label: "Name" },
  ],
});

const registration_settings = [
  {
    id: ids.forms.techReg,
    form_id: ids.forms.techReg,
    capacity: 200,
    duplicate_check_enabled: true,
    unique_field_id: ids.fields.techEmployee,
    whitelist_enabled: true,
  },
  {
    id: ids.forms.wellnessReg,
    form_id: ids.forms.wellnessReg,
    capacity: 80,
    duplicate_check_enabled: true,
    unique_field_id: ids.fields.wellEmail,
    whitelist_enabled: false,
  },
  {
    id: ids.forms.draftReg,
    form_id: ids.forms.draftReg,
    capacity: null,
    duplicate_check_enabled: false,
    unique_field_id: null,
    whitelist_enabled: false,
  },
];

const whitelist_entries = [
  {
    id: ids.whitelist.emp001,
    registration_form_id: ids.forms.techReg,
    normalized_unique_value: "emp001",
    invitation_code: "482913",
    status: "used",
    used_at: ts("2026-10-12T03:15:00Z"),
    created_at: ts("2026-10-02T02:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.whitelist.emp002,
    registration_form_id: ids.forms.techReg,
    normalized_unique_value: "emp002",
    invitation_code: "193746",
    status: "used",
    used_at: ts("2026-10-12T04:20:00Z"),
    created_at: ts("2026-10-02T02:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.whitelist.emp003,
    registration_form_id: ids.forms.techReg,
    normalized_unique_value: "emp003",
    invitation_code: "557201",
    status: "available",
    used_at: null,
    created_at: ts("2026-10-02T02:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.whitelist.emp004,
    registration_form_id: ids.forms.techReg,
    normalized_unique_value: "emp004",
    invitation_code: "660184",
    status: "available",
    used_at: null,
    created_at: ts("2026-10-02T02:00:00Z"),
    deleted_at: null,
  },
  {
    id: ids.whitelist.emp005,
    registration_form_id: ids.forms.techReg,
    normalized_unique_value: "emp005",
    invitation_code: null,
    status: "revoked",
    used_at: null,
    created_at: ts("2026-10-02T02:00:00Z"),
    deleted_at: null,
  },
];

const techRegs = [
  {
    submission_id: ids.submissions.techReg1,
    language: "th",
    submitted_at: ts("2026-10-12T03:15:00Z"),
    whitelist_entry_id: ids.whitelist.emp001,
    reference_code: "A1B2C3",
    full_name: "สมชาย ใจดี",
    email: "somchai@example.com",
    employee_id: "EMP001",
    track: ids.options.trackAi,
    topics: [ids.options.topicSecurity, ids.options.topicData],
    shirt: ids.options.shirtL,
  },
  {
    submission_id: ids.submissions.techReg2,
    language: "en",
    submitted_at: ts("2026-10-12T04:20:00Z"),
    whitelist_entry_id: ids.whitelist.emp002,
    reference_code: "D4E5F6",
    full_name: "Emily Carter",
    email: "emily@example.com",
    employee_id: "EMP002",
    track: ids.options.trackWeb,
    topics: [ids.options.topicProduct],
    shirt: ids.options.shirtM,
  },
  {
    submission_id: ids.submissions.techReg3,
    language: "th",
    submitted_at: ts("2026-10-13T02:40:00Z"),
    soft_deleted: true,
    full_name: "วิชัย ทดสอบลบ",
    email: "wichai@example.com",
    employee_id: "EMP099",
    track: ids.options.trackCloud,
    topics: [],
    shirt: ids.options.shirtXl,
  },
];

techRegs.forEach((row) => {
  form_submissions.push({
    id: row.submission_id,
    form_id: ids.forms.techReg,
    status: row.soft_deleted ? "soft_deleted" : "submitted",
    submitted_language: row.language,
    submitted_at: row.submitted_at,
    deleted_by_user_id: row.soft_deleted ? ids.users.eventAdmin1 : null,
    deleted_at: row.soft_deleted ? ts("2026-10-14T01:00:00Z") : null,
  });
  if (!row.soft_deleted) {
    registrations.push({
      id: row.submission_id,
      submission_id: row.submission_id,
      whitelist_entry_id: row.whitelist_entry_id,
      reference_code: row.reference_code,
    });
  }
  addTextAnswer(row.submission_id, ids.fields.techFullName, row.full_name);
  addTextAnswer(row.submission_id, ids.fields.techEmail, row.email);
  addTextAnswer(row.submission_id, ids.fields.techEmployee, row.employee_id);
  addChoiceAnswer(row.submission_id, ids.fields.techTrack, [row.track]);
  if (row.topics.length) {
    addChoiceAnswer(row.submission_id, ids.fields.techTopics, row.topics);
  }
  addChoiceAnswer(row.submission_id, ids.fields.techShirt, [row.shirt]);
});

const wellRegs = [
  {
    submission_id: ids.submissions.wellReg1,
    language: "th",
    submitted_at: ts("2026-10-15T05:00:00Z"),
    reference_code: "W11111",
    full_name: "นภา สุขใจ",
    email: "napa@example.com",
    activity: ids.options.actYoga,
    date: "2026-12-05",
  },
  {
    submission_id: ids.submissions.wellReg2,
    language: "en",
    submitted_at: ts("2026-10-16T06:30:00Z"),
    reference_code: "W22222",
    full_name: "John Miller",
    email: "john.miller@example.com",
    activity: ids.options.actRun,
    date: "2026-12-05",
  },
];

wellRegs.forEach((row) => {
  form_submissions.push({
    id: row.submission_id,
    form_id: ids.forms.wellnessReg,
    status: "submitted",
    submitted_language: row.language,
    submitted_at: row.submitted_at,
    deleted_by_user_id: null,
    deleted_at: null,
  });
  registrations.push({
    id: row.submission_id,
    submission_id: row.submission_id,
    whitelist_entry_id: null,
    reference_code: row.reference_code,
  });
  addTextAnswer(row.submission_id, ids.fields.wellFullName, row.full_name);
  addTextAnswer(row.submission_id, ids.fields.wellEmail, row.email);
  addChoiceAnswer(row.submission_id, ids.fields.wellActivity, [row.activity]);
  addDateAnswer(row.submission_id, ids.fields.wellDate, row.date);
});

const techSurveys = [
  {
    submission_id: ids.submissions.techSurvey1,
    language: "th",
    submitted_at: ts("2026-11-15T11:00:00Z"),
    rating: 5,
    recommend: ids.options.recYes,
    feedback: "วิทยากรดีมาก อยากให้มีเวิร์กช็อปเพิ่ม",
    nps: 9,
  },
  {
    submission_id: ids.submissions.techSurvey2,
    language: "en",
    submitted_at: ts("2026-11-15T12:10:00Z"),
    rating: 4,
    recommend: ids.options.recMaybe,
    feedback: "Great talks, but the venue Wi-Fi was unstable.",
    nps: 7,
  },
  {
    submission_id: ids.submissions.techSurvey3,
    language: "th",
    submitted_at: ts("2026-11-16T02:00:00Z"),
    rating: 3,
    recommend: ids.options.recYes,
    feedback: null,
    nps: 8,
  },
];

techSurveys.forEach((row) => {
  form_submissions.push({
    id: row.submission_id,
    form_id: ids.forms.techSurvey,
    status: "submitted",
    submitted_language: row.language,
    submitted_at: row.submitted_at,
    deleted_by_user_id: null,
    deleted_at: null,
  });
  addNumberAnswer(row.submission_id, ids.fields.techRating, row.rating);
  addChoiceAnswer(row.submission_id, ids.fields.techRecommend, [row.recommend]);
  if (row.feedback) {
    addTextAnswer(row.submission_id, ids.fields.techFeedback, row.feedback);
  }
  addNumberAnswer(row.submission_id, ids.fields.techNps, row.nps);
});

form_submissions.push({
  id: ids.submissions.wellSurvey1,
  form_id: ids.forms.wellnessSurvey,
  status: "submitted",
  submitted_language: "th",
  submitted_at: ts("2026-12-05T10:00:00Z"),
  deleted_by_user_id: null,
  deleted_at: null,
});
addNumberAnswer(ids.submissions.wellSurvey1, ids.fields.wellEnergy, 5);
addTextAnswer(
  ids.submissions.wellSurvey1,
  ids.fields.wellComment,
  "สนุกและผ่อนคลายมาก"
);

const approval_requests = [
  {    id: uuid("approval_requests.1"),
    event_id: ids.events.tech,
    target_type: "event",
    target_id: ids.events.tech,
    requested_by_user_id: ids.users.eventAdmin1,
    reviewed_by_user_id: ids.users.eventAdmin1,
    status: "approved",
    reviewer_note: "พร้อมเผยแพร่",
    requested_at: ts("2026-09-30T08:00:00Z"),
    reviewed_at: ts("2026-10-01T07:50:00Z"),
  },
  {    id: uuid("approval_requests.2"),
    event_id: ids.events.tech,
    target_type: "registration_form",
    target_id: ids.forms.techReg,
    requested_by_user_id: ids.users.subUser1,
    reviewed_by_user_id: ids.users.eventAdmin1,
    status: "approved",
    reviewer_note: null,
    requested_at: ts("2026-09-28T04:00:00Z"),
    reviewed_at: ts("2026-09-29T04:00:00Z"),
  },
  {    id: uuid("approval_requests.3"),
    event_id: ids.events.draft,
    target_type: "event",
    target_id: ids.events.draft,
    requested_by_user_id: ids.users.eventAdmin3,
    reviewed_by_user_id: null,
    status: "pending",
    reviewer_note: null,
    requested_at: ts("2026-10-21T03:00:00Z"),
    reviewed_at: null,
  },
];

const trash_items = [
  {    id: uuid("trash_items.1"),
    event_id: ids.events.tech,
    resource_type: "registration",
    resource_id: ids.submissions.techReg3,
    display_name: "วิชัย ทดสอบลบ / EMP099",
    deleted_by_user_id: ids.users.eventAdmin1,
    deleted_at: ts("2026-10-14T01:00:00Z"),
    restore_allowed: false,
    restored_by_user_id: null,
    restored_at: null,
  },
];

const hard_delete_requests = [
  {    id: uuid("hard_delete_requests.1"),
    event_id: ids.events.tech,
    resource_type: "registration",
    resource_id: ids.submissions.techReg3,
    reason: "ผู้เข้าร่วมขอใช้สิทธิ์ถูกลืมตาม PDPA",
    requested_by_user_id: ids.users.eventAdmin1,
    reviewed_by_user_id: null,
    status: "pending",
    requested_at: ts("2026-10-14T02:00:00Z"),
    reviewed_at: null,
    completed_at: null,
  },
];

const audit_logs = [
  {    id: uuid("audit_logs.1"),
    event_id: ids.events.tech,
    actor_user_id: ids.users.eventAdmin1,
    action: "event.publish",
    resource_type: "event",
    resource_id: ids.events.tech,
    description: "Published Tech Summit 2026",
    includes_unmasked_pii: false,
    occurred_at: ts("2026-10-01T08:00:00Z"),
  },
  {    id: uuid("audit_logs.2"),
    event_id: ids.events.tech,
    actor_user_id: ids.users.subUser1,
    action: "registration.view_list",
    resource_type: "form",
    resource_id: ids.forms.techReg,
    description: "Viewed registration list with masked PII",
    includes_unmasked_pii: false,
    occurred_at: ts("2026-10-13T01:00:00Z"),
  },
  {    id: uuid("audit_logs.3"),
    event_id: ids.events.tech,
    actor_user_id: ids.users.eventAdmin1,
    action: "registration.export_unmasked",
    resource_type: "form",
    resource_id: ids.forms.techReg,
    description: "Exported registration CSV with unmasked PII",
    includes_unmasked_pii: true,
    occurred_at: ts("2026-10-13T02:00:00Z"),
  },
  {    id: uuid("audit_logs.4"),
    event_id: ids.events.tech,
    actor_user_id: ids.users.eventAdmin1,
    action: "registration.soft_delete",
    resource_type: "registration",
    resource_id: ids.submissions.techReg3,
    description: "Soft-deleted a registration submission",
    includes_unmasked_pii: false,
    occurred_at: ts("2026-10-14T01:00:00Z"),
  },
];

const db = {
  users,
  events,
  event_translations,
  forms,
  form_translations,
  form_fields,
  field_translations,
  field_options,
  field_option_translations,
  registration_settings,
  whitelist_entries,
  form_submissions,
  registrations,
  submission_answers,
  answer_option_selections,
  approval_requests,
  trash_items,
  hard_delete_requests,
  audit_logs,
};

const outPath = path.join(__dirname, "..", "db.json");
fs.writeFileSync(outPath, JSON.stringify(db, null, 2) + "\n", "utf8");

const sample = db.users[0];
console.log("Wrote", outPath);
console.log(
  "sample id types:",
  typeof sample.id,
  sample.id,
  typeof db.events[0].id,
  typeof db.event_translations[0].event_id
);
console.log(
  Object.fromEntries(Object.entries(db).map(([key, value]) => [key, value.length]))
);
