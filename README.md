# Event Management Mock API (JSON Server)

Mock REST API ตามสคีมาใน `db.md` (SRS Draft v2.1.0) ใช้ JSON Server

## ความต้องการ
- Node.js

## ติดตั้งและรัน

```bash
npm install
npm start
```

Base URL: `http://localhost:3000`

สร้าง `db.json` ใหม่จากสคริปต์ (ถ้าแก้ seed):

```bash
npm run seed
```

## ตัวอย่างคำสั่ง

```bash
# อีเวนต์
curl http://localhost:3000/events
curl "http://localhost:3000/events?status=published"

# roles / role_permissions
curl "http://localhost:3000/roles?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/role_permissions?role_id=5f4490f8-41ca-5d29-8032-879f4966d95d"

# dashboard layout + widgets
curl "http://localhost:3000/dashboard_layouts?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/dashboard_widgets?layout_id=c57d8bf9-e30a-58b1-9eb0-9f4c4b96e7e5"

# เนื้อหาหลายภาษา (th / en)
curl "http://localhost:3000/event_translations?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/event_translations?locale_code=en"

# ฟอร์ม + คำแปล
curl "http://localhost:3000/forms?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/form_translations?form_id=89e426a3-3b34-50f1-821f-d485abab001b"

# ฟิลด์ + ตัวเลือก + คำแปล
curl "http://localhost:3000/form_fields?form_id=89e426a3-3b34-50f1-821f-d485abab001b"
curl "http://localhost:3000/field_translations?locale_code=th"
curl "http://localhost:3000/field_options?field_id=a524e451-6403-5262-b13c-d6170703eb9a"

# คำตอบที่ส่งแล้ว
curl "http://localhost:3000/form_submissions?status=submitted"
curl "http://localhost:3000/submission_answers?submission_id=38e9ffaf-77bc-51bb-a286-3544c352c9eb"
```

> `id` ทั้งหมดเป็น UUID (string) ตามสคีมาใน `db.md` — ค่าซ้ำได้ทุกครั้งที่รัน `npm run seed`  
> ตาราง composite / PK อื่น (เช่น `role_permissions`, `registrations`, `answer_option_selections`) ใช้คีย์ตาม `db.md` โดยไม่มี `id` แยก — query ด้วยฟิลด์ที่เกี่ยวข้อง

## ทรัพยากรหลัก (ตาม `db.md`)

| Path | หมายเหตุ |
|---|---|
| `/users` | บัญชีแอดมิน (`system_role`, `event_id`, `role_id`, `password`) |
| `/roles` | Custom Role ต่ออีเวนต์ |
| `/role_permissions` | สิทธิ์ 7 รหัสต่อ role (`permission_code`) |
| `/dashboard_layouts` | 1 layout ต่ออีเวนต์ |
| `/dashboard_widgets` | Number / Comparison / Chart บน layout |
| `/events` | อีเวนต์ (สถานะ, slug, timezone) |
| `/event_translations` | ชื่อ/รายละเอียดอีเวนต์แยก `th` `en` + `display_order` |
| `/forms` | registration / survey ต่ออีเวนต์ |
| `/form_translations` | ชื่อฟอร์ม / คำอธิบาย ตามภาษา |
| `/form_fields` | นิยามฟิลด์ |
| `/field_translations` | label / placeholder ตามภาษา |
| `/field_options` | ตัวเลือก radio/checkbox/dropdown |
| `/field_option_translations` | label ตัวเลือกตามภาษา |
| `/registration_settings` | capacity, unique_field_id, whitelist |
| `/whitelist_entries` | รายชื่อสิทธิ์ลงทะเบียน |
| `/form_submissions` | header การส่งฟอร์ม |
| `/registrations` | ลงทะเบียน (`confirmation_code`, PK = `submission_id`) |
| `/submission_answers` | คำตอบแบบ typed columns |
| `/answer_option_selections` | ตัวเลือกที่เลือก (composite `answer_id` + `option_id`) |
| `/approval_requests` | คำขออนุมัติ |
| `/trash_items` | ถังขยะ soft-delete |
| `/hard_delete_requests` | คำขอลบถาวร / PDPA |
| `/audit_logs` | audit |

ภาษาเนื้อหาสาธารณะอยู่ที่ตาราง `*_translations` โดยใช้ `locale_code` เป็น `th` หรือ `en`  
ภาษาที่ผู้เข้าร่วมส่งฟอร์มเก็บที่ `form_submissions.submitted_language`

## Deploy บน Vercel

ผ่าน `api/server.js` + `vercel.json`

```bash
npm i -g vercel
vercel
vercel --prod
```

ตัวอย่าง:
```bash
curl "https://your-project.vercel.app/events?status=published"
curl "https://your-project.vercel.app/event_translations?locale_code=th"
```

### ให้ POST/PUT/PATCH/DELETE ถาวรบน Vercel (Upstash Redis)

Filesystem บน Vercel เขียนไม่ได้ — mock จึงเก็บ snapshot ทั้งก้อน `db.json` ลง Redis

1. สร้าง Redis ฟรีที่ [Upstash](https://upstash.com/) → สร้าง database → คัดลอก REST credentials
2. ใน Vercel project ของ mock API ตั้ง Environment Variables (Production + Preview):

| ตัวแปร | ค่า |
|---|---|
| `UPSTASH_REDIS_REST_URL` | จาก Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | จาก Upstash |
| `MOCK_DB_REDIS_KEY` | (ทางเลือก) คีย์เก็บ snapshot ค่าเริ่มต้น `eventmockapi:db:v1` |

3. Redeploy mock API
4. ตรวจว่า response มี header `X-Mock-Persist: redis` (ถ้าเป็น `memory` แปลว่ายังไม่ได้ตั้ง Redis)

ครั้งแรกที่ hydrate จะ seed จาก `db.json` ลง Redis จากนั้น mutation จะอัปเดต Redis ก่อนส่ง response

รีเซ็ตข้อมูล: ลบ key ใน Upstash console (หรือเปลี่ยน `MOCK_DB_REDIS_KEY`) แล้วเรียก API อีกครั้งเพื่อ seed ใหม่

ถ้าไม่ตั้ง Redis บน Vercel จะกลับไปโหมด memory เดิม (หายหลัง cold start)

## หมายเหตุ
- JSON Server ให้ CRUD ตาม array ใน `db.json`
- ความสัมพันธ์อ้างด้วย id ไม่บังคับ foreign key
- ข้อมูลตัวอย่างเท่านั้น อย่าใช้ใน production
- แผนสคีมาต้นทาง: `db.md`
- Local (`npm start`) ยังเขียน `db.json` ตรงๆ ไม่ต้องใช้ Redis
