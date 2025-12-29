const express = require('express');
const router = express.Router();
const {
  adminLogin,
  adminLogout,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  checkAdminAuth,
} = require('../controllers/adminController');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const { validateAdminLogin } = require('../utils/validators');

router.post('/login', validateAdminLogin, adminLogin);
router.post('/logout', adminAuthMiddleware, adminLogout);
router.get('/dashboard-stats', adminAuthMiddleware, getDashboardStats);
router.get('/users', adminAuthMiddleware, getAllUsers);
router.patch('/users/:userId/toggle-status', adminAuthMiddleware, toggleUserStatus);
router.delete('/users/:userId', adminAuthMiddleware, deleteUser);
router.get('/check-auth', adminAuthMiddleware, checkAdminAuth);

module.exports = router;