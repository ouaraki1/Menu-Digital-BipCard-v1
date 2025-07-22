const express = require('express');
const router = express.Router();
const { addRoom, deleteRoom, getAllRooms,getRoomIdByNum ,authenticateRoom } = require('../controllers/roomController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/', protect, authorizeRoles('admin'), addRoom); //valider
router.post('/auth-room', authenticateRoom);    //valider
router.get('/',authorizeRoles('admin'), getAllRooms);   //valider
router.get('/num/:num', getRoomIdByNum);  //valider
router.delete('/:id', protect, authorizeRoles('admin'), deleteRoom); //valider

module.exports = router;