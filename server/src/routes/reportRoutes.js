const express = require('express');
const router = express.Router();
const {
  getDepartmentReport,
  exportDepartmentReportCSV,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
  '/department',
  protect,
  authorize('DepartmentHead', 'Admin'),
  getDepartmentReport
);

router.get(
  '/export/csv',
  protect,
  authorize('DepartmentHead', 'Admin'),
  exportDepartmentReportCSV
);

module.exports = router;
