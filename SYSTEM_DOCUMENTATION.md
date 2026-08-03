# ResolveDesk — Smart Campus Complaint Management System

**ResolveDesk** is an enterprise-grade campus complaint management system built for educational institutions. It streamlines the entire lifecycle of campus facility issues (electrical, plumbing, IT, infrastructure, furniture, etc.) from initial report by students, to skill-based assignment by department heads, resolution by technicians, and system-wide governance by administrators.

---

## 1. Tech Stack & Architecture

- **Frontend:** React 19 + Vite + TailwindCSS + Lucide Icons
- **Backend:** Node.js / Express + Socket.IO (Real-time events & per-complaint chat) + Mongoose
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Analytics & Export:** System analytics, Recharts dashboard visualizations, and CSV report export
- **Design Tokens:** Modern typography (Space Grotesk, Inter, IBM Plex Mono), rich HSL color badges, soft glassmorphism, responsive sidebar (< 760px collapses to mobile bottom nav).

---

## 2. Complaint Status & Priority Lifecycle

### Complaint Status Flow
```
[Pending] ──(Rejected)──► [Rejected] (Terminal)
    │
    ├──(Assigned)──► [Assigned]
                        │
                        └──(Work Started)──► [In Progress]
                                                  │
                                                  └──(Completed)──► [Resolved]
                                                                        │
                                                                        └──(Rated)──► [Closed]
```

| Status | Badge Style | Description |
| :--- | :--- | :--- |
| **Pending** | 🟡 Yellow Soft Badge | Complaint submitted by Student; awaiting department head assignment. |
| **Assigned** | 🔵 Blue Soft Badge | Assigned to a specific technician with priority & estimated completion date. |
| **In Progress** | 🟣 Purple Soft Badge | Technician has initiated work on site. |
| **Resolved** | 🟢 Green Soft Badge | Technician completed resolution and uploaded completion proof images. |
| **Closed** | 🔘 Gray Soft Badge | Student reviewed resolution and submitted 1–5 star rating & feedback. |
| **Rejected** | 🔴 Red Soft Badge | Terminal state if complaint is invalid, out of scope, or duplicate. |

### Complaint Priority Levels
- **Critical (Red):** Severe emergency (power outage, water leak, safety hazard).
- **High (Orange):** Urgent issue affecting daily academic/hostel operations.
- **Medium (Blue):** Standard maintenance request (default priority).
- **Low (Gray):** Minor cosmetic or non-urgent repair.

---

## 3. Comprehensive Role Functionalities

### 👨‍🎓 Student Role
*The end-user reporting issues across campus (hostels, classrooms, labs, common areas).*

- **Dashboard Overview:**
  - View summary metrics of submitted complaints (Active, Pending, Resolved).
  - Quick-action "Raise Complaint" Floating Action Button (FAB) on mobile.
  - Quick filter by active status or search by Ticket ID.
- **Raise Complaint:**
  - Select category (Electrical, Plumbing, IT / Internet, Infrastructure, Furniture, Cleaning / Sanitation, Other).
  - Specify exact campus location (building, floor, room number).
  - Provide title and detailed description.
  - Upload up to 5 image attachments as proof.
- **Track Complaint Progress:**
  - View vertical **Status Thread Timeline** with pulsing active step indicator.
  - Track assigned technician details (name, contact phone, department).
- **Real-Time Per-Complaint Chat:**
  - Communicate directly with assigned technicians and department heads in a dedicated Socket.IO chat room.
  - Attach images and exchange comments in real-time.
- **Rating & Feedback:**
  - Once resolved, submit a 1 to 5 star rating and optional feedback text to mark the ticket as **Closed**.
- **Real-Time Notifications:**
  - Receive instant notifications when a technician is assigned, status updates occur, or a chat comment is added.

---

### 🛠️ Technician Role
*Field staff responsible for carrying out physical repairs and resolving complaints.*

- **Technician Queue Dashboard:**
  - View assigned work queue with active workload counter (`Assigned` and `In Progress` tasks).
  - Quick action buttons to start work or update status.
  - Search work queue by Ticket ID, location, or student name.
- **Work Details & Navigation:**
  - View complaint location details, student contact info, and issue attachments.
  - View priority level and assigned note from Department Head.
- **Status Updates & Work Initiation:**
  - Change status from `Assigned` to `In Progress` when starting repairs on site.
- **Completion Proof Upload:**
  - Upload completion proof photos when marking a complaint as `Resolved`.
- **Per-Complaint Chat & Collaboration:**
  - Exchange real-time messages with students or department heads to coordinate access or ask clarifying questions.
- **Completed History & Performance:**
  - Review resolved/closed complaint history and view student rating scores.

---

### 🏢 Department Head Role
*Administrative head supervising department workload, prioritizing issues, and assigning technicians.*

- **Department Analytics Dashboard:**
  - Monitor department metrics (Pending, Assigned, In Progress, Resolved).
  - Technician workload availability bar chart (Workload %, Available vs. Busy).
  - Technician performance metrics (active tasks, month resolved count, average resolution time, average rating).
- **Complaint Queue Management:**
  - View all complaints routed to their department.
  - Filter by Status (`Pending`, `Assigned`, `In Progress`, `Resolved`, `Closed`), Priority, or Assigned Technician.
- **Skill-Based Technician Assignment:**
  - View list of department technicians with real-time availability status (`Available` vs `Busy` at ≥5 active tasks).
  - Assign unassigned complaints to a specific technician.
  - Set/override priority level (`Critical`, `High`, `Medium`, `Low`) and specify optional assignment notes.
- **Reject Invalid Complaints:**
  - Option to reject out-of-scope or duplicate requests with a mandatory rejection reason.
- **Department Staff Management:**
  - Overview table of department staff, assigned tasks, and performance ratings.
- **Analytical Reports & CSV Export:**
  - Generate department performance reports by date range (`30 days`, `90 days`, `1 year`).
  - Export full complaint data to CSV files.

---

### 👑 System Administrator (Admin) Role
*Full governance authority over users, departments, system configurations, and system-wide complaints.*

- **System-Wide Overview Dashboard:**
  - View campus-wide metrics (Total Users, Total Departments, Open Complaints, Closed Complaints).
  - Monthly complaint volume trend bar chart.
  - Department volume comparison chart.
  - Category breakdown chart.
  - Recent system-wide activity stream.
- **System-Wide Complaint Governance:**
  - View all complaints across all campus departments.
  - Full authority to assign any complaint to any active technician.
  - Change complaint status or view complete audit thread.
- **User Account Management:**
  - View all accounts (Students, Technicians, Department Heads, Admins).
  - Search by name/email; filter by Role or Status (`Active`, `Disabled`, `Pending Approval`).
  - **Create Single User:** Manually register individual accounts.
  - **Bulk CSV User Import:** Download sample CSV template, upload `.csv` files, preview records client-side, and batch import multiple users across any role.
  - **Approve Staff Accounts:** One-click approval for staff accounts (`Technician`, `DepartmentHead`) requiring admin authorization.
  - **Toggle Account Status:** Enable or disable user accounts instantly.
  - **Edit User Profile:** Update name, email, role, department assignment, phone, and skills.
  - **Delete User:** Permanently remove accounts.
- **Department Management:**
  - View all campus departments with assigned Department Heads and staff numbers.
  - Create new departments with name, code, and assigned Department Head.
  - Edit department details or reassign Department Heads.
  - Deactivate/Delete departments.
- **System Reports & Export:**
  - Generate system-wide reports across all departments.
  - Export system analytics to CSV format.

---

## 4. End-to-End Complaint Lifecycle Example

1. **Student Raises Complaint:**
   - Student logs in and fills the "Raise Complaint" form (e.g. Title: *"A/C Unit Leak in Lab 302"*, Category: `Electrical`, Location: `Lab 302, CS Block`).
   - System auto-generates a unique Ticket ID (`#CMP-1042`) and sets status to `Pending`.

2. **Department Head Assigns Technician:**
   - Department Head views pending queue, sees `#CMP-1042`, and clicks **Assign**.
   - Selects an available technician (e.g. *Anita Roy - Electrical Tech*), sets priority to `High`, and adds note *"Check main drainage pipe"*.
   - Status changes to `Assigned`. Student & Technician receive real-time notifications.

3. **Technician Initiates Work & Chats:**
   - Technician views assigned queue, opens `#CMP-1042`, and clicks **Start Work**.
   - Status changes to `In Progress`.
   - Technician sends a chat message: *"I am at Lab 302. Please ensure the door is unlocked."* Student receives notification instantly.

4. **Technician Resolves Complaint:**
   - Technician completes repair, uploads a photo of the fixed A/C unit, and clicks **Mark Resolved**.
   - Status changes to `Resolved`. Student receives notification to verify.

5. **Student Rates & Closes Complaint:**
   - Student inspects the lab, opens `#CMP-1042`, selects 5 Stars ⭐⭐⭐⭐⭐ with comment *"Quick response, thank you!"*, and submits.
   - Status changes to `Closed` (Terminal).

---

## 5. Demo Accounts Quick Reference

| Role | Email Address | Password | Default Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `student@kct.ac.in` | `Password@123` | Student Dashboard & Complaint History |
| **Technician** | `tech.electrical@kct.ac.in` | `Password@123` | Assigned Work Queue & Completed Tasks |
| **Department Head** | `depthead@kct.ac.in` | `Password@123` | CS / Electrical Department Dashboard & Assignment |
| **System Administrator** | `admin@kct.ac.in` | `Password@123` | System-Wide Control, Users, Depts & Analytics |

---

## 6. Summary of Account Approval Policies

- **Student Accounts:** Auto-approved upon registration; immediate access to raise complaints.
- **Staff Accounts (Technician & Department Head):** Registered staff accounts enter `Pending Approval` state until approved by a System Administrator in **User Management**.
- **Admin Accounts:** Initialized directly by administrators or created in bulk via CSV Import.
