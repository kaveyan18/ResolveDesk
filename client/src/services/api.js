const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Common fetch wrapper with JSON headers and token support
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('resolvedesk_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during API request');
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email, otp, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  getAdminOverview: () =>
    request('/admin/overview', {
      method: 'GET',
    }),

  getAdminUsers: (queryString = '') =>
    request(`/admin/users${queryString}`, {
      method: 'GET',
    }),

  createAdminUser: (userData) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateAdminUser: (id, userData) =>
    request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  approveStaffUser: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}/approve`, {
      method: 'PATCH',
    }),

  toggleUserActive: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}/toggle-active`, {
      method: 'PATCH',
    }),

  deleteAdminUser: (id) =>
    request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createComplaint: async (formData) => {
    const token = localStorage.getItem('resolvedesk_token');
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit complaint');
    }
    return data;
  },

  getMyComplaints: (queryString = '') =>
    request(`/complaints/mine${queryString}`, {
      method: 'GET',
    }),

  getDepartmentComplaints: (queryString = '') =>
    request(`/complaints/department${queryString}`, {
      method: 'GET',
    }),

  assignComplaint: (id, assignmentData) =>
    request(`/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    }),

  getAssignedComplaints: () =>
    request('/complaints/assigned', {
      method: 'GET',
    }),

  getCompletedComplaints: () =>
    request('/complaints/completed', {
      method: 'GET',
    }),

  getDepartmentOverview: (id = 'mine') =>
    request(`/departments/${encodeURIComponent(id)}/overview`, {
      method: 'GET',
    }),

  getDepartmentTechnicians: () =>
    request('/departments/technicians', {
      method: 'GET',
    }),

  getDepartmentStaff: (id = 'mine') =>
    request(`/departments/${encodeURIComponent(id)}/staff`, {
      method: 'GET',
    }),

  getDepartmentReports: (queryString = '') =>
    request(`/reports/department${queryString}`, {
      method: 'GET',
    }),

  exportDepartmentReportCSV: async (queryString = '') => {
    const token = localStorage.getItem('resolvedesk_token');
    const response = await fetch(`${API_BASE_URL}/reports/export/csv${queryString}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error('Failed to export CSV report');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ResolveDesk-Department-Report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getDepartments: () =>
    request('/departments', {
      method: 'GET',
    }),

  createDepartment: (deptData) =>
    request('/departments', {
      method: 'POST',
      body: JSON.stringify(deptData),
    }),

  updateDepartment: (id, deptData) =>
    request(`/departments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(deptData),
    }),

  deleteDepartment: (id) =>
    request(`/departments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getComplaintById: (id) =>
    request(`/complaints/${encodeURIComponent(id)}`, {
      method: 'GET',
    }),

  updateComplaintStatus: (id, status, notes = '') =>
    request(`/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  completeComplaint: async (id, formData) => {
    const token = localStorage.getItem('resolvedesk_token');
    const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to complete complaint');
    }
    return data;
  },

  rateComplaint: (id, rating, feedback = '') =>
    request(`/complaints/${encodeURIComponent(id)}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({ rating, feedback }),
    }),

  getComplaintComments: (id) =>
    request(`/complaints/${encodeURIComponent(id)}/comments`, {
      method: 'GET',
    }),

  addComplaintComment: (id, message) =>
    request(`/complaints/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getNotifications: () =>
    request('/notifications', {
      method: 'GET',
    }),

  markNotificationRead: (id) =>
    request(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),
};
