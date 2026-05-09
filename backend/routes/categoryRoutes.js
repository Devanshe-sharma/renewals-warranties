const express = require("express");
const router = express.Router();

const Category = require("../models/CategoryModel");

//
// GET ALL
//
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// CREATE CATEGORY
//
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    const exists = await Category.findOne({
      name: name.trim(),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      subcategories: [],
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// RENAME CATEGORY
//
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
      },
      {
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// DELETE CATEGORY
//
router.delete("/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// ADD SUBCATEGORY
//
router.post(
  "/:id/subcategories",
  async (req, res) => {
    try {
      const category =
        await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      category.subcategories.push({
        name: req.body.name.trim(),
      });

      await category.save();

      res.json({
        success: true,
        data: category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

//
// RENAME SUBCATEGORY
//
router.put(
  "/:categoryId/subcategories/:subcategoryId",
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.categoryId
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const sub =
        category.subcategories.id(
          req.params.subcategoryId
        );

      if (!sub) {
        return res.status(404).json({
          success: false,
          message: "Subcategory not found",
        });
      }

      sub.name = req.body.name.trim();

      await category.save();

      res.json({
        success: true,
        data: category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

//
// DELETE SUBCATEGORY
//
router.delete(
  "/:categoryId/subcategories/:subcategoryId",
  async (req, res) => {
    try {
      const category =
        await Category.findById(
          req.params.categoryId
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      category.subcategories.pull({
        _id: req.params.subcategoryId,
      });

      await category.save();

      res.json({
        success: true,
        data: category,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

module.exports = router;