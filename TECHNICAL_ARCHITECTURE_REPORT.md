# COMPREHENSIVE TECHNICAL ARCHITECTURE & ROLE-WISE FUNCTIONALITY REPORT

# ResolveDesk: Smart Campus Complaint Management System

---

## SECTION 1: ROLE-WISE FUNCTIONALITY & WORKFLOW REPORT

ResolveDesk provides targeted interfaces tailored to the four distinct operational roles within an educational institution: **Student**, **Technician**, **Department Head**, and **System Administrator**.

---

### 1.1 Student Role Functionality & Internal Workflow

```
[Student Interface]
       │
       ├──► 1. Raise Complaint (Title, Category, Location, Photos)
       │          │
       │          ▼ (POST /api/complaints -> Creates Ticket #CMP-xxxx in MongoDB)
       │
       ├──► 2. Track Real-Time Status Timeline (Pending -> Assigned -> In Progress -> Resolved -> Closed)
       │
       ├──► 3. Live Socket.IO Chat (Per-complaint real-time messaging with Technician & Head)
       │
       └──► 4. Rating & Feedback (1–5 Stars + Review -> Transitions status to Closed)
```

#### Detailed Capabilities:
1. **Complaint Raising & Asset Reporting:**
   - **How it Works:** The student selects the issue category (`Electrical`, `Plumbing`, `IT`, `Infrastructure`, `Furniture`, `Cleaning`, `Other`), types the exact campus location (e.g. *Classroom 302, Academic Block A*), inputs a descriptive title, and uploads up to 5 image attachments.
   - **Internal Execution:** The frontend packs form fields and files into a `multipart/form-data` request sent to `POST /api/complaints`. The server generates a unique ticket ID (`#CMP-XXXX`), saves the complaint to MongoDB with `status: "Pending"`, and emits a notification event.

2. **Visual Status Thread Timeline:**
   - **How it Works:** The student monitors an interactive, vertical timeline with a pulsing dot indicator showing the current step of the complaint lifecycle (`Pending` → `Assigned` → `In Progress` → `Resolved` → `Closed`).
   - **Internal Execution:** The timeline checks the active `status` and `assignedTechnician` fields to dynamically compute step indices (`0` to `4`), applying Tailwind CSS classes for completed vs. active states.

3. **Real-Time Per-Complaint Chat:**
   - **How it Works:** Opening a complaint connects the student to a dedicated live chat room. The student can text or share images with the assigned technician or department head.
   - **Internal Execution:** Joining the room emits `socket.emit("join_complaint", { complaintId, user })`. Messages sent emit `send_message`, which persists the comment into MongoDB's `comments` array and broadcasts `receive_message` to all connected room participants.

4. **Verification, Rating & Closure:**
   - **How it Works:** Once a technician uploads completion proof photos and marks the complaint `Resolved`, the student reviews the work and submits a 1–5 star rating with optional text feedback.
   - **Internal Execution:** Calling `POST /api/complaints/:id/rate` updates `rating`, `feedback`, and transitions the ticket status to `Closed`.

---

### 1.2 Technician Role Functionality & Internal Workflow

```
[Technician Interface]
       │
       ├──► 1. Assigned Work Queue (Filtered list of active assigned tasks & workload counter)
       │
       ├──► 2. Initiate Work (Updates status to "In Progress" -> Notifies Student)
       │
       ├──► 3. Real-Time Chat & Coordination (Coordinate access & clarify repair requirements)
       │
       └──► 4. Completion Proof Upload (Upload photos -> Updates status to "Resolved")
```

#### Detailed Capabilities:
1. **Assigned Queue Dashboard:**
   - **How it Works:** Technicians log in to view their active queue of assigned complaints along with a personal workload indicator (active tasks counter).
   - **Internal Execution:** The frontend calls `GET /api/complaints/assigned`. The backend queries `Complaint.find({ assignedTechnician: req.user._id })` and computes active task statistics (`Assigned` and `In Progress` statuses).

2. **Status Progression (`In Progress`):**
   - **How it Works:** Upon arriving at the repair site, the technician taps **Start Work**, updating the complaint status from `Assigned` to `In Progress`.
   - **Internal Execution:** Triggers `PATCH /api/complaints/:id/status` with `{ status: "In Progress" }`. The backend updates the document and dispatches a `complaint_status` notification to the student.

3. **Completion Verification Upload:**
   - **How it Works:** To mark a complaint `Resolved`, the technician must upload completion proof photos showing the fixed facility asset.
   - **Internal Execution:** Calls `POST /api/complaints/:id/complete` using `multipart/form-data`. The server appends image URLs to `completionImages`, sets `resolvedAt: new Date()`, updates status to `Resolved`, and notifies the student to rate the service.

---

### 1.3 Department Head Role Functionality & Internal Workflow

```
[Department Head Interface]
       │
       ├──► 1. Department Overview (Workload bar charts, technician availability, task counts)
       │
       ├──► 2. Skill-Based Task Assignment (Select technician based on active workload % & skills)
       │
       ├──► 3. Complaint Rejection (Reject invalid/duplicate tickets with mandatory notes)
       │
       └──► 4. Department Performance Analytics (Date-range analytical charts & CSV Export)
```

#### Detailed Capabilities:
1. **Department Workload & Staff Monitoring:**
   - **How it Works:** The Head views department-wide statistics (Pending, Assigned, In Progress, Resolved) and a technician availability matrix displaying active task counts and workload percentages.
   - **Internal Execution:** Calls `GET /api/departments/technicians`. The server counts active tasks (`assignedTechnician = tech._id` and `status IN ['Assigned', 'In Progress']`) for each technician. Technicians with ≥5 active tasks are automatically marked as `Busy`.

2. **Technician Assignment & Priority Override:**
   - **How it Works:** The Head selects a pending complaint, chooses an available technician, sets/overrides priority (`Critical`, `High`, `Medium`, `Low`), and inputs assignment notes.
   - **Internal Execution:** Calls `POST /api/complaints/:id/assign`. The backend sets `assignedTechnician`, `assignedBy`, updates `status: "Assigned"`, and creates DB notifications for both the student and the technician.

3. **Department Reports & CSV Export:**
   - **How it Works:** Generates date-filtered analytical reports (`30 days`, `90 days`, `1 year`) and downloads raw data as a `.csv` spreadsheet.
   - **Internal Execution:** Calls `GET /api/reports/export/csv`. The backend streams CSV formatted text with proper HTTP headers (`Content-Type: text/csv`, `Content-Disposition: attachment; filename=...`).

---

### 1.4 System Administrator (Admin) Role Functionality & Internal Workflow

```
[System Administrator Interface]
       │
       ├──► 1. Campus-Wide Overview (System metrics, monthly trend, dept comparison, activity feed)
       │
       ├──► 2. Full Complaint Governance (Override assignments & change status across any department)
       │
       ├──► 3. User Access Control (Single user creation, staff account approval, active toggle, delete)
       │
       ├──► 4. Bulk CSV User Import (Upload CSV -> Parse -> Preview -> Batch create users across all roles)
       │
       └──► 5. Department Management (Create, edit, assign heads, deactivate departments)
```

#### Detailed Capabilities:
1. **System-Wide Dashboard & Recharts Visualization:**
   - **How it Works:** Displays campus-wide totals (Total Users, Departments, Open/Closed Complaints) alongside interactive trend charts.
   - **Internal Execution:** Calls `GET /api/admin/overview`. The backend performs parallel aggregation queries across `User`, `Department`, and `Complaint` collections.

2. **Bulk User Import via CSV:**
   - **How it Works:** The Admin downloads a sample template (`Name, Email, Role, Password, Phone, Department, Skills`), uploads a populated `.csv` file, previews parsed records, and imports users in batch.
   - **Internal Execution:** Client-side CSV parser parses text into structured JSON array. Sent via `POST /api/admin/users/bulk`. The server maps department names/codes to Mongo `ObjectId`s, checks for duplicate emails, hashes passwords, auto-approves accounts, and returns a row-by-row success/failure report.

3. **Staff Account Approval Policy:**
   - **How it Works:** Staff registrations (`Technician`, `DepartmentHead`) enter a `Pending Approval` state. Admin approves them in **User Management**.
   - **Internal Execution:** `PATCH /api/admin/users/:id/approve` updates `isApproved: true` and `isActive: true`, allowing the staff member to log in.

---

## SECTION 2: DEEP-DIVE TECHNOLOGY JUSTIFICATION & INTERNAL MECHANICS

This section explains **WHY** each specific technology was selected over alternatives and **HOW** it operates internally under the hood step-by-step.

---

### 2.1 JWT (JSON Web Tokens) & bcrypt Password Hashing

```
Client                                     Server                                   Database
  │                                          │                                         │
  ├─── POST /api/auth/login (email, pass) ──►│                                         │
  │                                          ├──── User.findOne({ email }).select('+password') ─►│
  │                                          │◄─── Returns User with bcrypt hash ──────┤
  │                                          │
  │                                          ├──── bcrypt.compare(pass, hash) ──┐
  │                                          │    (Blowfish Ekskey Cipher)    │
  │                                          │◄───────────────────────────────┘
  │                                          │
  │                                          ├──── jwt.sign({ id, role }, secret)
  │◄── Returns Token + User JSON Data ───────┤
  │                                          │
  ├─── GET /api/... (Headers: Bearer Token) ─►│
  │                                          ├──── jwt.verify(token, secret)
```

#### A) Why JWT & bcrypt Were Chosen
- **Stateless Authorization:** Traditional session-based authentication requires storing session IDs in a server-side store (like Redis or memory). JWT is self-contained: all claims (user ID, role, expiration) are cryptographically signed within the token string itself. This allows backend API horizontal scaling without session sharing overhead.
- **Role-Based Access Control (RBAC):** JWT payloads include the user's `role` (`Student`, `Technician`, `DepartmentHead`, `Admin`), allowing lightweight synchronous validation in Express middleware (`authorize('Admin')`) without database lookups on every request.
- **bcrypt Security Standard:** bcrypt incorporates an adaptive salt parameter and GPU-resistant Blowfish encryption, protecting stored passwords against rainbow table attacks and brute-force cracking.

#### B) How It Works Internally Under the Hood
1. **Password Hashing Phase (bcrypt):**
   - When a password (e.g. `Password@123`) is passed to `bcrypt.hash(password, 10)`:
   - **Salting:** A random 16-byte salt is generated.
   - **Key Derivation (Ekskey Algorithm):** The Blowfish cipher runs $2^{10} = 1024$ cost factor iterations to generate a 60-character hash string formatted as:
     `$2b$10$e8N7...randomSalt...HashedOutputBytes`
   - **Verification:** `bcrypt.compare(inputPassword, storedHash)` extracts the cost factor and salt from `storedHash`, hashes `inputPassword` with the same parameters, and performs a constant-time string comparison.

2. **JWT Creation & Verification Phase:**
   - **Token Generation (`jwt.sign`):** A JWT string consists of three Base64URL-encoded segments separated by dots: `Header.Payload.Signature`.
     - `Header`: Specifies algorithm and token type (`{ "alg": "HS256", "typ": "JWT" }`).
     - `Payload`: Contains non-sensitive claims (`{ "id": "658f...", "role": "Admin", "iat": 171..., "exp": 172... }`).
     - `Signature`: Computed using HMAC-SHA256:
       $$\text{Signature} = \text{HMACSHA256}(\text{Base64URL}(Header) + "." + \text{Base64URL}(Payload), \text{JWT\_SECRET})$$
   - **Middleware Verification (`protect`):**
     - Express middleware extracts token from `Authorization: Bearer <token>` header.
     - `jwt.verify(token, process.env.JWT_SECRET)` re-computes the HMAC-SHA256 signature using the server's private secret and compares it against the token's signature segment.
     - If signatures match and `exp > currentTime`, `req.user` is populated and `next()` is called.

---

### 2.2 Socket.IO & WebSockets Real-Time Protocol

```
Client App                                                    Socket.IO Server Engine
    │                                                                   │
    ├─── HTTP GET /socket.io/?EIO=4&transport=polling ─────────────────►│ (Handshake)
    │◄── 101 Switching Protocols (Upgrade: websocket) ──────────────────┤
    │                                                                   │
    │====================== WEBSOCKET DUPLEX CONNECTION ==================│
    │                                                                   │
    ├─── socket.emit('join_complaint', { complaintId }) ───────────────►│ (Joined Room: complaint_ID)
    │                                                                   │
    ├─── socket.emit('send_message', { message }) ─────────────────────►│
    │                                                                   ├──── Save to MongoDB
    │◄── io.to('complaint_ID').emit('receive_message', data) ───────────┤ (Broadcast to Room)
```

#### A) Why Socket.IO Was Chosen
- **Bi-Directional Full-Duplex Communication:** Traditional HTTP REST is unidirectional (Client requests -> Server responds). For live complaint chat and instant assignment notifications, polling HTTP every 2 seconds creates massive bandwidth overhead. Socket.IO maintains a single, persistent TCP connection.
- **Room Abstraction:** Socket.IO natively supports "Rooms" (`io.to("complaint_1042")`), allowing messages to be broadcast strictly to participants joined to that specific complaint thread, preventing cross-talk and memory leaks.
- **Automatic Fallback & Auto-Reconnection:** If WebSockets are blocked by strict campus firewalls or proxy servers, Socket.IO automatically degrades gracefully to HTTP Long-Polling and manages automatic reconnection exponential backoff.

#### B) How It Works Internally Under the Hood
1. **Transport Upgrade Handshake Engine:**
   - The connection begins as an HTTP long-polling request (`GET /socket.io/?EIO=4&transport=polling`).
   - The server responds with a handshake JSON object containing a unique session ID (`sid`), ping interval (25s), and timeout settings.
   - Socket.IO immediately attempts a WebSocket protocol upgrade header check (`Upgrade: websocket`, `Connection: Upgrade`).
   - Upon HTTP `101 Switching Protocols` response, the TCP socket is detached from HTTP and managed by the Engine.IO layer as an open WebSocket connection.

2. **Room Management & Event Execution Flow:**
   - **Room Joining (`socket.join(roomId)`):** Socket.IO maintains an internal `Map<RoomId, Set<SocketId>>`. Calling `socket.join('complaint_658f...')` inserts the client's socket ID into that room's Set.
   - **Event Execution (`send_message`):**
     1. Client executes `socket.emit('send_message', payload)`.
     2. The payload is serialized into a Socket.IO packet frame: `42/complaint_658f...,["send_message",{...}]`.
     3. Node.js server receives packet, parses event name, saves comment to MongoDB, and executes `io.to(roomId).emit('receive_message', commentObj)`.
     4. Node iterates over `Set<SocketId>` in `roomId` and writes binary WebSocket frame payloads directly to each socket's underlying TCP stream.

---

### 2.3 MongoDB & Mongoose ODM (Object Data Modeling)

```
Mongoose Model Layer                                     MongoDB Server Engine
(Schema Validation, Hooks, Population)                   (BSON Storage, Wire Protocol, Indexes)
        │                                                        │
        ├─── Complaint.create({ title, category... }) ──────────►│
        │                                                        ├──── BSON Serializer
        │                                                        ├──── Unique Index Check (ticketId_1)
        │                                                        └──── WiredTiger Storage Engine (Disk Write)
        │                                                        
        ├─── Complaint.find().populate('assignedTechnician') ───►│
        │                                                        ├──── Query Execution Plan (Index Scan)
        │                                                        ├──── Secondary Lookup (users collection)
        │◄── Returns Hydrated Mongoose Documents ────────────────┤
```

#### A) Why MongoDB & Mongoose Were Chosen
- **Flexible Document Schema:** Campus complaints contain dynamic, non-uniform attributes (varying image attachment arrays, nested comment threads, dynamic technician skill tags). MongoDB's JSON-like document format natively represents nested arrays without complex relational JOIN tables.
- **Schema Validation & Middleware (Mongoose):** Mongoose provides strict schema enforcement, default values, pre/post hooks (e.g. password hashing before save), and schema relationship population (`.populate('assignedTechnician')`).
- **High Performance Indexing:** MongoDB supports compound indexing (`{ status: 1, department: 1 }`), ensuring rapid sub-millisecond queries even with thousands of complaint records.

#### B) How It Works Internally Under the Hood
1. **BSON Serialization & WiredTiger Storage Engine:**
   - Documents in MongoDB are stored on disk in **BSON** (Binary JSON) format. BSON adds data types (e.g., `ObjectId`, `Date`, `BinData`) and string length prefixes for fast traversal.
   - Mongoose converts JavaScript objects into BSON byte buffers and transmits them to MongoDB over the Mongo Wire Protocol via TCP.
   - MongoDB writes document modifications to its **WiredTiger Storage Engine**, utilizing B-Trees for index management and a Write-Ahead Log (WAL / journal) for crash resiliency.

2. **Population & Query Execution Engine (`.populate()`):**
   - In MongoDB, documents reference other collections via 12-byte `ObjectId`s (`ref: 'User'`).
   - When Mongoose executes `.find().populate('assignedTechnician', 'name email')`:
     1. Mongoose executes the primary query against the `complaints` collection and retrieves matching BSON documents.
     2. It extracts all `assignedTechnician` ObjectId values into an array: `[ObjectId("658f..."), ObjectId("659a...")]`.
     3. It issues a secondary query: `User.find({ _id: { $in: extractedIds } }).select('name email')`.
     4. Mongoose merges the retrieved user documents into the primary `complaint` objects in server memory before returning hydrated objects to Express.

3. **Index Synchronization Engine (`syncIndexes()`):**
   - Call `Complaint.syncIndexes()` on DB connection.
   - Mongoose issues a `listIndexes` command to MongoDB.
   - It compares existing collection indexes against `complaintSchema` definitions.
   - Any stale index present in MongoDB but omitted from the schema (such as legacy `complaint_unique_id_1`) is automatically dropped via `dropIndex()`, preventing duplicate key conflicts.

---

### 2.4 React 19 & Virtual DOM Reconciliation Engine

```
React Component State Change (e.g., setComplaints)
       │
       ▼
1. Render Phase: Re-run Component Functions & Construct New Virtual DOM Tree
       │
       ▼
2. Reconciliation Phase (Diffing Algorithm):
   Compare New Virtual DOM Tree vs. Previous Virtual DOM Tree
       │
       ▼
3. Commit Phase: Apply Minimum Required Batch Mutations to Browser Real DOM
```

#### A) Why React 19 & Vite Were Chosen
- **Declarative UI State Management:** React automatically keeps the DOM synchronized with underlying application state (`user`, `complaints`, `unreadCount`), eliminating manual DOM manipulation (`document.getElementById`).
- **Component Reusability:** Modular components (`StatusThreadTimeline`, `TableSkeleton`, `EmptyState`, `BulkUserImportModal`) are reused across all four role dashboards.
- **Vite Lightning-Fast HMR & Bundling:** Vite replaces legacy Webpack bundling with native ES Modules (ESM) during development, utilizing **esbuild** (written in Go) for 100x faster cold-start builds and Hot Module Replacement (HMR).

#### B) How It Works Internally Under the Hood
1. **Virtual DOM Reconciliation (Fiber Architecture):**
   - When state changes (e.g., `setComplaints(newArray)`):
   - **Render Phase:** React executes the component function and returns lightweight JavaScript objects (Virtual DOM nodes) describing the desired UI structure:
     `{ type: 'div', props: { className: 'card', children: [...] } }`
   - **Reconciliation (Fiber Tree Diffing):** React compares the new Virtual DOM tree with the current Fiber tree using its $O(n)$ heuristic diffing algorithm:
     - Element Type Comparison: If an element type changes (e.g., `<div>` to `<section>`), React tears down the subtree.
     - Keyed List Comparison: Using `key={c._id}`, React matches list items across renders without re-rendering unchanged rows.
   - **Commit Phase:** React batches all calculated DOM operations and applies them to the browser's real DOM in a single browser repaint frame.

2. **Vite Development Engine (Native ESM & esbuild):**
   - During dev mode (`npm run dev`), Vite serves source files over native browser ES imports (`import { api } from './api.js'`).
   - When a file is edited, Vite sends an HMR update message via WebSockets directly to the browser. Only the modified module is re-imported without reloading the page state.

---

### 2.5 Recharts & SVG Data Visualization Engine

```
Raw Metric Data Array -> Recharts Mathematical Scale Calculation -> SVG Vector Path Markup Generation -> Browser Render
```

#### A) Why Recharts Was Chosen
- **Native React SVG Integration:** Unlike Canvas-based charting libraries (e.g. Chart.js) which render pixels on a 2D canvas bitmap, Recharts builds pure SVG (Scalable Vector Graphics) nodes directly inside React's Virtual DOM.
- **Crisp Scaling & Accessibility:** SVG elements scale infinitely without pixelation on Retina/4K displays and respond to CSS hover events and Tailwind styles effortlessly.

#### B) How It Works Internally Under the Hood
1. **Coordinate Calculation & Vector Path Math:**
   - Input data array: `[{ l: 'Jan', v: 40 }, { l: 'Feb', v: 85 }]`.
   - Recharts computes linear scale functions mapping data values $v \in [0, v_{max}]$ to container pixel coordinates $(x, y) \in [0, width] \times [0, height]$.
   - For Bar Charts, it computes SVG `<rect>` coordinate dimensions:
     $$x = \text{margin} + i \cdot \text{barStep}, \quad y = height - \left(\frac{v}{v_{max}} \cdot height\right), \quad \text{height} = \frac{v}{v_{max}} \cdot height$$
   - For Pie/Donut Charts, it calculates SVG arc paths using trigonometric functions ($r \cos \theta, r \sin \theta$) to construct `<path d="M... A...">` vector paths.

---

### 2.6 Multer & Multipart Form-Data Stream Parser

```
Client (FormData with files) ------------> HTTP POST Request Stream (multipart/form-data)
                                                    │
                                                    ▼
                                           Multer Disk Engine
                                                    │
                                  ┌─────────────────┴─────────────────┐
                                  ▼                                   ▼
                       Parse Boundary Markers            Save File Stream to /uploads
                                  │                                   │
                                  └─────────────────┬─────────────────┘
                                                    ▼
                                          Populate req.files & req.body
```

#### A) Why Multer Was Chosen
- **Streaming Multi-Part Data Handling:** Standard JSON bodies (`application/json`) cannot encode binary file data (photos, attachments) efficiently. `multipart/form-data` streams binary chunks alongside text fields. Multer handles streaming multipart data parsing without loading entire binary files into server RAM simultaneously.

#### B) How It Works Internally Under the Hood
1. **Boundary Extraction & Streaming Chunk Assembly:**
   - The browser generates a unique boundary string string header:
     `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YW`
   - Payload data is streamed in chunks:
     ```
     ------WebKitFormBoundary7MA4YW
     Content-Disposition: form-data; name="title"

     A/C Water Leak
     ------WebKitFormBoundary7MA4YW
     Content-Disposition: form-data; name="images"; filename="leak.jpg"
     Content-Type: image/jpeg

     [Binary JPEG Byte Stream Data...]
     ------WebKitFormBoundary7MA4YW--
     ```
   - Multer uses **Busboy** internally to scan incoming byte streams for boundary markers.
   - Text fields are written to `req.body`; file streams are piped directly to disk storage (`/uploads/filename.jpg`) or Cloudinary storage streams.
   - File metadata (filename, path, size) is attached to `req.files`.

---

### 2.7 Client-Side CSV Parsing Algorithm (Bulk User Import)

```
Raw CSV Text -> Line Splitter -> Quote-Aware Tokenizer -> Header Normalization -> Validate Records -> API Payload
```

#### A) Why Client-Side CSV Parsing Was Chosen
- **Immediate User Feedback & Preview:** Parsing CSV files in the browser before network transmission allows Instant Preview of records in a table, displaying valid vs. invalid rows (`Ready` vs `Invalid`) without server roundtrips.
- **Server Offloading:** Offloads CPU-intensive string tokenization and regex validation from Node.js server to client browser.

#### B) How It Works Internally Under the Hood
1. **Quote-Aware CSV Parsing Algorithm:**
   - Standard `String.split(',')` fails when a cell contains commas inside quotes (e.g. `"Wiring, AC Repair"`).
   - Our CSV parser iterates character-by-character through the raw string using a finite state machine:

```javascript
// State Tracking
let insideQuotes = false;
let currentField = '';
let currentRow = [];

for (let i = 0; i < text.length; i++) {
  const char = text[i];
  
  if (char === '"') {
    insideQuotes = !insideQuotes; // Toggle quote state
  } else if (char === ',' && !insideQuotes) {
    currentRow.push(currentField.trim());
    currentField = '';
  } else if ((char === '\n' || char === '\r') && !insideQuotes) {
    currentRow.push(currentField.trim());
    lines.push(currentRow);
    currentRow = [];
    currentField = '';
  } else {
    currentField += char;
  }
}
```

2. **Field Mapping & Validation:**
   - Line `0` is tokenized into normalized header strings (`Name`, `Email`, `Role`, `Password`, `Phone`, `Department`, `Skills`).
   - Remaining rows are mapped to JavaScript objects:
     `{ name, email, role, password: password || 'ResolveDesk123!', phone, department, skills }`
   - Checked for mandatory fields (`Boolean(name && email)`).
   - Submitted to `POST /api/admin/users/bulk`.

---

## SECTION 3: SYSTEM SUMMARY & COMPARATIVE ADVANTAGES

ResolveDesk combines lightweight modern frameworks with robust backend architecture to solve campus complaint management challenges effectively:

| Feature | Legacy Manual / Email System | ResolveDesk System |
| :--- | :--- | :--- |
| **Request Logging** | Physical registers or loose emails | Centralized digital ticket creation with auto ID generation (`#CMP-XXXX`) |
| **Status Visibility** | Zero visibility; manual phone calls required | Real-time vertical status timeline with active step pulse indicator |
| **Workload Distribution** | Blind assignment; overloaded technicians | Real-time technician active task counter & workload percentage indicator |
| **Completion Verification** | Verbal confirmation | Mandatory completion photo upload & student 1–5 star rating validation |
| **Communication** | Fragmented SMS / Whatsapp | In-app per-complaint Socket.IO live chat room |
| **User Onboarding** | Manual creation one-by-one | Bulk CSV User Import with automated template download & validation |
| **Governance & Reporting**| No data insights | Recharts visual dashboard & 1-click CSV report exports |
