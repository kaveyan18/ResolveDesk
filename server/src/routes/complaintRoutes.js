const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Student & General
router.post('/', protect, upload.array('images', 5), createComplaint);
router.get('/mine', protect, getMyComplaints);

// Department Head & Admin Queue
router.get(
  '/department',
  protect,
  authorize('DepartmentHead', 'Admin'),
  getDepartmentComplaints
);
router.post(
  '/:id/assign',
  protect,
  authorize('DepartmentHead', 'Admin'),
  assignComplaint
);

// Technician Queue & Completed History
router.get(
  '/assigned',
  protect,
  authorize('Technician', 'DepartmentHead', 'Admin'),
  getAssignedComplaints
);
router.get(
  '/completed',
  protect,
  authorize('Technician', 'DepartmentHead', 'Admin'),
  getCompletedComplaints
);

// Detail & Status Actions
router.get('/:id', protect, getComplaintById);
router.patch(
  '/:id/status',
  protect,
  authorize('Technician', 'DepartmentHead', 'Admin'),
  updateComplaintStatus
);
router.post(
  '/:id/complete',
  protect,
  authorize('Technician', 'DepartmentHead', 'Admin'),
  upload.array('completionImages', 5),
  completeComplaint
);
router.patch('/:id/rate', protect, rateComplaint);

// Comments Sub-resource
router.get('/:id/comments', protect, getComplaintComments);
router.post('/:id/comments', protect, addComplaintComment);

module.exports = router;
