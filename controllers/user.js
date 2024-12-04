const User = require("../models/user");
const jwtHelpers = require("../utils/jwtHelpers");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
//===================

exports.register = async (req, res) => {
  // التحقق من الأخطاء في التحقق من صحة البيانات
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // استخراج البيانات من الطلب
    const { user_name, email, password, phone_number, role} = req.body;
    // إنشاء مستخدم جديد
    const newUser = new User({
      user_name,
      email,
      phone_number,
      password,
      role,
    });
    // حفظ المستخدم في قاعدة البيانات
    await newUser.save();

    // إرجاع المستخدم بدون كلمة المرور
    res.status(201).json({
      message: "تمت إضافة الحساب بنجاح",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCustomerCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'customer' }); // عد المستخدمين بدور 'customer'
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer count', error: err.message });
  }
};


//=====================

//========================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // استخدام "identifier" للبريد أو رقم الهاتف

    // التحقق إذا كان الإدخال بريد إلكتروني أو رقم هاتف
    const query = identifier.includes('@')
      ? { email: identifier }
      : { phone_number: identifier };

    const user = await User.findOne(query);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // إنشاء رمز مميز (JWT)
    const token = jwtHelpers.sign({
      id: user._id,
      name: user.user_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // إرجاع التوكن هنا
    });
  } catch (err) {
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};





//===================================
// استرداد ملف المستخدم الشخصي
exports.profile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password"); // استبعاد كلمة المرور من النتائج

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        Phone_number: user.Phone_number,
        role: user.role,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server error. Could not retrieve profile information." });
  }
};

// تحديث معلومات المستخدم
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const { user_name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { user_name, email },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        user_name: updatedUser.user_name,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Server error. Could not update profile information." });
  }
};
