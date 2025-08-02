const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');

// @route    GET /api/menu
// @desc     Get all menu items (with optional query params)
// @access   Public
router.get('/', menuController.getMenuItems);



// @route    POST /api/menu
// @desc     Create new menu item
// @access   Private/Admin
router.post(
  '/',
  authMiddleware.protect,
  adminMiddleware,
  menuController.createMenuItem
);

// @route    PUT /api/menu/:id
// @desc     Update menu item
// @access   Private/Admin
router.put(
  '/:id',
  authMiddleware.protect,
  adminMiddleware,
  menuController.updateMenuItem
);

// @route    DELETE /api/menu/:id
// @desc     Delete menu item
// @access   Private/Admin
router.delete(
  '/:id',
  authMiddleware.protect,
  adminMiddleware,
  menuController.deleteMenuItem
);

module.exports = router;