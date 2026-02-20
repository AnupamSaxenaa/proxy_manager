const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { listUsers, getUserById, updateUser, deactivateUser, activateUser, getAllDepartments } = require('../controllers/usersController');

const router = express.Router();
router.get('/', authenticate, requireRole('admin'), listUsers);
router.get('/departments/all', getAllDepartments);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, requireRole('admin'), deactivateUser);
router.patch('/:id/activate', authenticate, requireRole('admin'), activateUser);

module.exports = router;
