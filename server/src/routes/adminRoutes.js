const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  getUsers,
  createUser,
  updateUser,
  approveUser,
  toggleUserActive,
  deleteUser,
  bulkImportUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
  '/overview',
  protect,
  authorize('Admin', 'DepartmentHead'),
  getAdminOverview
);

// User Management CRUD (Admin-Only)
router.get('/users', protect, authorize('Admin'), getUsers);
router.post('/users', protect, authorize('Admin'), createUser);
router.post('/users/bulk', protect, authorize('Admin'), bulkImportUsers);
router.put('/users/:id', protect, authorize('Admin'), updateUser);
router.patch('/users/:id/approve', protect, authorize('Admin'), approveUser);
router.patch('/users/:id/toggle-active', protect, authorize('Admin'), toggleUserActive);
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
