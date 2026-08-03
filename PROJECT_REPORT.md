# ACADEMIC & TECHNICAL PROJECT REPORT

# ResolveDesk: Smart Campus Complaint Management System

---

## EXECUTIVE SUMMARY

**ResolveDesk** is an enterprise-grade, web-based complaint management system engineered specifically for educational institutions and campus environments. In traditional campus operations, maintenance issues (such as electrical outages, plumbing leaks, network disruptions, infrastructure damage, and classroom maintenance) are often reported via manual logbooks, informal emails, or fragmented messaging channels. This leads to delayed resolutions, lack of transparency, unmonitored staff workloads, and an absence of data-driven insights for administration.

ResolveDesk resolves these operational bottlenecks by providing an end-to-end digital lifecycle for campus issues. The system features role-based access for **Students**, **Technicians**, **Department Heads**, and **System Administrators**. It implements real-time Socket.IO bi-directional communication, automated notification dispatch, automated technician workload calculations, single and bulk CSV user account initialization, and analytical reporting with CSV export capabilities.

---

## 1. PROJECT OBJECTIVES & PROBLEM STATEMENT

### 1.1 Problem Statement
Campus environments host thousands of occupants daily. Managing physical assets and facilities across multiple academic blocks, laboratories, auditoriums, and residential hostels presents significant operational challenges:
1. **Response Delays:** Requests are lost in physical registers or unmonitored inbox queues.
2. **Lack of Status Visibility:** Students cannot track the real-time progress of their reported maintenance issues.
3. **Workload Imbalance:** Department heads lack clear visibility into field technician availability and current active tasks.
4. **No Verifiable Proof of Completion:** Lack of photo verification when repairs are marked as complete.
5. **Absence of Centralized Governance:** System administrators have limited visibility into department-level resolution metrics and systemic facility failures.

### 1.2 Objectives of ResolveDesk
- **Centralize Complaint Lifecycle:** Provide a unified web platform to raise, assign, track, resolve, rate, and audit campus complaints.
- **Skill & Workload-Based Assignment:** Enable department heads to monitor technician active task counts and allocate tasks efficiently.
- **Real-Time Communication:** Integrate Socket.IO WebSocket rooms per complaint to facilitate direct instant messaging between students, technicians, and heads.
- **Verification & Accountability:** Mandate completion image uploads by technicians before tickets can be resolved, followed by student rating validation.
- **Administrative Governance:** Equip system administrators with user access control, bulk CSV onboarding, department management, and analytical export tools.

---

## 2. SYSTEM ARCHITECTURE & TECH STACK

ResolveDesk follows a decoupled **Client-Server Architecture** communicating over RESTful HTTP/JSON APIs and Socket.IO WebSocket channels.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│         React 19 + Vite + TailwindCSS + Recharts + Lucide Icons        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST API / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                         APPLICATION LAYER                              │
│       Node.js / Express.js Server + Socket.IO Engine + JWT Auth        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM
┌───────────────────────────────────▼────────────────────────────────────┐
│                           DATABASE LAYER                               │
│                   MongoDB Document Store Collections                   │
│        (users, departments, complaints, notifications)                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Technology Stack Details

| Layer | Technology | Function / Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | High-performance component-based Single Page Application (SPA). |
| **Styling & UI** | TailwindCSS + Lucide Icons | Responsive modern design system with curated HSL color tokens. |
| **Data Visualization** | Recharts | Render interactive analytical bar, pie, and trend charts. |
| **Backend Runtime** | Node.js | Asynchronous, event-driven server runtime environment. |
| **Web Framework** | Express.js | RESTful routing middleware and controller request pipelines. |
| **Real-Time Engine** | Socket.IO | WebSockets engine for instant per-complaint chat & room presence. |
| **Database ODM** | MongoDB + Mongoose ODM | Schema validation, indexing, population, and document storage. |
| **Authentication** | JWT + bcrypt | Secure stateless JSON Web Tokens & password hashing (salt 10). |

---

## 3. COMPLAINT STATUS & PRIORITY LIFECYCLE MODEL

### 3.1 Status State Machine
Complaints progress through a strict finite state machine:

```
                  ┌────────────┐
                  │  Pending   │
                  └─────┬──────┘
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
┌──────────────┐                  ┌──────────────┐
│   Rejected   │ (Terminal)       │   Assigned   │
└──────────────┘                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ In Progress  │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Resolved   │
                                  └──────┬───────┘
                                         │ (Student Rating)
                                         ▼
                                  ┌──────────────┐
                                  │    Closed    │ (Terminal)
                                  └──────────────┘
```

1. **Pending:** Ticket submitted by student; awaiting head/admin assignment.
2. **Assigned:** Ticket assigned to a technician with priority and estimated target completion date.
3. **In Progress:** Technician has initiated physical repair work.
4. **Resolved:** Technician completed repairs and uploaded completion proof photos.
5. **Closed:** Student reviewed resolution and submitted a 1–5 star rating with feedback.
6. **Rejected:** Ticket deemed duplicate or invalid by department head/admin with specified reason.

---

## 4. SYSTEM MODULES BY USER ROLES

### 4.1 Student Module
- **Dashboard Overview:** Displays metrics for active, pending, and resolved complaints. Includes mobile Floating Action Button (FAB) for raising complaints.
- **Raise Complaint Form:** Multi-input form allowing category selection (Electrical, Plumbing, IT, Infrastructure, Furniture, Cleaning, Other), campus location description, detailed issue summary, and image attachments (up to 5 images).
- **Complaint Tracking Thread:** Vertical timeline display with active step pulse animations, assigned technician details, and priority badges.
- **Interactive Chat Room:** Per-complaint real-time messaging with technician and department head.
- **Rating & Closure:** Form to submit 1–5 star rating and feedback text upon resolution.

### 4.2 Technician Module
- **Assigned Queue Dashboard:** Real-time list of assigned complaints with workload counter.
- **Work Status Control:** Toggle status from `Assigned` to `In Progress` when starting repairs.
- **Completion Photo Upload:** Upload camera/file proof photos before setting status to `Resolved`.
- **Chat & Communication:** In-app messaging with students and heads for access coordination.
- **Completed History & Performance:** Review resolved tickets and student ratings.

### 4.3 Department Head Module
- **Department Metrics & Analytics:** View open, assigned, in-progress, and resolved task counts.
- **Technician Workload Monitoring:** Real-time visibility into field staff active workload percentage and availability status (`Available` vs `Busy` at ≥5 active tasks).
- **Skill-Based Task Assignment:** Interface to assign pending tickets to technicians, set priority levels (`Critical`, `High`, `Medium`, `Low`), and add assignment notes.
- **Complaint Rejection:** Ability to reject invalid requests with mandatory rejection notes.
- **Reports & Export:** Filter performance metrics by date range and export dataset to CSV.

### 4.4 System Administrator (Admin) Module
- **System-Wide Dashboard:** Campus-wide analytical metrics, monthly trend charts, department comparison bars, category donut charts, and recent activity logs.
- **Full Complaint Governance:** Authority to view all campus complaints, override task assignments, and update statuses.
- **User Account Management:**
  - Search, filter, edit, activate/disable, and delete accounts.
  - Approve pending staff accounts (`Technician`, `DepartmentHead`).
  - **Single User Creation:** Initialize individual accounts.
  - **Bulk CSV User Import:** Download standard CSV template (`Name, Email, Role, Password, Phone, Department, Skills`), upload `.csv` files, preview records, and batch create users across all roles.
- **Department Management:** Create, edit, assign heads, and deactivate campus departments.
- **Analytical Reports:** Generate system-wide reports and export to CSV.

---

## 5. DATABASE SCHEMA DESIGN (MONGODB)

### 5.1 User Collection (`users`)
```js
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['Student', 'Technician', 'DepartmentHead', 'Admin'], default: 'Student' },
  phone: { type: String, default: '' },
  department: { type: ObjectId, ref: 'Department', default: null },
  skills: [String],
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '' },
  timestamps: true
}
```

### 5.2 Department Collection (`departments`)
```js
{
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: '' },
  head: { type: ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

### 5.3 Complaint Collection (`complaints`)
```js
{
  ticketId: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true, maxlength: 150 },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'], default: 'Pending' },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  student: { type: ObjectId, ref: 'User', required: true },
  department: { type: ObjectId, ref: 'Department', default: null },
  assignedTechnician: { type: ObjectId, ref: 'User', default: null },
  assignedBy: { type: ObjectId, ref: 'User', default: null },
  images: [String],
  completionImages: [String],
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: '' },
  comments: [{
    sender: { type: ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: [String],
    timestamps: true
  }],
  rejectionReason: { type: String, default: '' },
  resolvedAt: Date,
  closedAt: Date,
  rejectedAt: Date,
  timestamps: true
}
```

### 5.4 Notification Collection (`notifications`)
```js
{
  recipient: { type: ObjectId, ref: 'User', required: true },
  sender: { type: ObjectId, ref: 'User', required: true },
  complaint: { type: ObjectId, ref: 'Complaint', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['complaint_status', 'complaint_assigned', 'comment_added', 'account_approved', 'system'] },
  isRead: { type: Boolean, default: false },
  timestamps: true
}
```

---

## 6. REST API ENDPOINT SPECIFICATIONS

| HTTP Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token. |
| `POST` | `/api/auth/register` | Public | Register student (auto-approved) or staff (pending approval). |
| `GET` | `/api/auth/me` | Protected | Fetch currently logged-in user profile. |
| `POST` | `/api/complaints` | Student | Submit a new complaint with image attachments. |
| `GET` | `/api/complaints/mine` | Student | Retrieve complaints raised by authenticated student. |
| `GET` | `/api/complaints/department` | Head, Admin | Retrieve department/system-wide complaints list. |
| `POST` | `/api/complaints/:id/assign` | Head, Admin | Assign technician, priority, and notes to complaint. |
| `GET` | `/api/complaints/assigned` | Technician | Retrieve work queue assigned to technician. |
| `PATCH` | `/api/complaints/:id/status` | Tech, Head, Admin | Update complaint status (`In Progress`, `Resolved`, etc.). |
| `POST` | `/api/complaints/:id/complete` | Tech, Head, Admin | Submit completion proof images & mark resolved. |
| `POST` | `/api/complaints/:id/rate` | Student | Submit 1–5 star rating and feedback to close ticket. |
| `GET` | `/api/admin/overview` | Head, Admin | Retrieve summary metrics, trend charts, and activity log. |
| `GET` | `/api/admin/users` | Admin | Retrieve paginated/filtered users list. |
| `POST` | `/api/admin/users` | Admin | Create single user account manually. |
| `POST` | `/api/admin/users/bulk` | Admin | Bulk create user accounts via parsed CSV JSON. |
| `PATCH` | `/api/admin/users/:id/approve` | Admin | Approve pending staff account. |
| `PATCH` | `/api/admin/users/:id/toggle-active` | Admin | Enable/disable user account. |
| `DELETE` | `/api/admin/users/:id` | Admin | Permanently delete user account. |
| `GET` | `/api/departments` | Public / Protected | Retrieve all active campus departments. |
| `POST` | `/api/departments` | Admin | Create new campus department. |
| `GET` | `/api/reports/department` | Head, Admin | Fetch department analytics data. |
| `GET` | `/api/reports/export/csv` | Head, Admin | Export complaint report data to CSV file. |

---

## 7. REAL-TIME EVENT ARCHITECTURE (SOCKET.IO)

ResolveDesk uses Socket.IO for real-time bi-directional messaging and event notifications:

```
Client App                             Socket.IO Server                             MongoDB
    │                                         │                                        │
    ├───────────── join_complaint ───────────►│                                        │
    │                                         │ (Join Room: complaint_ID)              │
    │                                         │                                        │
    ├───────────── send_message ──────────────►│                                        │
    │                                         ├────── Save comment to Complaint DB ───►│
    │                                         │◄───── Return Updated Complaint ────────┤
    │◄──────────── receive_message ───────────┤                                        │
    │     (Broadcast to room participants)    │                                        │
```

---

## 8. DEMO ACCOUNTS & VERIFICATION UTILITIES

For evaluation and testing, the system provides pre-seeded accounts across all four roles:

| Role | Email Address | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@kct.ac.in` | `Password@123` | Raise complaints, track timeline, real-time chat, rate & close. |
| **Technician** | `tech.electrical@kct.ac.in` | `Password@123` | View assigned queue, update status to `In Progress`, upload completion images. |
| **Department Head** | `depthead@kct.ac.in` | `Password@123` | View department queue, monitor technician workload, assign tasks, export reports. |
| **System Administrator** | `admin@kct.ac.in` | `Password@123` | Complete governance, single/bulk CSV user creation, department management, analytics. |

---

## 9. CONCLUSION & FUTURE ENHANCEMENTS

### 9.1 Conclusion
ResolveDesk addresses the key operational inefficiencies of campus facility complaint resolution. By combining a modern React 19 interface, Node.js REST APIs, Socket.IO WebSockets, and MongoDB document storage, the system ensures transparency, accountability, and real-time responsiveness across students, technicians, department heads, and administrators.

### 9.2 Future Scope & Extensions
- **Mobile Push Notifications:** Integration with Web Push API / Firebase Cloud Messaging (FCM) for native mobile alerts.
- **AI-Based Categorization:** Natural Language Processing (NLP) model to auto-assign incoming complaints based on description text.
- **SLA Escalation Timers:** Automated background cron timers to auto-escalate overdue unassigned or uncompleted complaints to higher administrative bodies.
