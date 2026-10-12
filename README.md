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
- `/forms`, `/form_fields`, `/form_field_options`
- `/whitelist_uploads`, `/whitelist_entries`
- `/submissions`, `/submission_answers`
- `/dashboards`, `/dashboard_widgets`
- `/audit_logs`, `/cookie_consents`, `/privacy_requests`

## เอกสาร
ดูรายละเอียดใน `BACKEND_TECHNICAL_DOCUMENTATION.md`

## หมายเหตุ
- JSON Server ให้ CRUD พื้นฐานตาม array ใน `db.json`
- ความสัมพันธ์อ้างด้วย id ไม่มีการบังคับ foreign key
- ข้อมูลนี้ใช้ทดสอบเท่านั้น อย่าใช้รหัสผ่านตัวอย่างใน production
