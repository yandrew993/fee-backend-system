# 🧪 Complete API Testing Guide - All Endpoints

## Prerequisites

1. **Run Database Seeding**
```bash
cd d:\fee-payment\api
npm run seed:comprehensive
# or
node scripts/seed-comprehensive.js
```

2. **Start API Server**
```bash
npm start
```

The API should be running at: `http://localhost:3000`

---

## Authentication Credentials

### Admin User
- **Email:** admin@school.com
- **Username:** admin
- **Password:** password123

### Accountant User
- **Email:** accountant1@school.com
- **Username:** accountant1
- **Password:** password123

---

## Test Data Overview

| Entity | Count | Notes |
|--------|-------|-------|
| Academic Terms | 2 | 2024-2025 (active), 2025-2026 |
| Users | 3 | 1 admin, 2 accountants |
| Classes | 6 | Form 1A, 1B, 2A, 2B, 3A, 4A |
| Students | 8 | Distributed across classes |
| Class Fees | 8 | Multiple fee types per term |
| Fee Statements | 3 | Showing different payment statuses |
| Fee Payments | 2 | Demonstrating payment tracking |
| Receipts | 2 | Payment receipts |

---

## 🔐 1. Authentication Endpoints

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "password123"
  }'
```

**Expected Response (200):**
```json
{
  "id": "user-id",
  "email": "admin@school.com",
  "username": "admin",
  "fullName": "Admin User",
  "role": "admin",
  "token": "jwt-token-here"
}
```

---

## 📅 2. Academic Term Endpoints

### Get All Academic Terms
```bash
curl http://localhost:3000/api/academic-terms \
  -H "Content-Type: application/json"
```

**Expected:** List of 2 academic terms (2024-2025, 2025-2026)

### Create Academic Term
```bash
curl -X POST http://localhost:3000/api/academic-terms \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2026-2027",
    "term1Name": "Term 1",
    "term1StartDate": "2026-01-15",
    "term1EndDate": "2026-04-15",
    "term1Duration": 4,
    "term2Name": "Term 2",
    "term2StartDate": "2026-05-15",
    "term2EndDate": "2026-08-15",
    "term2Duration": 4,
    "term3Name": "Term 3",
    "term3StartDate": "2026-09-01",
    "term3EndDate": "2026-11-30",
    "term3Duration": 3,
    "isActive": false
  }'
```

**Expected:** 201 Created with new academic term

---

## 👥 3. User Endpoints

### Get All Users
```bash
curl http://localhost:3000/api/users \
  -H "Content-Type: application/json"
```

**Expected:** 3 users (1 admin, 2 accountants)

### Get Single User
```bash
curl http://localhost:3000/api/users/{userId} \
  -H "Content-Type: application/json"
```

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.com",
    "username": "teacher1",
    "password": "password123",
    "fullName": "Mary Jane Teacher",
    "phone": "+254712345690",
    "role": "teacher"
  }'
```

**Expected:** 201 Created with new user

### Update User
```bash
curl -X PATCH http://localhost:3000/api/users/{userId} \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phone": "+254712345691"
  }'
```

---

## 🏫 4. Class Endpoints

### Get All Classes
```bash
curl http://localhost:3000/api/classes \
  -H "Content-Type: application/json"
```

**Expected:** 6 classes
```json
[
  {
    "id": "class-id-1",
    "className": "Form 1A",
    "description": "Form 1 Class A",
    "studentCount": 5,
    "_count": {
      "students": 5,
      "classFees": 3
    }
  },
  // ... more classes
]
```

### Get Single Class with Students
```bash
curl http://localhost:3000/api/classes/{classId} \
  -H "Content-Type: application/json"
```

**Expected:** Class details with all students and fees

### Create Class
```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "className": "Form 5A",
    "description": "Form 5 Class A"
  }'
```

---

## 👨‍🎓 5. Student Endpoints

### Get All Students
```bash
curl http://localhost:3000/api/students \
  -H "Content-Type: application/json"
```

**Expected:** 8 students with details

### Get Students by Class
```bash
curl "http://localhost:3000/api/students?classId={classId}" \
  -H "Content-Type: application/json"
```

### Get Single Student
```bash
curl http://localhost:3000/api/students/{studentId} \
  -H "Content-Type: application/json"
```

**Expected:**
```json
{
  "id": "student-id",
  "admissionNumber": "ADM001",
  "fullName": "John Michael Smith",
  "gender": "Male",
  "parentName": "Michael Smith Sr.",
  "parentPhone": "+254712345681",
  "status": "active",
  "classId": "form1a-id",
  "class": {
    "className": "Form 1A"
  },
  "feeStatements": [...]
}
```

### Create Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "admissionNumber": "ADM009",
    "fullName": "New Thomas Wilson",
    "gender": "Male",
    "parentName": "Thomas Wilson Sr.",
    "parentPhone": "+254712345699",
    "classId": "{classId}",
    "status": "active"
  }'
```

### Update Student
```bash
curl -X PATCH http://localhost:3000/api/students/{studentId} \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Michael Smith Updated",
    "parentPhone": "+254712345692"
  }'
```

---

## 💰 6. Class Fee Endpoints

### Get All Class Fees
```bash
curl http://localhost:3000/api/class-fees \
  -H "Content-Type: application/json"
```

**Expected:** 8 class fees with details

### Get Fees for Specific Class
```bash
curl "http://localhost:3000/api/class-fees?classId={classId}" \
  -H "Content-Type: application/json"
```

### Get Fees for Specific Term
```bash
curl "http://localhost:3000/api/class-fees?classId={classId}&term=term1" \
  -H "Content-Type: application/json"
```

### Get Single Class Fee
```bash
curl http://localhost:3000/api/class-fees/{feeId} \
  -H "Content-Type: application/json"
```

**Expected:**
```json
{
  "id": "fee-id",
  "name": "Tuition",
  "classId": "class-id",
  "className": "Form 1A",
  "term": "term1",
  "amount": 5000,
  "termStartDate": "2024-01-15T00:00:00.000Z",
  "termEndDate": "2024-04-15T00:00:00.000Z",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "description": "Monthly tuition fee",
  "isRecurring": true
}
```

### Create Class Fee
```bash
curl -X POST http://localhost:3000/api/class-fees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Library Fee",
    "classId": "{classId}",
    "className": "Form 1A",
    "term": "term1",
    "amount": 200,
    "termStartDate": "2024-01-15",
    "termEndDate": "2024-04-15",
    "dueDate": "2024-02-15",
    "description": "School library membership",
    "isRecurring": true
  }'
```

---

## 📋 7. Student Fee Statement Endpoints

### Get All Fee Statements
```bash
curl http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json"
```

**Expected:** 3 statements

### Get Statements with Filters

**By Status (Pending):**
```bash
curl "http://localhost:3000/api/student-fee-statements?status=pending" \
  -H "Content-Type: application/json"
```

**By Academic Year:**
```bash
curl "http://localhost:3000/api/student-fee-statements?academicYear=2024-2025" \
  -H "Content-Type: application/json"
```

**By Term:**
```bash
curl "http://localhost:3000/api/student-fee-statements?term=term1" \
  -H "Content-Type: application/json"
```

**By Student:**
```bash
curl "http://localhost:3000/api/student-fee-statements?studentId={studentId}" \
  -H "Content-Type: application/json"
```

### Get Single Statement
```bash
curl http://localhost:3000/api/student-fee-statements/{statementId} \
  -H "Content-Type: application/json"
```

**Expected:**
```json
{
  "id": "statement-id",
  "studentId": "student-id",
  "academicYear": "2024-2025",
  "term": "term1",
  "currentTermFee": 5800,
  "previousBalance": 0,
  "totalPayable": 5800,
  "amountPaid": 2000,
  "balanceAmount": 3800,
  "status": "pending",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "student": {
    "fullName": "Jane Elizabeth Doe",
    "admissionNumber": "ADM002",
    "class": {
      "className": "Form 1A"
    }
  },
  "feePayments": [...]
}
```

### Get Student Fee Summary
```bash
curl http://localhost:3000/api/student-fee-statements/summary/{studentId} \
  -H "Content-Type: application/json"
```

**Expected:**
```json
{
  "student": {
    "fullName": "Jane Elizabeth Doe",
    "admissionNumber": "ADM002",
    "class": {
      "className": "Form 1A"
    }
  },
  "totalStatements": 1,
  "totalFeesOwed": 5800,
  "totalPaid": 2000,
  "totalBalance": 3800,
  "statements": [...]
}
```

### Create Single Statement
```bash
curl -X POST http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "{studentId}",
    "academicYear": "2024-2025",
    "term": "term2",
    "termStartDate": "2024-05-15",
    "termEndDate": "2024-08-15",
    "dueDate": "2024-06-15"
  }'
```

### Bulk Create Statements for Class
```bash
curl -X POST http://localhost:3000/api/student-fee-statements/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "{classId}",
    "academicYear": "2024-2025",
    "term": "term2",
    "termStartDate": "2024-05-15",
    "termEndDate": "2024-08-15",
    "dueDate": "2024-06-15"
  }'
```

**Expected:** 201 Created with statements for all students in class

### Record Payment (Update Statement)
```bash
curl -X PATCH http://localhost:3000/api/student-fee-statements/{statementId} \
  -H "Content-Type: application/json" \
  -d '{
    "amountPaid": 4000,
    "notes": "Second installment payment"
  }'
```

**Expected:** Updated statement with new balance automatically calculated

### Delete Statement
```bash
curl -X DELETE http://localhost:3000/api/student-fee-statements/{statementId} \
  -H "Content-Type: application/json"
```

**Note:** Can only delete if no payments exist

---

## 💳 8. Fee Payment Endpoints

### Get All Fee Payments
```bash
curl http://localhost:3000/api/fee-payments \
  -H "Content-Type: application/json"
```

**Expected:** 2 fee payments

### Get Payments by Status
```bash
curl "http://localhost:3000/api/fee-payments?status=completed" \
  -H "Content-Type: application/json"
```

### Get Single Payment
```bash
curl http://localhost:3000/api/fee-payments/{paymentId} \
  -H "Content-Type: application/json"
```

### Create Fee Payment
```bash
curl -X POST http://localhost:3000/api/fee-payments \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "FP-003",
    "studentId": "{studentId}",
    "studentFeeStatementId": "{statementId}",
    "amount": 3000,
    "paymentMethod": "cash",
    "paymentDate": "2024-03-15",
    "status": "completed",
    "notes": "Partial payment",
    "createdById": "{userId}"
  }'
```

### Update Payment
```bash
curl -X PATCH http://localhost:3000/api/fee-payments/{paymentId} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

## 🧾 9. Receipt Endpoints

### Get All Receipts
```bash
curl http://localhost:3000/api/receipts \
  -H "Content-Type: application/json"
```

**Expected:** 2 receipts

### Get Single Receipt
```bash
curl http://localhost:3000/api/receipts/{receiptId} \
  -H "Content-Type: application/json"
```

### Create Receipt
```bash
curl -X POST http://localhost:3000/api/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNumber": "RCP-003",
    "studentId": "{studentId}",
    "feePaymentId": "{paymentId}",
    "amount": 3000,
    "paymentMethod": "cash",
    "paymentDate": "2024-03-15",
    "description": "Payment receipt for Term 1 tuition"
  }'
```

---

## 🔄 Complete Workflow - Step by Step

### Step 1: View Academic Terms
```bash
curl http://localhost:3000/api/academic-terms
```
✅ See 2024-2025 as active term

### Step 2: View Classes
```bash
curl http://localhost:3000/api/classes
```
✅ See Form 1A with 5 students

### Step 3: View Students in Form 1A
```bash
curl "http://localhost:3000/api/students?classId={form1aId}"
```
✅ See John (pending), Jane (partial payment), Robert (completed)

### Step 4: View Form 1A Fees for Term 1
```bash
curl "http://localhost:3000/api/class-fees?classId={form1aId}&term=term1"
```
✅ See Tuition (5000), Lab (500), Sports (300) = Total 5800

### Step 5: View Jane's Fee Summary
```bash
curl "http://localhost:3000/api/student-fee-statements/summary/{janeId}"
```
✅ See Jane owes 5800, paid 2000, balance 3800

### Step 6: View Jane's Payment
```bash
curl "http://localhost:3000/api/fee-payments?studentId={janeId}"
```
✅ See payment of 2000 recorded

### Step 7: Create Term 2 Statement
```bash
curl -X POST http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "{janeId}",
    "academicYear": "2024-2025",
    "term": "term2",
    "termStartDate": "2024-05-15",
    "termEndDate": "2024-08-15",
    "dueDate": "2024-06-15"
  }'
```
✅ Jane's balance of 3800 carries forward + Term 2 fees = new total

### Step 8: View Jane's Updated Summary
```bash
curl "http://localhost:3000/api/student-fee-statements/summary/{janeId}"
```
✅ Now shows 2 statements with accumulated balance

---

## 📊 Data Validation Points

### John (ADM001) - Pending Payment
- ✅ Statement shows 5800 owed, 0 paid, 5800 balance
- ✅ No payments recorded
- ✅ Status is "pending"

### Jane (ADM002) - Partial Payment
- ✅ Statement shows 5800 owed, 2000 paid, 3800 balance
- ✅ Payment record exists for 2000
- ✅ Receipt generated for payment
- ✅ Status is "pending"

### Robert (ADM003) - Full Payment
- ✅ Statement shows 5800 owed, 5800 paid, 0 balance
- ✅ Payment record exists for 5800
- ✅ Receipt generated for payment
- ✅ Status is "completed"

---

## 🐛 Error Testing

### Test Duplicate Statement
```bash
# Try to create Jane's term1 statement again
curl -X POST http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "{janeId}",
    "academicYear": "2024-2025",
    "term": "term1",
    "termStartDate": "2024-01-15",
    "termEndDate": "2024-04-15",
    "dueDate": "2024-02-15"
  }'
```
**Expected:** 409 Conflict - "Fee statement already exists..."

### Test Invalid Student
```bash
curl -X POST http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "invalid-id",
    "academicYear": "2024-2025",
    "term": "term1",
    "termStartDate": "2024-01-15",
    "termEndDate": "2024-04-15",
    "dueDate": "2024-02-15"
  }'
```
**Expected:** 404 Not Found - "Student not found"

### Test Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/student-fee-statements \
  -H "Content-Type: application/json" \
  -d '{"academicYear": "2024-2025"}'
```
**Expected:** 400 Bad Request - "Missing required fields..."

---

## ✅ Testing Checklist

- [ ] Authentication (login works)
- [ ] Get all academic terms (2 items)
- [ ] Get all users (3 items)
- [ ] Get all classes (6 items)
- [ ] Get all students (8 items)
- [ ] Get all class fees (8 items)
- [ ] Get all fee statements (3 items)
- [ ] Get fee statement with payments (Jane's)
- [ ] Get fee statement summary (Jane's overview)
- [ ] Get all fee payments (2 items)
- [ ] Get all receipts (2 items)
- [ ] Create new student
- [ ] Create new class fee
- [ ] Create new fee statement
- [ ] Record payment (update statement)
- [ ] Create bulk statements
- [ ] Test error scenarios (409, 404, 400)
- [ ] Verify balance carryover logic
- [ ] Verify auto-status update (when fully paid)

---

## 🎯 Success Criteria

✅ All endpoints respond with correct status codes  
✅ Sample data loads correctly  
✅ Relationships between models work  
✅ Balance carryover calculations work  
✅ Payment recording updates balances  
✅ Error handling works properly  
✅ Filtering works for all entities  

**You're ready to test the complete system!**
