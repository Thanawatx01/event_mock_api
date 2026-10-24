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

# roles / permissions
curl "http://localhost:3000/roles?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/permissions?role_id=68bc119b-43b3-56d8-8e07-d9609a3ca230"

# หน้า Event Owner + widgets
curl "http://localhost:3000/dashboard_data?event_id=452ac247-5c88-59ca-8de7-c5a329c71317"
curl "http://localhost:3000/dashboard_widgets?dashboard_data_id=46a46a4c-048a-5032-8eb2-e3a226198a01"


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

## ทรัพยากรหลัก (ตาม `db.md`)

| Path | หมายเหตุ |
|---|---|
| `/users` | บัญชีแอดมิน / สิทธิ์ต่ออีเวนต์ (`role_id`, `password`) |
| `/roles` | บทบาทกำหนดเองของ Event Admin |
| `/permissions` | เมทริกซ์สิทธิ์ราย feature ของแต่ละ role |
| `/dashboard_data` | หน้าของ Event Owner ต่ออีเวนต์ (overview, registrations, …) |
| `/dashboard_widgets` | วิดเจ็ตบนแต่ละหน้า dashboard |
| `/events` | อีเวนต์ (สถานะ, สโลแกน, timezone) |
| `/event_translations` | ชื่อ/รายละเอียดอีเวนต์แยก `th` `en` |
| `/forms` | registration / survey ต่ออีเวนต์ |
| `/form_translations` | ชื่อฟอร์ม / คำอธิบาย ตามภาษา |
| `/form_fields` | นิยามฟิลด์ |
| `/field_translations` | label / placeholder ตามภาษา |
| `/field_options` | ตัวเลือก radio/checkbox/dropdown |
| `/field_option_translations` | label ตัวเลือกตามภาษา |
| `/registration_settings` | capacity, duplicate, whitelist |
| `/whitelist_entries` | รายชื่อสิทธิ์ลงทะเบียน |
| `/form_submissions` | header การส่งฟอร์ม |
| `/registrations` | ข้อมูลลงทะเบียน (reference_code) |
| `/submission_answers` | คำตอบแบบ typed columns |
| `/answer_option_selections` | ตัวเลือกที่เลือก |
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

### ข้อจำกัดบน Vercel
- **GET** ใช้งานได้ปกติ
- **POST / PUT / PATCH / DELETE** อาจไม่ถาวรบน serverless filesystem

## หมายเหตุ
- JSON Server ให้ CRUD ตาม array ใน `db.json`
- ความสัมพันธ์อ้างด้วย id ไม่บังคับ foreign key
- ข้อมูลตัวอย่างเท่านั้น อย่าใช้ใน production
- แผนสคีมาต้นทาง: `db.md`
