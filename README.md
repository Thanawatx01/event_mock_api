# Event Management Mock API (JSON Server)

Mock REST API สำหรับ Event + Survey Management Platform ใช้กับ JSON Server

## ความต้องการ
- Node.js

## ติดตั้งและรัน

```bash
npm install
npm start
```

Base URL: `http://localhost:3000`

## ตัวอย่างคำสั่ง

```bash
# รายการอีเวนต์
curl http://localhost:3000/events

# กรองอีเวนต์ที่เผยแพร่แล้ว
curl "http://localhost:3000/events?status=published"

# ฟอร์มของอีเวนต์
curl "http://localhost:3000/forms?eventId=3&isDeleted=false"

# คำตอบการลงทะเบียน
curl "http://localhost:3000/submissions?eventId=3&formType=registration"
```

## ทรัพยากรหลัก
- `/users`, `/roles`, `/permissions`
- `/events`, `/event_users`, `/event_branding`
- `/forms`, `/form_sections`, `/form_fields`, `/form_field_options`
- `/whitelist_uploads`, `/whitelist_entries`
- `/submissions`, `/submission_answers`
- `/dashboards`, `/dashboard_widgets`
- `/audit_logs`, `/cookie_consents`, `/privacy_requests`

## Deploy บน Vercel

โปรเจกต์นี้พร้อม deploy เป็น serverless API แล้ว ผ่าน `api/server.js` + `vercel.json`

### วิธีที่ 1: ผ่านเว็บ Vercel
1. ไปที่ [vercel.com/new](https://vercel.com/new)
2. Import repo `Thanawatx01/event_mock_api`
3. Framework Preset ปล่อยเป็น Other / ไม่ต้องตั้งค่าอะไรเพิ่ม
4. กด **Deploy**
5. เรียก API จาก URL ที่ได้ เช่น `https://your-project.vercel.app/events`

### วิธีที่ 2: ผ่าน Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
# production
vercel --prod
```

ตัวอย่างหลัง deploy:
```bash
curl "https://your-project.vercel.app/events?status=published"
curl "https://your-project.vercel.app/forms?eventId=3&isDeleted=false"
```

### ข้อจำกัดบน Vercel
- **อ่านข้อมูล (GET)** ใช้งานได้ปกติ
- **เขียนข้อมูล (POST / PUT / PATCH / DELETE)** อาจไม่ถาวร เพราะ filesystem ของ serverless ไม่ persist ข้าม request
- เหมาะกับ mock/read สำหรับ frontend; ถ้าต้องการเขียนข้อมูลถาวร ควรใช้ database จริงหรือบริการอื่น

## เอกสาร
ดูรายละเอียดใน `BACKEND_TECHNICAL_DOCUMENTATION.md`

แผนภาพ ER: `database-schema.png` (ต้นทาง `database-schema.dbml`)

## หมายเหตุ
- JSON Server ให้ CRUD พื้นฐานตาม array ใน `db.json`
- ความสัมพันธ์อ้างด้วย id ไม่มีการบังคับ foreign key
- ข้อมูลนี้ใช้ทดสอบเท่านั้น อย่าใช้รหัสผ่านตัวอย่างใน production
