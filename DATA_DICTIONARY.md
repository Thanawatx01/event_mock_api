# Data Dictionary — Event & Survey Platform

| | |
|---|---|
| **แหล่งอ้างอิง** | `database-schema.dbml` |
| **เวอร์ชันอ้างอิง** | SRS Draft v2.1.0 — 22 ตุลาคม 2026 |
| **ฐานข้อมูลเป้าหมาย** | PostgreSQL (production) / json-server mock (`db.json`) |
| **ภาษาเอกสาร** | ไทย |

### สัญลักษณ์คอลัมน์ “Key”

| สัญลักษณ์ | ความหมาย |
|---|---|
| **PK** | Primary Key |
| **FK** | Foreign Key (อ้างอิงตารางอื่น) |
| **UK** | Unique / Unique composite |
| **NN** | Not Null (บังคับใส่ค่า) |

### ภาพรวมความสัมพันธ์หลัก

```
users ──► platform_roles / roles
events ──► event_translations, event_form_settings, event_banners, whitelist_entries
events ──► forms ──► form_fields ──► field_options
forms ──► form_submissions ──► submission_answers ──► answer_option_selections
form_submissions ──► registrations ──► whitelist_entries
events ──► dashboard_layouts ──► dashboard_widgets
```

เส้นทางข้อมูลผู้เข้าร่วม:  
`forms → form_submissions → submission_answers → answer_option_selections`  
(ลงทะเบียนมีแถว `registrations` เพิ่ม)

---

## 0) Enum / ค่าคงที่

### `system_role`
| ค่า | ความหมาย |
|---|---|
| `platform_admin` | ผู้ดูแลแพลตฟอร์ม |
| `event_user` | ผู้ใช้ในอีเวนต์ (มี role ภายในอีเวนต์) |

### `permission_code` (สิทธิ์ระดับอีเวนต์)
| ค่า | ความหมาย |
|---|---|
| `manage_dashboard` | จัดการ Dashboard |
| `manage_event` | จัดการข้อมูลอีเวนต์ |
| `manage_registration_form` | จัดการฟอร์มลงทะเบียน |
| `manage_survey_form` | จัดการแบบสอบถาม |
| `manage_sub_user` | สร้าง/มอบ Role ให้ผู้ใช้ในอีเวนต์ |

### `platform_permission_code` (สิทธิ์ระดับแพลตฟอร์ม)
| ค่า | ความหมาย |
|---|---|
| `manage_platform_users` | จัดการผู้ใช้แพลตฟอร์ม |
| `manage_all_events` | จัดการอีเวนต์ทั้งหมด |
| `view_platform_overview` | ดูภาพรวมแพลตฟอร์ม |
| `impersonate_event_user` | สวมสิทธิ์เข้าใช้งานในฐานะ Event User |

### `account_status`
| ค่า | ความหมาย |
|---|---|
| `invited` | เชิญแล้ว ยังไม่ตั้งรหัสผ่าน/เข้าระบบ |
| `active` | ใช้งานได้ |
| `suspended` | ระงับชั่วคราว |
| `removed` | ลบบัญชีแล้ว (คง id ไว้) |

### `event_status`
| ค่า | ความหมาย |
|---|---|
| `draft` | ร่าง |
| `scheduled` | ตั้งเวลาไว้ |
| `open` | เปิดใช้งาน |
| `closed` | ปิดแล้ว (หยุดลงทะเบียน) |

### `survey_access`
| ค่า | ความหมาย |
|---|---|
| `public` | ใครก็ตอบแบบสอบถามได้ |
| `registered_only` | ต้องลงทะเบียนก่อน |

### `form_type` / `form_status`
| Enum | ค่า | ความหมาย |
|---|---|---|
| `form_type` | `registration` | ฟอร์มลงทะเบียน |
| `form_type` | `survey` | แบบสอบถาม |
| `form_status` | `draft` / `scheduled` / `open` / `closed` | สถานะวงจรชีวิตฟอร์ม |

### `field_type`
| ค่า | ความหมาย |
|---|---|
| `short_text` | ข้อความสั้น |
| `long_text` | ข้อความยาว |
| `single_choice` | เลือกได้หนึ่งข้อ |
| `multiple_choice` | เลือกได้หลายข้อ |
| `dropdown` | รายการแบบเลื่อน |
| `date` / `time` / `number` / `email` | ตามชนิด |
| `rating` | ให้คะแนน (ไอคอนหรือสเกล) |

### `rating_display` / `rating_icon`
| Enum | ค่า | ความหมาย |
|---|---|---|
| `rating_display` | `icon` | แสดงเป็นดาว/หัวใจ/ไลก์ |
| `rating_display` | `linear_scale` | สเกลตัวเลข + ป้ายปลายสเกล |
| `rating_icon` | `star` / `heart` / `like` | ชุดไอคอนเมื่อเป็นโหมด icon |

### `submission_status` / `whitelist_entry_status`
| Enum | ค่า | ความหมาย |
|---|---|---|
| `submission_status` | `submitted` | ส่งแล้ว (นับความจุ) |
| `submission_status` | `cancelled` | ยกเลิกแล้ว (คืนที่นั่ง) |
| `whitelist_entry_status` | `available` | ยังไม่ใช้โค้ดลงทะเบียน |
| `whitelist_entry_status` | `joined` | ใช้โค้ดลงทะเบียนแล้ว |

### Dashboard enums
| Enum | ค่า | ความหมาย |
|---|---|---|
| `dashboard_widget_type` | `number` | ตัวเลขเดี่ยว |
| | `comparison` | ตัวเลขเทียบกับช่วงก่อน/เป้า/ความจุ |
| | `chart` | กราฟ |
| `dashboard_aggregation` | `count` / `sum` / `average` / `minimum` / `maximum` / `percentage` | วิธีสรุป |
| `dashboard_chart_type` | `bar` / `line` / `pie` / `donut` | ชนิดกราฟ |
| `dashboard_comparison_mode` | `previous_period` | เทียบช่วงก่อน |
| | `target` | เทียบเป้า (`target_value`) |
| | `capacity` | เทียบที่นั่งจาก `event_form_settings` |
| `display_size` | `small` = 1×1, `medium` = 2×2, `large` = 3×3, `custom` = ใช้ `grid_w`/`grid_h` | ขนาด widget |
| `text_align` | `left` / `center` / `right` | จัดข้อความ |
| `date_type` | `day` / `week` / `month` / `three_months` | ช่วงวันที่ของ widget |

---

## 1) สิทธิ์และบัญชี

### `users` — บัญชีผู้ดูแล (ผู้เข้าร่วมไม่มีบัญชี)

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสผู้ใช้ |
| `email` | varchar(320) | UK | อีเมลล็อกอิน (ตั้ง null เมื่อ removed) |
| `password` | varchar(255) | NN | รหัสผ่าน (mock/demo) |
| `display_name` | varchar(160) | NN | ชื่อที่แสดง |
| `system_role` | system_role | NN | `platform_admin` หรือ `event_user` |
| `platform_role_id` | uuid | FK → platform_roles | ใช้เฉพาะ platform_admin |
| `event_id` | uuid | FK → events | ใช้เฉพาะ event_user (สังกัดอีเวนต์เดียว) |
| `role_id` | uuid | FK → roles | Custom Role ในอีเวนต์ |
| `role_assigned_by_user_id` | uuid | FK → users | ผู้มอบ Role |
| `role_assigned_at` | timestamptz | | เวลามอบ Role |
| `status` | account_status | NN | สถานะบัญชี |
| `invited_by_user_id` | uuid | FK → users | ผู้เชิญ |
| `joined_at` | timestamptz | | เวลาเข้าระบบครั้งแรก |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `removed_at` | timestamptz | | เวลาลบบัญชี |

**กฎ:** platform_admin → มี `platform_role_id`, `event_id`/`role_id` เป็น null  
event_user → มี `event_id`+`role_id`, `platform_role_id` เป็น null

### `platform_roles` — Role ระดับแพลตฟอร์ม

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัส Role |
| `name` | varchar(160) | UK, NN | ชื่อ Role |
| `description` | text | | คำอธิบาย |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `created_by` / `updated_by` | uuid | FK → users | ผู้สร้าง/ผู้แก้ |
| `deleted_at` | timestamptz | | soft delete |

### `platform_role_permissions`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `platform_role_id` | uuid | FK, UK(ร่วม) | Role แม่ |
| `permission` | platform_permission_code | NN, UK(ร่วม) | สิทธิ์หนึ่งรายการ |

### `roles` — Custom Role ในอีเวนต์

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัส Role |
| `event_id` | uuid | FK, UK(ร่วม name) | อีเวนต์เจ้าของ Role |
| `name` | varchar(160) | NN, UK(ร่วม) | ชื่อ Role ในอีเวนต์ |
| `description` | text | | คำอธิบาย |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `created_by` / `updated_by` | uuid | FK → users, NN | ผู้สร้าง/ผู้แก้ |
| `deleted_at` | timestamptz | | soft delete |

### `role_permissions`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `role_id` | uuid | FK, UK(ร่วม) | Event Role |
| `permission` | permission_code | NN, UK(ร่วม) | สิทธิ์หนึ่งรายการ |

---

## 2) อีเวนต์และเนื้อหา

### `events`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสอีเวนต์ |
| `slug` | varchar(160) | UK, NN | URL slug (แก้ไม่ได้หลัง publish) |
| `status` | event_status | NN | สถานะอีเวนต์ |
| `default_locale` | varchar(35) | NN | ภาษาเนื้อหาเริ่มต้น (เช่น `th`) |
| `start_at` / `end_at` | timestamptz | | วัน–เวลาเริ่ม/จบงาน |
| `is_private` | boolean | NN | อีเวนต์ส่วนตัว (บังคับลงทะเบียน+whitelist) |
| `has_registration` | boolean | NN | เปิดฟอร์มลงทะเบียน |
| `has_survey` | boolean | NN | เปิดแบบสอบถาม |
| `survey_access` | survey_access | | ใครตอบแบบสอบถามได้ (null ถ้าไม่มี survey) |
| `opens_at` / `closes_at` | timestamptz | | ช่วงเปิดรับโดยรวมของอีเวนต์ |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `created_by` / `updated_by` | uuid | FK → users, NN | ผู้สร้าง/ผู้แก้ |

**กฎสำคัญ**
- `is_private = true` → ต้อง `has_registration = true` + มี `whitelist_entries`
- `survey_access = registered_only` → ต้อง `has_registration = true`
- ความจุไม่เก็บที่นี่ → ดู `event_form_settings`

### `event_translations` — เนื้อหาหลายภาษา

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `event_id` | uuid | FK, UK(ร่วม locale) | อีเวนต์แม่ |
| `locale_code` | varchar(5) | NN, UK(ร่วม) | รหัสภาษา เช่น `th`, `en` |
| `display_order` | int | NN, UK(ร่วม event) | ลำดับภาษา |
| `title` | varchar(240) | NN | ชื่องาน |
| `description` | text | | รายละเอียด |
| `location_name` | varchar(240) | | ชื่อสถานที่ |
| `address_text` | text | | ที่อยู่ |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |

### `event_form_settings` — ความจุต่อโฟลว์ (ตั้งตอนสร้างอีเวนต์)

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `event_id` | uuid | FK, UK(ร่วม form_type) | อีเวนต์ |
| `form_type` | form_type | NN, UK(ร่วม) | `registration` หรือ `survey` |
| `is_unlimited` | boolean | NN | true = ไม่จำกัดที่นั่ง |
| `capacity` | int | | จำนวนที่นั่ง (null ถ้า unlimited) |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |

**การนับที่นั่ง:** นับ `form_submissions` ที่ `status = submitted` ของฟอร์มชนิดนั้น  
ยกเลิกคำตอบ (`cancelled`) = คืนที่นั่ง

### `event_banners`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแบนเนอร์ |
| `event_id` | uuid | FK, UK | อีเวนต์ (อีเวนต์ละหนึ่งแถวตาม schema ปัจจุบัน) |
| `banner_url` | varchar(2048) | NN | URL รูปแบนเนอร์ |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |

---

## 3) Form Builder

### `forms`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสฟอร์ม |
| `event_id` | uuid | FK, UK(ร่วม type) | อีเวนต์เจ้าของ |
| `type` | form_type | NN, UK(ร่วม) | registration / survey (อย่างละไม่เกิน 1) |
| `status` | form_status | NN | สถานะฟอร์ม |
| `opens_at` / `closes_at` | timestamptz | | ช่วงเปิด/ปิดรับคำตอบ |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `created_by` / `updated_by` | uuid | FK → users, NN | ผู้สร้าง/ผู้แก้ |
| `deleted_at` | timestamptz | | soft delete |

### `form_translations`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `form_id` | uuid | FK, UK(ร่วม locale) | ฟอร์มแม่ |
| `locale_code` | varchar(35) | NN | ภาษา |
| `title` | varchar(240) | NN | ชื่อฟอร์ม |
| `description` | text | | คำอธิบายฟอร์ม |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |

### `form_fields`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสคำถาม |
| `form_id` | uuid | FK | ฟอร์มแม่ |
| `type` | field_type | NN | ชนิดคำถาม |
| `display_order` | int | NN, UK(ร่วม form) | ลำดับแสดง |
| `is_required` | boolean | NN | บังคับตอบ |
| `min_number` / `max_number` | decimal | | ขอบเขตตัวเลข / ปลายสเกล |
| `min_length` / `max_length` | int | | ความยาวข้อความ |
| `validation_pattern` | varchar(500) | | regex ตรวจค่า |
| `rating_display` | rating_display | | โหมด rating (null ถ้าไม่ใช่ rating) |
| `rating_icon` | rating_icon | | ไอคอน (เฉพาะโหมด icon) |
| `rating_max` | int | | คะแนนสูงสุดโหมด icon (min = 1) |
| `created_at` / `updated_at` | timestamptz | NN | เวลาสร้าง/แก้ |
| `deleted_at` | timestamptz | | soft delete |

### `field_translations`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสแถว |
| `field_id` | uuid | FK, UK(ร่วม locale) | คำถามแม่ |
| `locale_code` | varchar(35) | NN | ภาษา |
| `label` | varchar(500) | NN | ข้อความคำถาม |
| `placeholder` | varchar(500) | | ข้อความตัวอย่างในช่อง |
| `scale_min_label` / `scale_max_label` | varchar(240) | | ป้ายปลายสเกล (linear_scale) |

### `field_options` / `field_option_translations`

| ตาราง | Field | Type | Key | ความหมาย |
|---|---|---|---|---|
| `field_options` | `id` | uuid | PK | รหัสตัวเลือก |
| | `field_id` | uuid | FK | คำถามแม่ |
| | `display_order` | int | NN, UK(ร่วม) | ลำดับ |
| | `created_at` | timestamptz | NN | เวลาสร้าง |
| | `deleted_at` | timestamptz | | soft delete |
| `field_option_translations` | `id` | uuid | PK | รหัสแถว |
| | `option_id` | uuid | FK, UK(ร่วม locale) | ตัวเลือกแม่ |
| | `locale_code` | varchar(35) | NN | ภาษา |
| | `label` | varchar(240) | NN | ข้อความตัวเลือก |

---

## 4) ไวท์ลิสต์ (ระดับอีเวนต์)

### `whitelist_entries`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสรายการ |
| `event_id` | uuid | FK | อีเวนต์เจ้าของ (ไม่ผูกฟอร์ม) |
| `access_code` | varchar(32) | NN, UK(ร่วม event) | โค้ดที่ระบบเจน ให้ผู้เข้าร่วมกรอก |
| `username` | varchar(240) | NN | ชื่อ/ป้ายฝั่งแอดมิน (ไม่ใช้จับคู่) |
| `status` | whitelist_entry_status | NN | `available` / `joined` |
| `joined_at` | timestamptz | | เวลาที่ใช้โค้ดลงทะเบียนสำเร็จ |
| `created_at` | timestamptz | NN | เวลาสร้าง |
| `deleted_at` | timestamptz | | soft delete |

**โฟลว์:** Admin เพิ่มคน → ได้ `access_code` → ผู้เข้าร่วมกรอกตอนลงทะเบียน → `available` → `joined`

---

## 5) การส่งคำตอบ

### `form_submissions`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสการส่ง |
| `form_id` | uuid | FK | ฟอร์มที่ส่ง |
| `status` | submission_status | NN | submitted / cancelled |
| `submitted_at` | timestamptz | NN | เวลาส่ง |
| `cancelled_by_user_id` | uuid | FK → users | ผู้ยกเลิก |
| `cancelled_at` | timestamptz | | เวลายกเลิก |

### `registrations` — ส่วนขยายเมื่อเป็นฟอร์มลงทะเบียน

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `submission_id` | uuid | PK, FK → form_submissions (1:1) | ชี้การส่ง |
| `whitelist_entry_id` | uuid | FK, UK | รายการไวท์ลิสต์ที่ใช้ (null ถ้าสาธารณะ) |
| `confirmation_code` | varchar(6) | NN | รหัสยืนยันหลังส่งสำเร็จ (คนละตัวกับ access_code) |

### `submission_answers`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสคำตอบ |
| `submission_id` | uuid | FK, UK(ร่วม field) | การส่งแม่ |
| `field_id` | uuid | FK, UK(ร่วม) | คำถามที่ตอบ |
| `value_text` | text | | ค่าข้อความ |
| `value_number` | decimal | | ค่าตัวเลข / rating |
| `value_boolean` | boolean | | ค่าบูลีน |
| `value_date` | date | | ค่าวันที่ |
| `value_time` | time | | ค่าเวลา |
| `created_at` | timestamptz | NN | เวลาบันทึก |

ใช้**เพียงหนึ่ง**คอลัมน์ค่า ตามชนิดฟิลด์ — ตัวเลือกเก็บที่ `answer_option_selections`

### `answer_option_selections`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `answer_id` | uuid | PK(ร่วม), FK → submission_answers | คำตอบแม่ |
| `option_id` | uuid | PK(ร่วม), FK → field_options | ตัวเลือกที่เลือก |

---

## 6) Dashboard

### `dashboard_layouts`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัสเลย์เอาต์ |
| `event_id` | uuid | FK, UK | อีเวนต์ละหนึ่งเลย์เอาต์ |
| `updated_by_user_id` | uuid | FK → users, NN | ผู้แก้ล่าสุด |
| `updated_at` | timestamptz | NN | เวลาแก้ |

### `dashboard_widgets`

| Field | Type | Key | ความหมาย |
|---|---|---|---|
| `id` | uuid | PK | รหัส widget |
| `layout_id` | uuid | FK | เลย์เอาต์แม่ |
| `widget_type` | dashboard_widget_type | NN | number / comparison / chart |
| `title` | varchar(240) | NN | ชื่อที่แสดง |
| `source_form_id` | uuid | FK → forms | แหล่งฟอร์ม (null = ทั้งอีเวนต์) |
| `source_field_id` | uuid | FK → form_fields | แหล่งคำถาม (ถ้าต้อง) |
| `aggregation` | dashboard_aggregation | NN | วิธีสรุป |
| `chart_type` | dashboard_chart_type | | ชนิดกราฟ (ต้องมีเมื่อเป็น chart) |
| `comparison_mode` | dashboard_comparison_mode | | โหมดเทียบ (ต้องมีเมื่อเป็น comparison) |
| `target_value` | decimal | | เป้า (เมื่อ comparison = target) |
| `text_align` | text_align | NN | จัดข้อความ |
| `date_type` | date_type | | ช่วงวันที่สำเร็จรูป |
| `start_date` / `end_date` | date | | ช่วงวันที่กำหนดเอง |
| `display_size` | display_size | NN | ขนาด preset / custom |
| `grid_w` / `grid_h` | int | | กว้าง×สูง (1–3) เมื่อ custom |
| `display_order` | int | NN, UK(ร่วม layout) | ลำดับบน Dashboard |
| `updated_at` | timestamptz | NN | เวลาแก้ |

**หมายเหตุ:** Widget เก็บแค่ config — ค่าจริงคำนวณจาก submissions ตอนแสดงผล

---

## ภาคผนวก — วิธีนำเข้า Google Docs

ตอนนี้ยังไม่มี Google Docs API เชื่อมกับ Cursor โดยตรง แนะนำดังนี้:

1. เปิดไฟล์นี้ใน GitHub / โปรแกรมแก้ไข
2. คัดลอกทั้งเอกสาร
3. ไปที่ [Google Docs](https://docs.google.com/document/create) → วาง (Paste)
4. หรืออัปโหลดไฟล์ `DATA_DICTIONARY.md` ผ่าน Google Drive → เปิดด้วย Google Docs  
   (Drive อาจแปลง Markdown เป็นเอกสารที่จัดรูปแบบได้)

ไฟล์ต้นทางใน repo: `DATA_DICTIONARY.md`  
Schema ต้นทาง: `database-schema.dbml`  
แผนภาพ: `database-schema.dbdiagram` / `database-schema.png`
