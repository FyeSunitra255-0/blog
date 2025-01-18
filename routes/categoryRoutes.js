const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
// ดึงข้อมูลหมวดหมู่
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();  // ดึงหมวดหมู่จากฐานข้อมูล
    res.status(200).json(categories);  // ส่งข้อมูลเป็น JSON
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
});

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (requires authentication)
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.toLowerCase() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Create new category
    const newCategory = await Category.create({ name: name.toLowerCase() });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error });
  }
});


// ใน route สำหรับการดึงบล็อก
router.get("/category/:categoryName", async (req, res) => {
  const categoryName = req.params.categoryName;

  try {
      // ค้นหาบล็อกที่ตรงกับหมวดหมู่ที่เลือกและเรียงลำดับตามจำนวนคอมเม้นต์
      const blogs = await Blog.find({ categories: categoryName })
          .populate('comments') // assuming comments are populated in the Blog model
          .sort({ 'comments.length': -1 }); // เรียงลำดับจากจำนวนคอมเม้นต์มากที่สุด

      res.render("category", { blogs, categoryName }); // ส่งข้อมูลบล็อกและหมวดหมู่ไปยังหน้า category.ejs
  } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching blogs.");
  }
});


module.exports = router;
