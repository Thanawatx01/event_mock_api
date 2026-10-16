# เอกสารทางเทคนิคฝั่ง Backend

**ผลิตภัณฑ์:** Event + Survey Management Platform  
**คอมโพเนนต์:** Mock REST API (`event-management-mock-api`)  
**เวอร์ชัน:** 1.1.3  
**Base URL:** `http://localhost:3000`  
**สแตก:** Node.js + [JSON Server](https://github.com/typicode/json-server) `0.17.4`  
**แหล่งข้อมูล:** `db.json` (ฐานข้อมูลจำลองแบบไฟล์)

---

## 1. ภาพรวมระบบ (System Overview)

### 1.1 วัตถุประสงค์

Mock API ฝั่ง backend นี้จำลองพื้นผิว REST ของแพลตฟอร์มจัดการอีเวนต์และแบบสอบถาม สำหรับพัฒนา frontend และการเชื่อมต่อระบบ โดยเปิด CRUD ของทรัพยากรหลักดังนี้

- ตัวตนผู้ใช้และ RBAC แบบละเอียด
- วงจรชีวิตอีเวนต์ (draft → published → closed)
- Form Engine ร่วมกันสำหรับฟอร์มลงทะเบียนและแบบสอบถาม
- Whitelist / Access Gate ของอีเวนต์แบบ private
- การส่งคำตอบและการเก็บค่าคำตอบ
- Dashboard แบบประกอบด้วยวิดเจ็ต
- Audit log, cookie consent และคำขอสิทธิ์ PDPA

### 1.2 การรันระบบ

```bash
npm start
# json-server --watch db.json --port 3000
```

| รายการ | ค่า |
|---|---|
| Host | `localhost` |
| Port | `3000` |
| Content-Type | `application/json` |
| การบันทึกข้อมูล | บันทึกกลับไปที่ `db.json` ขณะรันด้วย `--watch` |

### 1.3 สถาปัตยกรรมระดับสูง

```text
Client (Web / Mobile)
        |
        | HTTP JSON
        v
JSON Server (REST)
        |
        v
ทรัพยากรใน db.json
  users, roles, permissions
  events, event_users, event_branding
  forms, form_sections, form_fields, form_field_options
  whitelist_uploads, whitelist_entries
  submissions, submission_answers
  dashboards, dashboard_widgets
  audit_logs, cookie_consents, privacy_requests
```

### 1.4 โมดูลตามโดเมน

| โมดูล | ทรัพยากร | หน้าที่ |
|---|---|---|
| ตัวตนและการเข้าถึง | `users`, `roles`, `permissions`, `event_users` | บัญชี, บทบาทกำหนดเอง, สิทธิ์รายละเอียด, มอบหมายทีมงานเข้าอีเวนต์ |
| อีเวนต์ | `events`, `event_branding`, `whitelist_*` | อีเวนต์สาธารณะ/ส่วนตัว, branding, ชุดข้อมูล Access Gate |
| Form Engine | `forms`, `form_sections`, `form_fields`, `form_field_options` | schema ร่วมของฟอร์มลงทะเบียน/แบบสอบถาม (Section Branching ตามภาษา) และวงจรอนุมัติ |
| คำตอบ | `submissions`, `submission_answers` | คำตอบของผู้เข้าร่วมทั้งสองประเภทฟอร์ม |
| วิเคราะห์ผล | `dashboards`, `dashboard_widgets` | วิดเจ็ต KPI / กราฟ / ตาราง |
| การปฏิบัติตามกฎ | `audit_logs`, `cookie_consents`, `privacy_requests` | บันทึก PII, ความยินยอมคุกกี้, สิทธิ์ถูกลืม |

### 1.5 ข้อจำกัดทางธุรกิจที่สะท้อนในข้อมูล

| กฎ | ผลกระทบฝั่ง backend |
|---|---|
| Event Owner มีอีเวนต์ได้ 1 งาน (`isDeleted=false`) | นับ `events` ของ `ownerId` ที่ยังไม่ soft-delete — ต้องได้ ≤ 1 |
| Sub-user อยู่ได้ในอีเวนต์ของ owner ต้นสังกัดเพียง 1 งาน | นับ `event_users` ของ `userId` ที่ `isDeleted=false` — ต้องได้ ≤ 1 และ `event.ownerId` ตรงกับ `user.ownerId` |
| แต่ละอีเวนต์มีฟอร์มลงทะเบียนและแบบสอบถามได้ไม่เกินอย่างละ 1 (หรือไม่มีเลย / มีอย่างใดอย่างหนึ่ง) | นับ `forms` ที่ `eventId` ตรงกัน, `isDeleted=false` แล้วจัดกลุ่มตาม `type` |
| อีเวนต์ private ต้องมี Access Gate | `events.type=private` ต้องตั้ง `accessGateField` และตรวจกับ `whitelist_entries` |
| ต้องอนุมัติฟอร์มก่อนเผยแพร่อีเวนต์ | เผยแพร่ได้เมื่อไม่มีฟอร์มผูกอยู่ หรือฟอร์มที่ active ทั้งหมดเป็น `approved` |
| Soft delete | ใช้ `isDeleted` / `deletedAt`; ฟอร์มที่ลบแล้วไม่นับโควตา |
| ฟิลด์ข้อมูลอ่อนไหว | `form_fields.sensitive=true`; API จริงต้อง mask ที่ backend ก่อนส่งตอบ |
| Form Engine — Section Branching ตามภาษา | ทุกฟอร์ม `branchingMode=section_by_language`; มีเซ็กชันต่อภาษา (`lang_type` เป็น string เช่น `th` / `en`) — **ไม่มี**เซ็กชันเลือกภาษา; UI ใช้ language switch ลอยบนหน้า แล้วแสดงเซ็กชันที่ `lang_type` ตรงกัน |

> **หมายเหตุของ mock:** JSON Server **ไม่บังคับ** กฎธุรกิจและ auth เอง ฝั่ง client หรือ API จริงในอนาคตต้องทำ validation, masking และ authorization เอง ข้อมูลตัวอย่างใน `db.json` มีทั้งเคสที่ผ่านกฎและเคสขอบ สำหรับทดสอบ UI

---

## 2. Database Schema / ER Diagram

### 2.1 ไฟล์แผนภาพ ER

ใช้แผนภาพที่ส่งออกไว้ในโปรเจกต์:

- แผนภาพ: [`database-schema.png`](./database-schema.png)
- ต้นทาง DBML: [`database-schema.dbml`](./database-schema.dbml)
- เนื้อหา: ทรัพยากรครบ **19** ตาราง (รวม `form_sections`) จัดเป็นคอลัมน์ตามโดเมน — วาด FK ครบทุกเส้นด้วย channel routing (เลนแยกกัน): คอลัมน์เดียวกันใช้ gutter ซ้าย, คอลัมน์ติดกันใช้ช่องระหว่างคอลัมน์, ข้ามหลายคอลัมน์ใช้ highway ด้านล่าง — สีเส้นแยกตามตารางต้นทาง (`users` น้ำเงิน / `events` เขียว / form engine แดง)

### 2.2 รายการเอนทิตี

| ทรัพยากร | หน้าที่ |
|---|---|
| `users` | Super Admin, Event Owner, Sub-User, Participant |
| `roles` | บทบาทกำหนดเองที่ Event Owner เป็นเจ้าของ |
| `permissions` | เมทริกซ์ฟีเจอร์ × การกระทำของแต่ละบทบาท |
| `events` | เรคอร์ดหลักของอีเวนต์ |
| `event_users` | มอบหมาย Sub-User + บทบาทเข้าอีเวนต์ |
| `event_branding` | โลโก้, แบนเนอร์, สี, ธีม, สัดส่วนแบนเนอร์ |
| `forms` | ฟอร์มลงทะเบียนหรือแบบสอบถาม (engine ร่วม) |
| `form_sections` | เซ็กชันของฟอร์มสำหรับ Section Branching ตามภาษา (สลับด้วย UI switch) |
| `form_fields` | นิยามฟิลด์ (อินพุต 9 ชนิด) ผูกกับเซ็กชัน |
| `form_field_options` | ตัวเลือกของ radio / checkbox / dropdown |
| `whitelist_uploads` | เมทาดาทาไฟล์ CSV/Excel ที่อัปโหลด |
| `whitelist_entries` | แถวข้อมูลสำหรับ Access Gate |
| `submissions` | การส่งฟอร์มลงทะเบียนหรือแบบสอบถาม 1 ครั้ง |
| `submission_answers` | คำตอบรายฟิลด์ |
| `dashboards` | เลย์เอาต์แดชบอร์ดต่ออีเวนต์ |
| `dashboard_widgets` | วิดเจ็ตที่ผูกกับข้อมูลฟอร์ม/ฟิลด์ |
| `audit_logs` | บันทึกความปลอดภัยและกิจกรรมเกี่ยวกับ PII |
| `cookie_consents` | ความยินยอมคุกกี้ของผู้เข้าร่วม |
| `privacy_requests` | คำขอ Right to be Forgotten ตาม PDPA |

### 2.3 ความสัมพันธ์หลัก

```text
users 1──* roles
roles 1──* permissions
users (event_owner) 1──1 events (ownerId; active ไม่ soft-delete)
events 1──* event_users *──1 users (sub_user อยู่ได้แค่ 1 อีเวนต์)
events 1──1 event_branding
events 1──0..1 forms(registration) + 0..1 forms(survey)
forms 1──* form_sections 1──* form_fields 1──* form_field_options
events 1──* whitelist_uploads 1──* whitelist_entries
forms 1──* submissions 1──* submission_answers
submission_answers *──1 form_fields
events 1──* dashboards 1──* dashboard_widgets
users / events / form_fields ←── audit_logs (ผู้กระทำ + ขอบเขตเสริม)
```

### 2.4 Enum สำคัญ

| ฟิลด์ | ค่าที่ใช้ |
|---|---|
| `users.role` | `super_admin`, `event_owner`, `sub_user`, `participant` |
| `users.status` | `active`, `inactive` |
| `events.type` | `public`, `private` |
| `events.status` | `draft`, `published`, `closed` |
| `forms.type` | `registration`, `survey` |
| `forms.status` | `draft`, `pending_approval`, `approved`, `rejected` |
| `forms.approvalType` | `self`, `approver`, `force_owner` |
| `forms.branchingMode` | `section_by_language` (Section Branching — UI language switch เลือกเซ็กชัน) |
| `form_fields.type` | `text`, `long_text`, `radio`, `checkbox`, `dropdown`, `date`, `time`, `number`, `rating` |
| `event_branding.bannerRatio` | `9:16`, `3:4` |
| `dashboard_widgets.type` | `kpi`, `bar_chart`, `pie_chart`, `data_table` |
| `permissions.feature` | `events`, `registrations`, `surveys`, `dashboards`, `whitelist`, `branding`, `audit_logs`, `users` |

### 2.5 สัญญาฟิลด์ที่สำคัญ

#### `users`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | string | PK |
| `ownerId` | string \| null | Event Owner ต้นสังกัดของ `sub_user` |
| `canViewSensitiveData` | boolean | Super Admin เป็น true เสมอ; Event Owner ต้องได้รับสิทธิ์ |
| `isDeleted` / `deletedAt` / `anonymizedAt` | — | เครื่องหมาย soft-delete / PDPA |

#### `events`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `name` | `Record<string, string>` | ชื่อหลายภาษา — คีย์เป็นรหัสภาษาแบบ string (`th`, `en`, … สอดคล้อง `languages[].id`) ไม่ใช่ enum |
| `description` | `Record<string, string>` | คำอธิบายหลายภาษา — รูปแบบเดียวกับ `name` |
| `startAt` / `endAt` | datetime ISO-8601 | ใช้ช่วง Pre-event / Active / Closed |
| `accessGateField` | string \| null | บังคับเมื่อ `type=private` เช่น `employeeId` |
| `status` | enum | วงจรหลักเท่านั้น: draft / published / closed |

ฝั่ง client เลือกข้อความด้วยภาษาที่ active — ถ้าไม่มีคีย์ภาษานั้นให้ fallback เป็น `th` แล้วค่อยค่าแรกที่มี

#### `forms`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `slug` | string | slug คงที่สำหรับ URL / QR |
| `rejectionNote` | string \| null | บังคับเมื่อ `status=rejected` |
| `approvedBy` / `rejectedBy` | user id | ผู้ดำเนินการอนุมัติ/ปฏิเสธ |
| `approvalType` | enum | อนุมัติเอง, ผู้ตรวจอนุมัติ หรือบังคับโดยเจ้าของงาน |
| `branchingMode` | string | ค่าปัจจุบัน `section_by_language` — UI เลือกภาษาแล้วแสดงเซ็กชันที่ `lang_type` ตรงกัน |

#### `form_sections`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | string | PK |
| `formId` | string | FK → `forms` |
| `key` | string | คีย์ภายใน เช่น `content_th`, `content_en` |
| `title` | string | หัวข้อเซ็กชัน |
| `lang_type` | string | **ไม่ใช่ enum** — รหัสภาษาแบบ string (เช่น `"th"`, `"en"` ให้สอดคล้องกับ `languages[].id` ฝั่ง frontend) เพื่อรองรับภาษาใหม่ในอนาคต |
| `sortOrder` | number | ลำดับเซ็กชัน |
| `isDeleted` / `deletedAt` | — | soft-delete |

**Flow Section Branching + language switch (ฝั่ง client):**

1. **ไม่มี**เซ็กชัน/`form_fields` สำหรับเลือกภาษา — ใช้ language switch ลอยบนหน้าเว็บ สลับได้ตลอดเวลา
2. เมื่อสวิตช์เป็นภาษา `L` → แสดงเฉพาะเซ็กชันที่ `lang_type === L` และฟิลด์ในเซ็กชันนั้น
3. ฟิลด์คู่ภาษาใช้ **`name` เดียวกัน** (เช่น `fullName`) แต่คนละ `id` / `sectionId` / `label`
4. **Pre-save คำตอบ** เก็บใน `localStorage` หรือ cookie โดยคีย์หลักเป็น `name` (ไม่ใช่ `fieldId`) เพื่อให้เปลี่ยนภาษาแล้วยังเห็นคำตอบเดิม
5. ตอน submit จริง ค่อย map จาก `name` → `fieldId` ของเซ็กชันภาษาที่ active แล้ว POST `submission_answers`

**รูปแบบ pre-save ที่แนะนำ (client):**

```json
{
  "formId": "6",
  "lang_type": "th",
  "answersByName": {
    "fullName": { "value": "สมชาย ใจดี", "values": [] },
    "interests": { "value": null, "values": ["meetup", "food"] }
  }
}
```

- สลับภาษา → อัปเดตแค่ `lang_type` ที่แสดงผล; `answersByName` คงเดิม
- ค่า choice (`radio` / `checkbox` / `dropdown`) เก็บ `value`/`values` ที่เป็นรหัสตัวเลือก (ไม่ใช่ label) เพื่อให้ใช้ร่วมข้ามภาษาได้

#### `form_fields`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `sectionId` | string | FK → `form_sections` — ฟิลด์อยู่ภายใต้เซ็กชันใด |
| `name` | string | คีย์คำถามร่วมข้ามภาษา — ใช้ pre-save / hydrate คำตอบตอนสลับภาษา |
| `type` | enum | ชนิดอินพุต 9 แบบ (ดูตาราง enum) |

#### `submission_answers`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `value` | string \| null | คำตอบค่าเดียว |
| `values` | string[] | คำตอบหลายค่าสำหรับ `checkbox` |

#### `audit_logs`

| ฟิลด์ | ชนิด | หมายเหตุ |
|---|---|---|
| `entity` + `entityId` | เป้าหมายแบบ polymorphic | ไม่ใช่ FK คงที่ |
| `fieldId` | ไม่บังคับ | ใช้กับเหตุการณ์ unmask / แก้ไขฟิลด์ PII |

---

## 3. API Endpoints

JSON Server เปิดเส้นทาง REST มาตรฐานสำหรับทุกทรัพยารระดับบนสุดใน `db.json`

### 3.1 รูปแบบทรัพยากรทั่วไป

สำหรับแต่ละทรัพยากร `{resource}`:

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/{resource}` | รายการ / กรอง / เรียง / แบ่งหน้า |
| `GET` | `/{resource}/{id}` | ดึงรายการเดียว |
| `POST` | `/{resource}` | สร้าง |
| `PUT` | `/{resource}/{id}` | แทนที่ทั้งอ็อบเจกต์ |
| `PATCH` | `/{resource}/{id}` | อัปเดตบางฟิลด์ |
| `DELETE` | `/{resource}/{id}` | ลบถาวร (ในโดเมนนี้แนะนำ soft-delete ด้วย PATCH แทน) |

### 3.2 แผนที่ทรัพยากร

| Path | คำอธิบาย |
|---|---|
| `/users` | บัญชีผู้ใช้ |
| `/roles` | บทบาทกำหนดเอง |
| `/permissions` | เมทริกซ์สิทธิ์ของบทบาท |
| `/events` | อีเวนต์ |
| `/event_users` | มอบหมายทีมงาน |
| `/event_branding` | Branding |
| `/forms` | ฟอร์มลงทะเบียน/แบบสอบถาม |
| `/form_sections` | เซ็กชันของฟอร์ม (branch ตามภาษา) |
| `/form_fields` | ฟิลด์ของฟอร์ม |
| `/form_field_options` | ตัวเลือกของฟิลด์ |
| `/whitelist_uploads` | ชุดไฟล์ whitelist ที่อัปโหลด |
| `/whitelist_entries` | แถว whitelist |
| `/submissions` | ฟอร์มที่ส่งแล้ว |
| `/submission_answers` | คำตอบ |
| `/dashboards` | แดชบอร์ด |
| `/dashboard_widgets` | วิดเจ็ต |
| `/audit_logs` | บันทึกตรวจสอบ |
| `/cookie_consents` | ความยินยอมคุกกี้ |
| `/privacy_requests` | คำขอ PDPA |

### 3.3 Query operators ของ JSON Server

| ประเภท | ตัวอย่าง | พฤติกรรม |
|---|---|---|
| เท่ากัน | `/events?status=published` | จับคู่ตรงค่า |
| ซ้อน | `/dashboard_widgets?filters.status=registered` | ฟิลด์ JSON ซ้อน |
| ค้นหาข้อความ | `/events?q=Conference` | ค้นหลายฟิลด์ |
| เรียง | `/events?_sort=startAt&_order=desc` | เรียงลำดับ |
| ตัดช่วง | `/submissions?_start=0&_end=10` | slice |
| แบ่งหน้า | `/submissions?_page=1&_limit=10` | pagination |
| ตัวดำเนินการ | `/events?id_ne=7&startAt_gte=2026-10-01` | `_gte`, `_lte`, `_ne`, `_like` |

### 3.4 Endpoint เชิงแอปพลิเคชันที่แนะนำ (เชิงตรรกะ)

เป็นโฟลว์ที่ frontend ควรเรียก บน mock server จะ map ไปยังเส้นทางทรัพยากรด้านบน

#### Auth / ตัวตน

| กรณีใช้งาน | การเรียก mock |
|---|---|
| เข้าสู่ระบบ (mock) | `GET /users?email=...&password=...` |
| โปรไฟล์ผู้ใช้ปัจจุบัน | `GET /users/{id}` |
| รายการ Event Owner | `GET /users?role=event_owner` |
| รายการ Sub-User ของ owner | `GET /users?role=sub_user&ownerId={ownerId}` |

#### อีเวนต์

| กรณีใช้งาน | การเรียก mock |
|---|---|
| รายการอีเวนต์ | `GET /events?isDeleted=false` |
| สร้างอีเวนต์แบบร่าง | `POST /events` |
| เผยแพร่อีเวนต์ | `PATCH /events/{id}` `{ "status":"published", "publishedAt":"..." }` |
| ปิดอีเวนต์ | `PATCH /events/{id}` `{ "status":"closed", "closedAt":"..." }` |
| Soft delete | `PATCH /events/{id}` `{ "isDeleted":true, "deletedAt":"..." }` |

#### ฟอร์ม / การอนุมัติ

| กรณีใช้งาน | การเรียก mock |
|---|---|
| รายการฟอร์มของอีเวนต์ | `GET /forms?eventId={id}&isDeleted=false` |
| ส่งขออนุมัติ | `PATCH /forms/{id}` `{ "status":"pending_approval", "submittedAt":"..." }` |
| อนุมัติ | `PATCH /forms/{id}` `{ "status":"approved", "approvedBy":"...", "approvalType":"approver", "approvedAt":"..." }` |
| ปฏิเสธ | `PATCH /forms/{id}` `{ "status":"rejected", "rejectedBy":"...", "rejectionNote":"...", "rejectedAt":"..." }` |
| บังคับอนุมัติโดยเจ้าของงาน | `PATCH /forms/{id}` และเขียน `audit_logs` ด้วย `form.force_approved` |

#### Access Gate / whitelist

| กรณีใช้งาน | การเรียก mock |
|---|---|
| ตรวจสิทธิ์เข้าอีเวนต์ private | `GET /whitelist_entries?eventId={id}&uniqueField=employeeId&uniqueValue={value}&status=active&isDeleted=false` |
| อัปโหลดชุดข้อมูล | `POST /whitelist_uploads` แล้วตามด้วยหลายครั้งของ `POST /whitelist_entries` |

#### การส่งฟอร์ม

| กรณีใช้งาน | การเรียก mock |
|---|---|
| ส่งลงทะเบียน/แบบสอบถาม | `POST /submissions` แล้ว `POST /submission_answers` ทีละฟิลด์ |
| รายการลงทะเบียน | `GET /submissions?eventId={id}&formType=registration&isDeleted=false` |
| คำตอบแบบสอบถาม | `GET /submissions?eventId={id}&formType=survey` |

#### แดชบอร์ด / การปฏิบัติตามกฎ

| กรณีใช้งาน | การเรียก mock |
|---|---|
| แดชบอร์ด + วิดเจ็ต | `GET /dashboards?eventId={id}` และ `GET /dashboard_widgets?dashboardId={id}` |
| บันทึกการ unmask PII | `POST /audit_logs` โดย `action=pii.unmask` |
| ความยินยอมคุกกี้ | `POST /cookie_consents` |
| คำขอความเป็นส่วนตัว | `POST /privacy_requests` |

---

## 4. ตัวอย่าง Request และ Response

ตัวอย่างทั้งหมดใช้ `Content-Type: application/json` และ base URL `http://localhost:3000`

### 4.1 เข้าสู่ระบบแบบ mock

**Request**

```http
GET /users?email=owner@example.com&password=password123
```

**Response `200`**

```json
[
  {
    "id": "2",
    "name": "ธนวัฒน์ เกตุยา",
    "email": "owner@example.com",
    "password": "password123",
    "phone": "0810000002",
    "role": "event_owner",
    "status": "active",
    "ownerId": null,
    "canViewSensitiveData": true,
    "isDeleted": false,
    "deletedAt": null,
    "anonymizedAt": null,
    "createdAt": "2026-09-02T02:00:00Z",
    "updatedAt": "2026-09-02T02:00:00Z"
  }
]
```

ถ้าได้ `[]` ว่าง แสดงว่าอีเมลหรือรหัสผ่านไม่ถูกต้องในแพทเทิร์น mock นี้

### 4.2 รายการอีเวนต์ที่เผยแพร่แล้ว

**Request**

```http
GET /events?status=published&isDeleted=false&_sort=startAt&_order=asc
```

**Response `200` (ตัดบางส่วน)**

```json
[
  {
    "id": "3",
    "name": {
      "th": "Community Night Bangkok",
      "en": "Community Night Bangkok"
    },
    "description": {
      "th": "มีตติ้งชุมชนที่กำลังเปิดรับลงทะเบียนอยู่ในช่วงเวลางาน",
      "en": "A community meetup currently open for registration during the event window."
    },
    "ownerId": "3",
    "createdBy": "3",
    "type": "public",
    "status": "published",
    "startAt": "2026-10-10T11:00:00Z",
    "endAt": "2026-10-12T15:00:00Z",
    "publishedAt": "2026-10-05T02:00:00Z",
    "closedAt": null,
    "accessGateField": null,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-10-01T04:00:00Z",
    "updatedAt": "2026-10-05T02:00:00Z"
  }
]
```

### 4.3 สร้างอีเวนต์แบบร่าง

**Request**

```http
POST /events
Content-Type: application/json

{
  "name": {
    "th": "Developer Meetup",
    "en": "Developer Meetup"
  },
  "description": {
    "th": "มีตติ้งสาธารณะรายเดือน",
    "en": "Monthly public meetup"
  },
  "ownerId": "2",
  "createdBy": "2",
  "type": "public",
  "status": "draft",
  "startAt": "2026-12-20T11:00:00Z",
  "endAt": "2026-12-20T14:00:00Z",
  "publishedAt": null,
  "closedAt": null,
  "accessGateField": null,
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2026-10-12T10:00:00Z",
  "updatedAt": "2026-10-12T10:00:00Z"
}
```

**Response `201`**

```json
{
  "id": "9",
  "name": {
    "th": "Developer Meetup",
    "en": "Developer Meetup"
  },
  "status": "draft",
  "type": "public",
  "ownerId": "2"
}
```

### 4.4 ดึงฟอร์มลงทะเบียนที่อนุมัติแล้วด้วย slug

**Request**

```http
GET /forms?slug=community-night-register&status=approved&isDeleted=false
```

**Response `200` (ตัดบางส่วน)**

```json
[
  {
    "id": "6",
    "eventId": "3",
    "type": "registration",
    "title": "ลงทะเบียน Community Night",
    "slug": "community-night-register",
    "status": "approved",
    "approvalType": "self",
    "approvedBy": "3"
  }
]
```

### 4.5 โหลดเซ็กชัน ฟิลด์ และตัวเลือกของฟอร์ม

**Request**

```http
GET /form_sections?formId=6&_sort=sortOrder&_order=asc
GET /form_fields?formId=6&_sort=sortOrder&_order=asc
GET /form_fields?sectionId=17&_sort=sortOrder&_order=asc
GET /form_field_options?fieldId=41
```

**ตัวอย่างเซ็กชัน (ภาษาไทย)**

```json
{
  "id": "17",
  "formId": "6",
  "key": "content_th",
  "title": "แบบฟอร์มภาษาไทย",
  "lang_type": "th",
  "sortOrder": 0,
  "isDeleted": false,
  "deletedAt": null
}
```

**ตัวอย่างฟิลด์**

```json
{
  "id": "41",
  "formId": "6",
  "sectionId": "17",
  "name": "interests",
  "label": "หัวข้อที่สนใจ",
  "type": "checkbox",
  "required": true,
  "sensitive": false,
  "sortOrder": 5
}
```

### 4.6 ตรวจ Access Gate (อีเวนต์ private)

**Request**

```http
GET /whitelist_entries?eventId=2&uniqueField=employeeId&uniqueValue=EMP001&status=active&isDeleted=false
```

**Response เมื่อพบข้อมูล `200`**

```json
[
  {
    "id": "1",
    "eventId": "2",
    "uploadId": "1",
    "uniqueField": "employeeId",
    "uniqueValue": "EMP001",
    "record": {
      "employeeId": "EMP001",
      "fullName": "นรินทร์ ศรีสุข",
      "email": "narin@example.com",
      "department": "product"
    },
    "status": "active",
    "isDeleted": false
  }
]
```

ถ้าไม่พบ → ได้ `[]` → client ต้องบล็อกการเข้าฟอร์ม

### 4.7 ส่งฟอร์มลงทะเบียน

**ขั้นตอนที่ 1 — สร้าง submission**

```http
POST /submissions
Content-Type: application/json

{
  "formId": "6",
  "eventId": "3",
  "formType": "registration",
  "participantId": "11",
  "whitelistEntryId": null,
  "status": "submitted",
  "submittedAt": "2026-10-12T11:00:00Z",
  "isAnonymized": false,
  "anonymizedAt": null,
  "isDeleted": false,
  "deletedAt": null
}
```

**ขั้นตอนที่ 2 — สร้างคำตอบ**

```http
POST /submission_answers
Content-Type: application/json

{
  "submissionId": "60",
  "fieldId": "41",
  "value": null,
  "values": ["meetup", "food"]
}
```

ฟิลด์ค่าเดียวใช้ `value` และตั้ง `values: []`

### 4.8 อนุมัติ / ปฏิเสธฟอร์ม

**อนุมัติ**

```http
PATCH /forms/4
Content-Type: application/json

{
  "status": "approved",
  "approvedAt": "2026-10-12T12:00:00Z",
  "approvedBy": "6",
  "approvalType": "approver",
  "rejectionNote": null
}
```

**ปฏิเสธ**

```http
PATCH /forms/10
Content-Type: application/json

{
  "status": "rejected",
  "rejectedAt": "2026-10-12T12:05:00Z",
  "rejectedBy": "4",
  "rejectionNote": "กรุณาเพิ่มเบอร์โทรศัพท์เป็น Sensitive Field และใส่ตัวเลือกขนาดเสื้อให้ครบก่อนส่งใหม่"
}
```

### 4.9 บันทึก audit เมื่อ unmask PII

```http
POST /audit_logs
Content-Type: application/json

{
  "userId": "1",
  "eventId": "8",
  "action": "pii.unmask",
  "entity": "form_fields",
  "entityId": "112",
  "fieldId": "112",
  "metadata": { "reason": "pdpa_review" },
  "createdAt": "2026-10-12T12:10:00Z"
}
```

### 4.10 Soft delete (แนะนำแทน DELETE)

```http
PATCH /forms/3
Content-Type: application/json

{
  "isDeleted": true,
  "deletedAt": "2026-10-12T12:15:00Z"
}
```

---

## 5. Authentication และ Authorization

### 5.1 Authentication (mock)

Mock API นี้ **ไม่มี** JWT หรือ session middleware

โฟลว์ auth แบบ mock ที่แนะนำฝั่ง client:

1. `GET /users?email={email}&password={password}&status=active&isDeleted=false`
2. ถ้าได้ผู้ใช้ 1 คน ให้เก็บอ็อบเจกต์ผู้ใช้ (หรือ `id`) เป็นหลักของเซสชัน
3. ใช้บริบทผู้ใช้นั้นตัดสินใจว่าจะแสดงหน้าจอ/ปุ่มใดได้บ้าง

บัญชีตัวอย่าง (รหัสผ่านทุกบัญชี: `password123`):

| อีเมล | บทบาท | หมายเหตุ |
|---|---|---|
| `admin@example.com` | `super_admin` | เข้าถึงทั้งระบบ + ข้อมูลอ่อนไหว |
| `owner@example.com` | `event_owner` | ได้รับสิทธิ์ดูข้อมูลอ่อนไหวแล้ว |
| `mali.owner@example.com` | `event_owner` | **ยังไม่**ได้รับสิทธิ์ดูข้อมูลอ่อนไหว |
| `pim.owner@example.com` | `event_owner` | ได้รับสิทธิ์ดูข้อมูลอ่อนไหวแล้ว |
| `nicha@example.com` | `sub_user` | Approver & Publisher |
| `kittisak@example.com` | `sub_user` | Check-in / ดูรายชื่อลงทะเบียน |
| `narin@example.com` | `participant` | ผู้เข้าร่วมสาธารณะ |

### 5.2 โมเดล Authorization (RBAC)

#### บทบาทระดับระบบ

| บทบาท | ความสามารถ |
|---|---|
| `super_admin` | จัดการ owner, ดูข้อมูลทั้งหมด, ดูข้อมูลอ่อนไหวและ audit log ทั้งระบบเสมอ, กู้คืนรายการที่ soft-delete, ดำเนินการคำขอความเป็นส่วนตัว |
| `event_owner` | จัดการอีเวนต์/ฟอร์ม/แดชบอร์ด/ผู้ใช้ย่อยของตนเอง; อนุมัติเองหรือบังคับอนุมัติได้; ดูข้อมูลอ่อนไหวได้เฉพาะเมื่อ `canViewSensitiveData=true` |
| `sub_user` | ความสามารถขึ้นกับ `roles` + `permissions` และการมอบหมายใน `event_users` |
| `participant` | ดูอีเวนต์ตามสิทธิ์, ส่งลงทะเบียน/แบบสอบถาม, จัดการความยินยอมของตนเอง |

#### สิทธิ์แบบละเอียด

แต่ละแถวใน `permissions` ผูก `roleId` + `feature` กับแฟล็ก:

`access`, `view`, `create`, `edit`, `delete`, `approve`, `publish`

ตัวอย่าง (บทบาท Event Manager):

```json
{
  "roleId": "1",
  "feature": "events",
  "access": true,
  "view": true,
  "create": true,
  "edit": true,
  "delete": true,
  "approve": true,
  "publish": true
}
```

วิธีตรวจสิทธิ์ของ Sub-User:

1. หา `event_users` ของ `(eventId, userId)` ที่ `status=active`
2. โหลด `permissions` ของ `roleId` นั้น
3. อนุญาตการกระทำเฉพาะเมื่อแฟล็กของฟีเจอร์เป็น true

### 5.3 นโยบายข้อมูลอ่อนไหว

| ผู้กระทำ | ดู PII ดิบได้หรือไม่ |
|---|---|
| Super Admin | ได้ |
| Event Owner ที่ `canViewSensitiveData=true` | ได้ เฉพาะอีเวนต์ของตนเอง |
| Event Owner ที่ยังไม่ได้รับสิทธิ์ | ไม่ได้ — ต้องแสดงค่าที่ mask |
| Sub-User | ได้เฉพาะเมื่อนโยบายผลิตภัณฑ์อนุญาต (ค่าเริ่มต้น: ไม่ได้) |
| Participant | ได้เฉพาะข้อมูลของตนเอง |

ข้อกำหนดฝั่ง production จาก SRS: การ mask ต้องทำที่ **ชั้น backend/API** ไม่ใช่แค่ UI Mock นี้ส่งค่าดิบกลับมา; frontend ควรจำลองการ mask จนกว่าจะมี API จริงที่ปลอดภัย

ทุกครั้งที่ unmask หรือแก้ไขฟิลด์อ่อนไหว ควรสร้าง `audit_logs` (`pii.unmask`, `pii.updated`)

### 5.4 ประตูสิทธิ์ตามวงจรชีวิต

| การกระทำ | ผู้มีสิทธิ์ | เงื่อนไข |
|---|---|---|
| เผยแพร่อีเวนต์ | Owner / Publisher | ไม่มีฟอร์ม active หรือฟอร์ม active ทั้งหมดเป็น `approved` |
| อนุมัติฟอร์ม | บทบาท Approver, Owner อนุมัติเอง หรือ Owner บังคับอนุมัติ | การปฏิเสธต้องมี `rejectionNote` |
| เข้าฟอร์ม private | Participant | ค่า unique field ตรงกับ whitelist |
| ส่งฟอร์ม | Participant | อีเวนต์เป็น `published` และอยู่ในช่วงเวลาที่กำหนด |
| ดู audit log ทั้งระบบ | Super Admin; Owner ได้เฉพาะเมื่อได้รับสิทธิ์และอยู่ในขอบเขตอีเวนต์ | Owner กรอง `audit_logs` ด้วย `eventId` |

---

## 6. Error Responses

### 6.1 ข้อผิดพลาดเริ่มต้นของ JSON Server

| HTTP | เมื่อใด | เนื้อหา |
|---|---|---|
| `404` | ไม่พบ id หรือเส้นทาง | ว่าง / not found |
| `400` | JSON body ไม่ถูกต้อง | ข้อความจาก parser |
| `500` | เซิร์ฟเวอร์ล้มเหลวโดยไม่คาดคิด | ข้อความ error |

ตัวอย่าง id ที่ไม่มี:

```http
GET /events/9999
```

```text
HTTP/1.1 404 Not Found
```

### 6.2 สัญญา error ระดับแอป (แนะนำสำหรับ API จริง)

เมื่อแทนที่ JSON Server ด้วย backend จริง แนะนำให้ใช้ envelope เดียวกัน:

```json
{
  "error": {
    "code": "EVENT_NOT_PUBLISHABLE",
    "message": "ไม่สามารถเผยแพร่อีเวนต์ได้จนกว่าแบบฟอร์มที่ผูกอยู่จะได้รับการอนุมัติทั้งหมด",
    "details": {
      "eventId": "2",
      "blockingFormIds": ["4", "5"]
    }
  }
}
```

### 6.3 รหัส error ของโดเมนที่แนะนำ

| รหัส | HTTP | ความหมาย |
|---|---|---|
| `UNAUTHORIZED` | 401 | ไม่มีหรือข้อมูลรับรองไม่ถูกต้อง |
| `FORBIDDEN` | 403 | เข้าสู่ระบบแล้วแต่ไม่มีสิทธิ์ / ไม่ได้รับสิทธิ์ดูข้อมูลอ่อนไหว |
| `NOT_FOUND` | 404 | ไม่พบทรัพยากร หรือถูก soft-delete และซ่อนไว้ |
| `VALIDATION_ERROR` | 422 | payload ไม่ผ่าน schema หรือกฎธุรกิจ |
| `ACTIVE_EVENT_LIMIT` | 409 | Owner มี active published event อยู่แล้ว |
| `FORM_QUOTA_EXCEEDED` | 409 | มีฟอร์มลงทะเบียน/แบบสอบถามที่ active อยู่แล้ว |
| `FORM_NOT_APPROVED` | 409 | เผยแพร่ไม่ได้เพราะติดประตูอนุมัติฟอร์ม |
| `ACCESS_GATE_DENIED` | 403 | ค่า unique field ไม่ตรง whitelist |
| `EVENT_NOT_OPEN` | 403 | นอกช่วงเวลา / ปิดแล้ว / ลิงก์สาธารณะยังเป็น draft |
| `REJECTION_NOTE_REQUIRED` | 422 | ปฏิเสธโดยไม่มีหมายเหตุ |
| `SENSITIVE_DATA_MASKED` | 200* | สำเร็จแต่ส่งค่าที่ mask ให้ผู้ชมที่ไม่มีสิทธิ์ |
| `PRIVACY_REQUEST_PENDING` | 409 | มีคำขอ Right to be Forgotten ค้างอยู่แล้ว |

\* การ mask อาจยังตอบ HTTP 200 พร้อมค่าที่ปกปิด แทนการทำให้ทั้งคำขอล้มเหลว

### 6.4 ตัวอย่าง error ของโดเมน

**ถูกบล็อกการเผยแพร่**

```json
{
  "error": {
    "code": "FORM_NOT_APPROVED",
    "message": "ไม่สามารถเผยแพร่อีเวนต์ได้ขณะที่ฟอร์มยังรออนุมัติหรือถูกปฏิเสธ",
    "details": {
      "eventId": "2",
      "forms": [
        { "id": "4", "type": "registration", "status": "pending_approval" },
        { "id": "5", "type": "survey", "status": "draft" }
      ]
    }
  }
}
```

**Access Gate ปฏิเสธ**

```json
{
  "error": {
    "code": "ACCESS_GATE_DENIED",
    "message": "ไม่พบค่า unique field ใน whitelist ของอีเวนต์",
    "details": {
      "eventId": "2",
      "uniqueField": "employeeId",
      "uniqueValue": "EMP999"
    }
  }
}
```

**ห้ามเข้าถึงข้อมูลอ่อนไหว**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "ผู้ชมไม่มีสิทธิ์เข้าถึงค่าข้อมูลอ่อนไหวแบบดิบ",
    "details": {
      "userId": "3",
      "canViewSensitiveData": false,
      "fieldIds": ["38", "39"]
    }
  }
}
```

---

## 7. สรุปข้อมูลตัวอย่าง (Seed Data)

ปริมาณข้อมูล mock ปัจจุบัน:

| ทรัพยากร | จำนวน |
|---|---|
| users | 30 |
| roles | 6 |
| permissions | 48 |
| events | 8 |
| forms | 16 |
| form_sections | 32 |
| form_fields | 246 |
| form_field_options | 274 |
| submissions | 59 |
| submission_answers | 521 |
| whitelist_entries | 26 |
| audit_logs | 22 |

สถานการณ์ที่ใส่ไว้แล้ว:

- อีเวนต์สาธารณะที่เผยแพร่และอยู่ในช่วงเวลางาน (`Community Night Bangkok`)
- อีเวนต์สาธารณะที่เผยแพร่แล้วยังไม่ถึงวันเริ่ม (`Technology Conference 2026`)
- แบบร่าง private ที่รออนุมัติและมี whitelist (`Internal Product Workshop`)
- ฟอร์มลงทะเบียนที่ถูกปฏิเสธ (`Campus Hackathon`)
- อีเวนต์ private ที่ถูกบังคับอนุมัติแล้วเผยแพร่ (`Alumni Dinner`)
- อีเวนต์ที่ปิดแล้วพร้อมข้อมูลแดชบอร์ด/รายงาน (`Q3 Townhall`, `Design Critique`)
- อีเวนต์/ฟอร์มที่ soft-delete, คำตอบที่ anonymize และคำขอความเป็นส่วนตัวหลายสถานะ

---

## 8. คู่มือสั้นสำหรับการพัฒนาในเครื่อง

```bash
# ติดตั้ง
npm install

# รัน API
npm start

# ตัวอย่าง
curl "http://localhost:3000/events?status=published"
curl "http://localhost:3000/forms?eventId=3&isDeleted=false"
curl "http://localhost:3000/form_sections?formId=6&_sort=sortOrder&_order=asc"
curl "http://localhost:3000/form_fields?formId=6&sectionId=17&_sort=sortOrder&_order=asc"
curl "http://localhost:3000/submissions?eventId=3&formType=registration"
curl -X PATCH http://localhost:3000/events/2 \
  -H "Content-Type: application/json" \
  -d '{"status":"published","publishedAt":"2026-10-12T12:00:00Z"}'
```

ไฟล์ที่เกี่ยวข้อง:

- ข้อมูล: `db.json`
- แผนภาพ schema: `database-schema.png` (ต้นทาง `database-schema.dbml`)
- สคริปต์แพ็กเกจ: `npm start`

---

## 9. การควบคุมเอกสาร

| เวอร์ชัน | วันที่ | ผู้จัดทำ | รายละเอียด |
|---|---|---|---|
| 1.0.0 | 2026-10-12 | Backend mock docs | เอกสารทางเทคนิคฝั่ง Backend ฉบับแรก สอดคล้องกับ schema ใน `db.json` และเส้นทางของ JSON Server |
| 1.0.1 | 2026-10-12 | Backend mock docs | แปลเอกสารทั้งฉบับเป็นภาษาไทย |
| 1.1.0 | 2026-10-16 | Backend mock docs | Form Engine ใช้ Section Branching (Route by language choice); เพิ่ม `form_sections.lang_type` (string), `forms.branchingMode`, `form_fields.sectionId` |
| 1.1.1 | 2026-10-16 | Backend mock docs | ลบเซ็กชัน `language_choice`; สลับภาษาด้วย UI switch; pre-save คำตอบด้วย `name` ใน localStorage/cookie |
| 1.1.2 | 2026-10-16 | Backend mock docs | `events.name` / `events.description` เป็น map หลายภาษา (`Record<string, string>` คีย์ `th`/`en`) |
| 1.1.3 | 2026-10-16 | Backend mock docs | อัปเดต ER schema (`database-schema.dbml` + `.png`) เพิ่ม `form_sections` และฟิลด์ i18n/branching |

**Google Doc เป้าหมาย:** https://docs.google.com/document/d/11oA9XmM2_fsHN7igaOVguOY_Yj_OQwMMSE07Te7Lqs4/edit
