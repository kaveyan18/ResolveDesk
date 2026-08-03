const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const User = require('../models/User');
const generateTicketId = require('../utils/generateTicketId');
const { uploadToCloudinary } = require('../config/cloudinary');
const {
  COMPLAINT_PRIORITY_VALUES,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_VALUES,
  NOTIFICATION_TYPE,
} = require('../constants/enums');
const {
  sendComplaintStatusEmail,
  sendAssignmentEmail,
} = require('../utils/emailService');
const { getIO } = require('../socket');

const emitRealtimeNotification = (recipientId, title, message, extraData = {}) => {
  try {
    const io = getIO();
    if (io) {
      if (recipientId) {
        io.emit('notification_received', {
          recipientId: recipientId.toString(),
          title,
          message,
          ...extraData,
        });
      }
      io.emit('complaint_updated', {
        title,
        message,
        ...extraData,
      });
      if (extraData.complaintId) {
        io.to(`complaint_${extraData.complaintId}`).emit('complaint_updated', {
          title,
          message,
          ...extraData,
        });
      }
    }
  } catch (err) {
    // Socket might not be initialized in test runner
  }
};

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (Authenticated users / Students)
 */
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, priority, department } =
      req.body;

    // 1. Mandatory field validations
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Please provide all required fields: title, description, category, and location',
      });
    }

    // 2. Validate priority against AGENTS.md section 5 enums
    const selectedPriority = priority || COMPLAINT_PRIORITY.MEDIUM;
    if (!COMPLAINT_PRIORITY_VALUES.includes(selectedPriority)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid priority '${priority}'. Must be one of: ${COMPLAINT_PRIORITY_VALUES.join(', ')}`,
      });
    }

    // 3. Resolve department if provided (by ID or Name/Code)
    let departmentId = null;
    if (department) {
      if (department.match(/^[0-9a-fA-F]{24}$/)) {
        departmentId = department;
      } else {
        const cleanDept = department.trim();
        let foundDept = await Department.findOne({
          $or: [
            { name: new RegExp(`^${cleanDept}$`, 'i') },
            { code: new RegExp(`^${cleanDept}$`, 'i') },
          ],
        });
        if (!foundDept) {
          try {
            const derivedCode = cleanDept.substring(0, 4).toUpperCase();
            foundDept = await Department.create({
              name: cleanDept,
              code: derivedCode,
              description: `${cleanDept} Department`,
            });
          } catch (e) {
            // Ignore duplicate code error if concurrent creation occurs
            foundDept = await Department.findOne({
              name: new RegExp(`^${cleanDept}$`, 'i'),
            });
          }
        }
        if (foundDept) {
          departmentId = foundDept._id;
        }
      }
    }

    // 4. Handle image uploads to Cloudinary (if files attached)
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'resolvedesk/complaints')
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      imageUrls.push(...uploadedUrls);
    }

    // 5. Generate unique sequential ticket ID
    const ticketId = await generateTicketId();

    // 6. Create complaint document
    const complaint = await Complaint.create({
      ticketId,
      title,
      description,
      category,
      location,
      priority: selectedPriority,
      status: COMPLAINT_STATUS.PENDING,
      student: req.user._id,
      department: departmentId,
      images: imageUrls,
    });

    // Populate refs for full response object
    await complaint.populate([
      { path: 'student', select: 'name email role phone' },
      { path: 'department', select: 'name code' },
    ]);

    // Broadcast real-time notification to update all dashboards
    emitRealtimeNotification(
      null,
      'New Complaint Registered',
      `Complaint ${complaint.ticketId} has been created.`,
      { complaintId: complaint._id.toString(), status: complaint.status }
    );

    return res.status(201).json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error while creating complaint',
    });
  }
};

/**
 * @desc    Get student's own complaints list (with search, status/priority filters, & pagination) and dashboard stats
 * @route   GET /api/complaints/mine
 * @access  Private (Student)
 */
const getMyComplaints = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Filter query construction
    const filterQuery = { student: studentId };

    if (req.query.status && req.query.status !== 'All') {
      filterQuery.status = req.query.status;
    }

    if (req.query.priority && req.query.priority !== 'All') {
      filterQuery.priority = req.query.priority;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filterQuery.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { location: searchRegex },
        { category: searchRegex },
      ];
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch complaints and filtered count
    const [complaints, filteredTotal] = await Promise.all([
      Complaint.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('department', 'name code')
        .populate('assignedTechnician', 'name email'),
      Complaint.countDocuments(filterQuery),
    ]);

    // Calculate overall status counts
    const [total, pending, assigned, inProgress, resolved, closed, rejected] =
      await Promise.all([
        Complaint.countDocuments({ student: studentId }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.PENDING,
        }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.ASSIGNED,
        }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.IN_PROGRESS,
        }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.RESOLVED,
        }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.CLOSED,
        }),
        Complaint.countDocuments({
          student: studentId,
          status: COMPLAINT_STATUS.REJECTED,
        }),
      ]);

    // Fetch top 6 recent complaints
    const recentComplaints = await Complaint.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('department', 'name code')
      .populate('assignedTechnician', 'name email');

    // Fetch recent notifications
    const notifications = await Notification.find({ recipient: studentId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate monthly complaint distribution for past 6 months
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const monthlyCounts = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const count = await Complaint.countDocuments({
        student: studentId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      monthlyCounts.push({
        l: monthNames[d.getMonth()],
        v: count,
      });
    }

    return res.json({
      status: 'success',
      data: {
        complaints,
        pagination: {
          total: filteredTotal,
          page,
          pages: Math.ceil(filteredTotal / limit) || 1,
          limit,
        },
        stats: {
          total,
          pending,
          assigned,
          inProgress,
          resolved,
          closed,
          rejected,
        },
        monthlyCounts,
        recentComplaints,
        notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching student complaints list',
    });
  }
};

/**
 * @desc    Get department-scoped complaints list with filters (status, priority, technician, search)
 * @route   GET /api/complaints/department
 * @access  Private (DepartmentHead, Admin)
 */
const getDepartmentComplaints = async (req, res) => {
  try {
    const filterQuery = {};

    if (req.user.role !== 'Admin') {
      let departmentId = req.user.department;
      if (!departmentId && req.user.role === 'DepartmentHead') {
        const dept = await Department.findOne({ head: req.user._id });
        if (dept) departmentId = dept._id;
      }
      if (departmentId) {
        filterQuery.department = departmentId;
      }
    }

    if (req.query.department && req.query.department !== 'All') {
      filterQuery.department = req.query.department;
    }

    if (req.query.status && req.query.status !== 'All') {
      filterQuery.status = req.query.status;
    }

    if (req.query.priority && req.query.priority !== 'All') {
      filterQuery.priority = req.query.priority;
    }

    if (req.query.technician && req.query.technician !== 'All') {
      if (req.query.technician === 'Unassigned') {
        filterQuery.assignedTechnician = null;
      } else {
        filterQuery.assignedTechnician = req.query.technician;
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filterQuery.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { location: searchRegex },
      ];
    }

    const complaints = await Complaint.find(filterQuery)
      .sort({ createdAt: -1 })
      .populate('student', 'name email phone avatar')
      .populate('assignedTechnician', 'name email phone avatar skills')
      .populate('department', 'name code');

    return res.json({
      status: 'success',
      data: {
        total: complaints.length,
        complaints,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching department complaints',
    });
  }
};

/**
 * @desc    Manually assign a complaint to a technician
 * @route   POST /api/complaints/:id/assign
 * @access  Private (DepartmentHead, Admin)
 */
const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId, priority, note } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Technician ID is required for assignment',
      });
    }

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        status: 'fail',
        message: 'Selected technician not found',
      });
    }

    complaint.assignedTechnician = technicianId;
    complaint.assignedBy = req.user._id;
    complaint.status = COMPLAINT_STATUS.ASSIGNED;

    if (priority && COMPLAINT_PRIORITY_VALUES.includes(priority)) {
      complaint.priority = priority;
    }

    if (note && note.trim()) {
      complaint.comments.push({
        sender: req.user._id,
        message: `[Assignment Note]: ${note.trim()}`,
      });
    }

    await complaint.save({ validateBeforeSave: false });

    await complaint.populate([
      {
        path: 'student',
        select:
          'name email role phone emailNotificationsEnabled pushNotificationsEnabled',
      },
      { path: 'department', select: 'name code' },
      {
        path: 'assignedTechnician',
        select:
          'name email phone avatar emailNotificationsEnabled pushNotificationsEnabled',
      },
    ]);

    // Send server-side notification & Email to Student
    try {
      const studentId = complaint.student?._id || complaint.student || complaint.user;
      if (studentId) {
        const notifTitle = `Technician assigned to ${complaint.ticketId || 'complaint'}`;
        const notifMsg = `${technician.name} was assigned to resolve your complaint.`;

        await Notification.create({
          recipient: studentId,
          sender: req.user._id,
          complaint: complaint._id,
          title: notifTitle,
          message: notifMsg,
          type: NOTIFICATION_TYPE.COMPLAINT_ASSIGNED,
        });

        emitRealtimeNotification(studentId, notifTitle, notifMsg, {
          complaintId: complaint._id.toString(),
          status: complaint.status,
        });

        if (
          complaint.student?.email &&
          complaint.student.emailNotificationsEnabled !== false
        ) {
          sendAssignmentEmail({
            recipientEmail: complaint.student.email,
            recipientName: complaint.student.name,
            ticketId: complaint.ticketId,
            title: complaint.title,
            assignedStaffName: technician.name,
            role: 'Student',
            priority: complaint.priority,
            location: complaint.location,
          }).catch((e) => console.error('Email error:', e.message));
        }
      }
    } catch (notifErr) {
      console.error('Failed to notify student of assignment:', notifErr.message);
    }

    // Send server-side notification & Email to Technician
    try {
      const techNotifTitle = `New complaint assigned: ${complaint.ticketId}`;
      const techNotifMsg = `You were assigned ${complaint.title} (${complaint.location}). Priority: ${complaint.priority}.`;

      await Notification.create({
        recipient: technician._id,
        sender: req.user._id,
        complaint: complaint._id,
        title: techNotifTitle,
        message: techNotifMsg,
        type: NOTIFICATION_TYPE.COMPLAINT_ASSIGNED,
      });

      emitRealtimeNotification(technician._id, techNotifTitle, techNotifMsg, {
        complaintId: complaint._id.toString(),
        status: complaint.status,
      });

      if (
        technician.email &&
        technician.emailNotificationsEnabled !== false
      ) {
        sendAssignmentEmail({
          recipientEmail: technician.email,
          recipientName: technician.name,
          ticketId: complaint.ticketId,
          title: complaint.title,
          assignedStaffName: technician.name,
          role: 'Technician',
          priority: complaint.priority,
          location: complaint.location,
        }).catch((e) => console.error('Email error:', e.message));
      }
    } catch (notifErr) {
      console.error('Failed to notify technician of assignment:', notifErr.message);
    }

    return res.json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error assigning complaint',
    });
  }
};

/**
 * @desc    Get technician's assigned complaints queue and summary statistics
 * @route   GET /api/complaints/assigned
 * @access  Private (Technician, DepartmentHead, Admin)
 */
const getAssignedComplaints = async (req, res) => {
  try {
    const technicianId = req.user._id;

    // Start of today and start of month
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Queries
    const [assignedToday, pending, inProgress, completedMonth, completedComplaints] =
      await Promise.all([
        Complaint.countDocuments({
          assignedTechnician: technicianId,
          updatedAt: { $gte: startOfToday },
        }),
        Complaint.countDocuments({
          assignedTechnician: technicianId,
          status: { $in: [COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.PENDING] },
        }),
        Complaint.countDocuments({
          assignedTechnician: technicianId,
          status: COMPLAINT_STATUS.IN_PROGRESS,
        }),
        Complaint.countDocuments({
          assignedTechnician: technicianId,
          status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] },
          resolvedAt: { $gte: startOfMonth },
        }),
        Complaint.find({
          assignedTechnician: technicianId,
          status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] },
          resolvedAt: { $ne: null },
        }),
      ]);

    // Calculate Average Resolution Time in hours
    let avgResolutionTime = '0 hrs';
    if (completedComplaints.length > 0) {
      const totalHours = completedComplaints.reduce((sum, c) => {
        const diffMs = new Date(c.resolvedAt || c.updatedAt) - new Date(c.createdAt);
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      const avgHours = (totalHours / completedComplaints.length).toFixed(1);
      avgResolutionTime = `${avgHours} hrs`;
    }

    // Fetch assigned complaints queue
    const complaints = await Complaint.find({ assignedTechnician: technicianId })
      .sort({ createdAt: -1 })
      .populate('student', 'name email phone avatar')
      .populate('department', 'name code');

    return res.json({
      status: 'success',
      data: {
        stats: {
          assignedToday: assignedToday || complaints.length,
          pending,
          inProgress,
          completedMonth,
          avgResolutionTime,
        },
        complaints,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching assigned complaints queue',
    });
  }
};

/**
 * @desc    Get technician's completed complaints history with ratings
 * @route   GET /api/complaints/completed
 * @access  Private (Technician, DepartmentHead, Admin)
 */
const getCompletedComplaints = async (req, res) => {
  try {
    const technicianId = req.user._id;

    const complaints = await Complaint.find({
      assignedTechnician: technicianId,
      status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] },
    })
      .sort({ resolvedAt: -1, updatedAt: -1 })
      .populate('student', 'name email phone avatar')
      .populate('department', 'name code');

    return res.json({
      status: 'success',
      data: {
        total: complaints.length,
        complaints,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching completed complaints',
    });
  }
};

/**
 * Helper function to find complaint by ObjectId or TicketId
 */
const findComplaintByIdOrTicket = async (id) => {
  if (!id) return null;
  const strId = String(id).trim();
  const isObjectId = strId.match(/^[0-9a-fA-F]{24}$/);
  const searchCondition = isObjectId
    ? { _id: strId }
    : { ticketId: strId.startsWith('#') ? strId : `#${strId}` };
  return Complaint.findOne(searchCondition);
};

/**
 * @desc    Get single complaint details by ID or ticketId
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Check authorization: Student can only view their own complaint, staff can view department/all
    if (
      req.user.role === 'Student' &&
      complaint.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to view this complaint',
      });
    }

    await complaint.populate([
      { path: 'student', select: 'name email role phone avatar' },
      { path: 'department', select: 'name code description' },
      { path: 'assignedTechnician', select: 'name email phone avatar skills' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'comments.sender', select: 'name email role avatar' },
    ]);

    return res.json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching complaint detail',
    });
  }
};

/**
 * @desc    Update complaint status
 * @route   PATCH /api/complaints/:id/status
 * @access  Private (Technician, DepartmentHead, Admin)
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !COMPLAINT_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid status '${status}'. Must be one of: ${COMPLAINT_STATUS_VALUES.join(', ')}`,
      });
    }

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Technician Status Rules:
    // 1. Technicians cannot modify complaints that are already Resolved or Closed
    // 2. Technicians can only advance status forward (Assigned -> In Progress -> Resolved)
    if (req.user.role === 'Technician') {
      if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(complaint.status)) {
        return res.status(400).json({
          status: 'fail',
          message: `Technicians cannot modify a ${complaint.status.toLowerCase()} complaint. Only Department Head or Admin can reopen or adjust resolved/closed complaints.`,
        });
      }

      const STATUS_HIERARCHY = {
        Pending: 1,
        Assigned: 2,
        'In Progress': 3,
        Resolved: 4,
        Closed: 5,
      };

      const currentLevel = STATUS_HIERARCHY[complaint.status] || 0;
      const targetLevel = STATUS_HIERARCHY[status] || 0;

      if (targetLevel < currentLevel) {
        return res.status(400).json({
          status: 'fail',
          message: `Cannot move status backward from '${complaint.status}' to '${status}'. Status updates by staff must proceed in a forward direction.`,
        });
      }
    }

    complaint.status = status;

    if (status === COMPLAINT_STATUS.RESOLVED && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    } else if (status === COMPLAINT_STATUS.CLOSED && !complaint.closedAt) {
      complaint.closedAt = new Date();
    } else if (status === COMPLAINT_STATUS.REJECTED && !complaint.rejectedAt) {
      complaint.rejectedAt = new Date();
    }

    if (notes && notes.trim()) {
      complaint.comments.push({
        sender: req.user._id,
        message: `[Status Update: ${status}] ${notes.trim()}`,
      });
    }

    await complaint.save();

    await complaint.populate([
      {
        path: 'student',
        select:
          'name email role phone emailNotificationsEnabled pushNotificationsEnabled',
      },
      { path: 'department', select: 'name code' },
      {
        path: 'assignedTechnician',
        select: 'name email emailNotificationsEnabled pushNotificationsEnabled',
      },
    ]);

    // Trigger Notification & Email for Student
    try {
      const statusTitle = `Status update on ${complaint.ticketId}`;
      const statusMsg = `Your complaint status was updated to '${status}'.`;

      await Notification.create({
        recipient: complaint.student._id,
        sender: req.user._id,
        complaint: complaint._id,
        title: statusTitle,
        message: statusMsg,
        type: NOTIFICATION_TYPE.COMPLAINT_STATUS,
      });

      emitRealtimeNotification(complaint.student._id, statusTitle, statusMsg, {
        complaintId: complaint._id.toString(),
        status: complaint.status,
      });

      if (
        complaint.student?.email &&
        complaint.student.emailNotificationsEnabled !== false
      ) {
        sendComplaintStatusEmail({
          recipientEmail: complaint.student.email,
          recipientName: complaint.student.name,
          ticketId: complaint.ticketId,
          title: complaint.title,
          status,
          priority: complaint.priority,
          location: complaint.location,
          message: `Your complaint status has been updated to ${status}.`,
          updatedBy: req.user.name || 'Staff Member',
        }).catch((e) => console.error('Email error:', e.message));
      }
    } catch (notifErr) {
      console.error('Failed to send status update notification:', notifErr.message);
    }

    return res.json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error updating complaint status',
    });
  }
};

/**
 * @desc    Upload completion proof photos and mark complaint complete (Resolved)
 * @route   POST /api/complaints/:id/complete
 * @access  Private (Technician, DepartmentHead, Admin)
 */
const completeComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Handle completion images upload to Cloudinary
    const completionUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'resolvedesk/completions')
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      completionUrls.push(...uploadedUrls);
    }

    complaint.status = COMPLAINT_STATUS.RESOLVED;
    complaint.resolvedAt = new Date();

    if (completionUrls.length > 0) {
      complaint.completionImages.push(...completionUrls);
    }

    if (notes && notes.trim()) {
      complaint.comments.push({
        sender: req.user._id,
        message: `[Completion Notes]: ${notes.trim()}`,
      });
    }

    await complaint.save();

    await complaint.populate([
      {
        path: 'student',
        select:
          'name email role phone emailNotificationsEnabled pushNotificationsEnabled',
      },
      { path: 'department', select: 'name code' },
      {
        path: 'assignedTechnician',
        select: 'name email emailNotificationsEnabled pushNotificationsEnabled',
      },
    ]);

    // Trigger Notification & Email for Student
    try {
      const completionTitle = `Complaint ${complaint.ticketId} Marked Complete`;
      const completionMsg = `${req.user.name} resolved your complaint. Please inspect and rate the service.`;

      await Notification.create({
        recipient: complaint.student._id,
        sender: req.user._id,
        complaint: complaint._id,
        title: completionTitle,
        message: completionMsg,
        type: NOTIFICATION_TYPE.COMPLAINT_STATUS,
      });

      emitRealtimeNotification(complaint.student._id, completionTitle, completionMsg, {
        complaintId: complaint._id.toString(),
        status: complaint.status,
      });

      if (
        complaint.student?.email &&
        complaint.student.emailNotificationsEnabled !== false
      ) {
        sendComplaintStatusEmail({
          recipientEmail: complaint.student.email,
          recipientName: complaint.student.name,
          ticketId: complaint.ticketId,
          title: complaint.title,
          status: COMPLAINT_STATUS.RESOLVED,
          priority: complaint.priority,
          location: complaint.location,
          message: completionMsg,
          updatedBy: req.user.name || 'Technician',
        }).catch((e) => console.error('Email error:', e.message));
      }
    } catch (notifErr) {
      console.error('Failed to send completion notification:', notifErr.message);
    }

    return res.json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error completing complaint',
    });
  }
};

/**
 * @desc    Submit student rating (1-5) and feedback for a resolved complaint
 * @route   PATCH /api/complaints/:id/rate
 * @access  Private (Student)
 */
const rateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Authorization check
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to rate this complaint',
      });
    }

    // Status check
    if (![COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(complaint.status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Ratings can only be submitted once a complaint is Resolved or Closed',
      });
    }

    complaint.rating = Math.round(numericRating);
    if (feedback) {
      complaint.feedback = feedback.trim();
    }

    // Set status to Closed upon rating
    complaint.status = COMPLAINT_STATUS.CLOSED;
    if (!complaint.closedAt) {
      complaint.closedAt = new Date();
    }

    await complaint.save();

    await complaint.populate([
      { path: 'student', select: 'name email role phone' },
      { path: 'department', select: 'name code' },
      { path: 'assignedTechnician', select: 'name email' },
    ]);

    // Broadcast real-time rating update
    emitRealtimeNotification(
      complaint.assignedTechnician?._id,
      'New Rating Submitted',
      `Rating ${complaint.rating}/5 stars submitted for complaint ${complaint.ticketId}`,
      { complaintId: complaint._id.toString(), status: complaint.status }
    );

    return res.json({
      status: 'success',
      data: {
        complaint,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error submitting complaint rating',
    });
  }
};

/**
 * @desc    Get comments list for a complaint
 * @route   GET /api/complaints/:id/comments
 * @access  Private (Authenticated Participants)
 */
const getComplaintComments = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Participant Authorization Check
    const isStudent = complaint.student.toString() === req.user._id.toString();
    const isAssignedTech =
      complaint.assignedTechnician &&
      complaint.assignedTechnician.toString() === req.user._id.toString();
    const isStaff = ['DepartmentHead', 'Admin'].includes(req.user.role);

    if (!isStudent && !isAssignedTech && !isStaff) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to view comments on this complaint',
      });
    }

    await complaint.populate({
      path: 'comments.sender',
      select: 'name email role avatar',
    });

    return res.json({
      status: 'success',
      data: {
        comments: complaint.comments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching complaint comments',
    });
  }
};

/**
 * @desc    Add a comment to a complaint
 * @route   POST /api/complaints/:id/comments
 * @access  Private (Authenticated Participants: Student, Technician, Head, Admin)
 */
const addComplaintComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Comment message cannot be empty',
      });
    }

    const complaint = await findComplaintByIdOrTicket(id);

    if (!complaint) {
      return res.status(404).json({
        status: 'fail',
        message: 'Complaint not found',
      });
    }

    // Participant Authorization Check
    const isStudent = complaint.student.toString() === req.user._id.toString();
    const isAssignedTech =
      complaint.assignedTechnician &&
      complaint.assignedTechnician.toString() === req.user._id.toString();
    const isStaff = ['DepartmentHead', 'Admin'].includes(req.user.role);

    if (!isStudent && !isAssignedTech && !isStaff) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to post comments on this complaint',
      });
    }

    // Push new comment
    const newComment = {
      sender: req.user._id,
      message: message.trim(),
    };

    complaint.comments.push(newComment);
    await complaint.save();

    // Populate newly created comment sender
    await complaint.populate({
      path: 'comments.sender',
      select: 'name email role avatar',
    });

    const createdComment = complaint.comments[complaint.comments.length - 1];

    // Trigger server-side notification & Socket.IO events for participants
    try {
      const recipientId = isStudent
        ? complaint.assignedTechnician || complaint.assignedBy
        : complaint.student;

      if (recipientId && recipientId.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          complaint: complaint._id,
          title: `New message on ${complaint.ticketId}`,
          message: `${req.user.name}: "${message.trim()}"`,
          type: NOTIFICATION_TYPE.COMMENT_ADDED,
        });
      }

      emitRealtimeNotification(
        recipientId,
        `New message on ${complaint.ticketId}`,
        `${req.user.name}: "${message.trim()}"`,
        { complaintId: complaint._id.toString(), comment: createdComment }
      );

      const io = getIO();
      if (io) {
        io.to(`complaint_${complaint._id}`).emit('new_message', {
          complaintId: complaint._id.toString(),
          comment: createdComment,
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger comment notification:', notifErr.message);
    }

    return res.status(201).json({
      status: 'success',
      data: {
        comment: createdComment,
        comments: complaint.comments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error adding complaint comment',
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getDepartmentComplaints,
  assignComplaint,
  getAssignedComplaints,
  getCompletedComplaints,
  getComplaintById,
  updateComplaintStatus,
  completeComplaint,
  rateComplaint,
  getComplaintComments,
  addComplaintComment,
};
