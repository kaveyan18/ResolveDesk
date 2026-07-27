const express = require('express');
const router = express.Router();
const {
  getDepartmentOverview,
  getDepartmentTechnicians,
  getDepartmentStaff,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getDepartments);
router.post('/', protect, authorize('Admin'), createDepartment);
router.put('/:id', protect, authorize('Admin'), updateDepartment);
router.delete('/:id', protect, authorize('Admin'), deleteDepartment);

router.get(
  '/technicians',
  protect,
  authorize('DepartmentHead', 'Admin'),
  getDepartmentTechnicians
);
router.get(
  '/:id/overview',
  protect,
  authorize('DepartmentHead', 'Admin'),
  getDepartmentOverview
);
router.get(
  '/:id/staff',
  protect,
  authorize('DepartmentHead', 'Admin'),
  getDepartmentStaff
);

module.exports = router;
