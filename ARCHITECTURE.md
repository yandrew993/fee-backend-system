# Fee Management System - Architecture & Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vue)                         │
│                    (Port 5173 - localhost)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js API Server                         │
│                     (Port 3000 - localhost)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Handlers                               │  │
│  │  ├─ /api/auth       → Authentication                     │  │
│  │  ├─ /api/students   → Student Management                 │  │
│  │  ├─ /api/classes    → Class Management                   │  │
│  │  ├─ /api/class-fees → Fee Structure                      │  │
│  │  ├─ /api/fee-payments → Payment Tracking                 │  │
│  │  ├─ /api/receipts   → Receipt Management                 │  │
│  │  └─ /api/reports    → Financial Reports                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Business Logic Controllers                      │  │
│  │  ├─ Student Controller                                   │  │
│  │  ├─ Class Controller                                     │  │
│  │  ├─ ClassFee Controller                                  │  │
│  │  ├─ FeePayment Controller                                │  │
│  │  ├─ Receipt Controller                                   │  │
│  │  └─ Report Controller                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Prisma ORM Client                              │  │
│  │         (Database Abstraction Layer)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────┘
                 │ MongoDB Driver
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                              │
│                   (Cloud - Atlas)                                │
│                                                                   │
│  Collections:                                                     │
│  ├─ users          → Staff/Admin user accounts                  │
│  ├─ students       → Student records                            │
│  ├─ classes        → Class/Grade information                    │
│  ├─ classfees      → Fee structures                             │
│  ├─ feepayments    → Payment records                            │
│  └─ receipts       → Payment receipts                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
├─────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • email (UNIQUE)                                                │
│ • username (UNIQUE)                                             │
│ • password (hashed)                                             │
│ • fullName                                                       │
│ • phone                                                          │
│ • role (enum: admin, accountant, teacher, parent)              │
│ • avatar                                                         │
│ • createdAt                                                      │
│ • updatedAt                                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ creates (one-to-many)
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    FEE PAYMENT                                   │
├─────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • referenceNumber (UNIQUE)                                      │
│ • studentId (FK)                                                │
│ • classFeeId (FK)                                               │
│ • createdById (FK) → User                                       │
│ • amount                                                         │
│ • amountPaid                                                    │
│ • balanceAmount                                                 │
│ • status (enum)                                                 │
│ • method (enum)                                                 │
│ • paymentDate                                                   │
│ • dueDate                                                        │
│ • notes                                                          │
│ • createdAt                                                      │
│ • updatedAt                                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ belongs to (one-to-one for ref)
        ┌────────────┴────────────┐
        │                         │
   (FK to Student)           (FK to ClassFee)
        │                         │
        ↓                         ↓
┌──────────────────┐   ┌──────────────────────┐
│     STUDENT      │   │     CLASS FEE        │
├──────────────────┤   ├──────────────────────┤
│ • id (PK)        │   │ • id (PK)            │
│ • admissionNum   │   │ • name               │
│ • firstName      │   │ • amount             │
│ • lastName       │   │ • dueDate            │
│ • email          │   │ • isRecurring        │
│ • phone          │   │ • frequency          │
│ • dateOfBirth    │   │ • description        │
│ • gender         │   │ • classId (FK)       │
│ • parentName     │   │ • createdAt          │
│ • parentPhone    │   │ • updatedAt          │
│ • parentEmail    │   └──────────────────────┘
│ • address        │           ↑
│ • status         │           │
│ • classId (FK)   │    (belongs to)
│ • createdAt      │           │
│ • updatedAt      │           ↓
└────────┬─────────┘   ┌──────────────────────┐
         │             │       CLASS          │
         │             ├──────────────────────┤
         │             │ • id (PK)            │
         │             │ • name (UNIQUE)      │
         │             │ • level              │
         └─────────────┤ • capacity           │
      (one-to-many)    │ • description        │
                       │ • createdAt          │
                       │ • updatedAt          │
                       └──────────────────────┘
         │
         │ (one-to-many)
         ↓
   ┌──────────────────┐
   │     RECEIPT      │
   ├──────────────────┤
   │ • id (PK)        │
   │ • receiptNumber  │
   │ • studentId (FK) │
   │ • feePaymentId   │
   │ • amount         │
   │ • paymentMethod  │
   │ • paymentDate    │
   │ • description    │
   │ • createdAt      │
   └──────────────────┘
```

## Database Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  email: "user@school.com",
  username: "username",
  password: "hashed_password",
  fullName: "Full Name",
  phone: "+1234567890",
  role: "accountant", // admin, accountant, teacher, parent
  avatar: "url",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Classes Collection
```javascript
{
  _id: ObjectId,
  name: "Form 1A",
  level: 1,
  capacity: 40,
  description: "First year class A",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Students Collection
```javascript
{
  _id: ObjectId,
  admissionNumber: "STU-2024-001",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  dateOfBirth: ISODate,
  gender: "Male",
  parentName: "Jane Doe",
  parentPhone: "+1234567891",
  parentEmail: "parent@example.com",
  address: "123 Main Street",
  status: "active", // active, inactive, graduated, suspended
  classId: ObjectId, // Reference to Class
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### ClassFees Collection
```javascript
{
  _id: ObjectId,
  name: "Tuition Fee",
  amount: 5000,
  dueDate: ISODate,
  isRecurring: true,
  frequency: "monthly", // monthly, termly, annually
  description: "Monthly tuition fee",
  classId: ObjectId, // Reference to Class
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### FeePayments Collection
```javascript
{
  _id: ObjectId,
  referenceNumber: "FEE-000001",
  studentId: ObjectId, // Reference to Student
  classFeeId: ObjectId, // Reference to ClassFee
  amount: 5000,
  amountPaid: 2500,
  balanceAmount: 2500,
  status: "pending", // pending, completed, failed, cancelled
  method: "bank_transfer", // cash, cheque, bank_transfer, mobile_money, online
  paymentDate: ISODate,
  dueDate: ISODate,
  notes: "Payment notes",
  createdById: ObjectId, // Reference to User
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Receipts Collection
```javascript
{
  _id: ObjectId,
  receiptNumber: "RCP-000001",
  studentId: ObjectId, // Reference to Student
  feePaymentId: ObjectId, // Reference to FeePayment
  amount: 2500,
  paymentMethod: "bank_transfer",
  paymentDate: ISODate,
  description: "Receipt description",
  createdAt: ISODate
}
```

## API Flow Diagram

### Student Registration & Fee Assignment Flow

```
1. Create Class
   POST /api/classes
   → Create "Form 1A"

2. Create Class Fees
   POST /api/class-fees
   → Create "Tuition Fee" for Form 1A
   → Create "Sports Fee" for Form 1A

3. Register Student
   POST /api/students
   → Add "John Doe" to Form 1A

4. Create Fee Payment
   POST /api/fee-payments
   → Create payment for John Doe for Tuition Fee
   → auto-generate reference: FEE-000001
   → status: pending
   → amountPaid: 0
   → balanceAmount: 5000

5. Record Payment
   PATCH /api/fee-payments/id/pay
   → amountPaid: 2500
   → auto-generate receipt: RCP-000001
   → create Receipt record
   → update FeePayment status based on balance

6. Get Receipt
   GET /api/receipts/id
   → Display or print receipt

7. View Reports
   GET /api/reports/student/:studentId
   → See payment history and balance
```

### Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Record Payment Request                      │
│  PATCH /api/fee-payments/:id/pay                            │
│  { amountPaid, paymentMethod, paymentDate, notes }          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
         ┌─────────────────────────────┐
         │ Validate Amount             │
         │ amountPaid <= balanceAmount │
         └──────────────┬──────────────┘
                        ↓ (if valid)
         ┌──────────────────────────────────┐
         │ Create Receipt with Receipt#      │
         │ - receiptNumber (auto-generated)  │
         │ - amount, paymentMethod, date     │
         └──────────────┬───────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │ Update FeePayment                │
         │ - amountPaid += payment          │
         │ - balanceAmount -= payment       │
         │ - Update status if balance == 0  │
         └──────────────┬───────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │ Return Updated Payment + Receipt │
         └────────────────────────────────┘
```

## Database Indexes

For optimal query performance, the following indexes are recommended:

```javascript
// Students
db.students.createIndex({ classId: 1 })
db.students.createIndex({ admissionNumber: 1 })
db.students.createIndex({ status: 1 })

// FeePayments
db.feepayments.createIndex({ studentId: 1 })
db.feepayments.createIndex({ classFeeId: 1 })
db.feepayments.createIndex({ status: 1 })
db.feepayments.createIndex({ referenceNumber: 1 })

// Receipts
db.receipts.createIndex({ studentId: 1 })
db.receipts.createIndex({ feePaymentId: 1 })
db.receipts.createIndex({ receiptNumber: 1 })

// Classes
db.classes.createIndex({ name: 1 })
db.classes.createIndex({ level: 1 })

// ClassFees
db.classfees.createIndex({ classId: 1 })

// Users
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
```

## Data Validation Rules

### Student
- ✓ Admission number must be unique
- ✓ Email must be valid format
- ✓ Class must exist before assignment
- ✓ Status must be one of: active, inactive, graduated, suspended

### ClassFee
- ✓ Amount must be > 0
- ✓ Class must exist
- ✓ Due date must be valid
- ✓ If recurring, frequency must be specified

### FeePayment
- ✓ Student must exist
- ✓ ClassFee must exist
- ✓ Amount must equal ClassFee amount
- ✓ Balance calculation must be accurate
- ✓ Payment method must be valid

### Receipt
- ✓ Amount must be <= FeePayment balance
- ✓ Receipt number must be unique
- ✓ Student and FeePayment must exist

## Security Considerations

1. **Authentication**: JWT tokens with 7-day expiration
2. **Password**: Bcrypt hashing with 10 rounds
3. **CORS**: Restricted to allowed origins
4. **Validation**: All inputs validated before processing
5. **Database**: MongoDB Atlas with IP whitelist
6. **Email**: SMTP with secure authentication
7. **Data**: Cascading deletes for referential integrity

## Performance Optimization

1. **Indexing**: Essential fields indexed for fast queries
2. **Pagination**: Implement for large datasets
3. **Caching**: Consider Redis for frequently accessed data
4. **Connection Pooling**: Managed by Prisma
5. **Query Optimization**: Lean queries with selective fields

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API design enables multiple instances
2. **Database**: MongoDB Atlas auto-scaling
3. **Load Balancing**: Deploy behind load balancer (nginx, AWS ELB)
4. **Caching Layer**: Redis for session/report caching
5. **Queue System**: Bull/RabbitMQ for async operations (emails, reports)
6. **File Storage**: S3 for receipts/documents

## Future Enhancements

1. **Microservices**: Split into separate services
2. **Event Streaming**: Kafka for real-time updates
3. **GraphQL**: Alternative query language
4. **Webhooks**: Real-time notifications
5. **Multi-tenancy**: Support multiple schools
6. **Analytics**: Advanced data warehousing
7. **Mobile App**: Native mobile application

---

This architecture provides a scalable, secure, and maintainable foundation for a comprehensive fee management system.
