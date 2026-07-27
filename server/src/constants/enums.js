const ROLES = Object.freeze({
  STUDENT: 'Student',
  TECHNICIAN: 'Technician',
  DEPARTMENT_HEAD: 'DepartmentHead',
  ADMIN: 'Admin',
});

const ROLE_VALUES = Object.values(ROLES);

const COMPLAINT_STATUS = Object.freeze({
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
});

const COMPLAINT_STATUS_VALUES = Object.values(COMPLAINT_STATUS);

const COMPLAINT_PRIORITY = Object.freeze({
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
});

const COMPLAINT_PRIORITY_VALUES = Object.values(COMPLAINT_PRIORITY);

const NOTIFICATION_TYPE = Object.freeze({
  COMPLAINT_STATUS: 'complaint_status',
  COMPLAINT_ASSIGNED: 'complaint_assigned',
  COMMENT_ADDED: 'comment_added',
  ACCOUNT_APPROVED: 'account_approved',
  SYSTEM: 'system',
});

const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE);

module.exports = {
  ROLES,
  ROLE_VALUES,
  COMPLAINT_STATUS,
  COMPLAINT_STATUS_VALUES,
  COMPLAINT_PRIORITY,
  COMPLAINT_PRIORITY_VALUES,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_VALUES,
};
