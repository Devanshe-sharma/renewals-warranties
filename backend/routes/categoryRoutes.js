const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const CategoryHistory = require('../models/CategoryHistory');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Log category change to history
const logCategoryChange = async (categoryId, userId, userName, action, changeType, oldValue, newValue, details) => {
  try {
    await CategoryHistory.create({
      categoryId,
      userId,
      userName,
      action,
      changeType,
      oldValue,
      newValue,
      details
    });
  } catch (err) {
    console.error('Error logging category change:', err);
  }
};

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const data = await Category.find().lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category history (requires auth)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await CategoryHistory.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history for specific category
router.get('/history/:categoryId', authMiddleware, async (req, res) => {
  try {
    const history = await CategoryHistory.find({ categoryId: req.params.categoryId })
      .sort({ timestamp: -1 })
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const category = new Category({ name, subcategories });
    const saved = await category.save();

    await logCategoryChange(
      saved._id.toString(),
      req.user.id,
      req.user.name,
      'create',
      'category',
      null,
      { name, subcategories },
      `Created category "${name}"`
    );

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category name (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const oldName = category.name;
    category.name = name;
    const updated = await category.save();

    await logCategoryChange(
      req.params.id,
      req.user.id,
      req.user.name,
      'update',
      'category',
      { name: oldName },
      { name },
      `Renamed category from "${oldName}" to "${name}"`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await logCategoryChange(
      req.params.id,
      req.user.id,
      req.user.name,
      'delete',
      'category',
      { name: category.name, subcategories: category.subcategories },
      null,
      `Deleted category "${category.name}"`
    );

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add subcategory (admin only)
router.post('/:id/subcategories', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subId = `sc-${Date.now()}`;
    category.subcategories.push({ id: subId, name });
    const updated = await category.save();

    await logCategoryChange(
      req.params.id,
      req.user.id,
      req.user.name,
      'create',
      'subcategory',
      null,
      { id: subId, name },
      `Added subcategory "${name}" to "${category.name}"`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update subcategory (admin only)
router.put('/:id/subcategories/:subId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const sub = category.subcategories.find(s => s.id === req.params.subId);
    if (!sub) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const oldName = sub.name;
    sub.name = name;
    const updated = await category.save();

    await logCategoryChange(
      req.params.id,
      req.user.id,
      req.user.name,
      'update',
      'subcategory',
      { id: req.params.subId, name: oldName },
      { id: req.params.subId, name },
      `Renamed subcategory from "${oldName}" to "${name}"`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete subcategory (admin only)
router.delete('/:id/subcategories/:subId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const sub = category.subcategories.find(s => s.id === req.params.subId);
    if (!sub) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const subName = sub.name;
    category.subcategories = category.subcategories.filter(s => s.id !== req.params.subId);
    const updated = await category.save();

    await logCategoryChange(
      req.params.id,
      req.user.id,
      req.user.name,
      'delete',
      'subcategory',
      { id: req.params.subId, name: subName },
      null,
      `Deleted subcategory "${subName}"`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;