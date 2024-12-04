const Decoration = require("../models/decoration");

// إنشاء ديكور جديد
exports.createDecoration = async (req, res) => {
  try {
    // التحقق من أن المستخدم هو admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can add decorations." });
    }

    const { dec_name, description } = req.body;

    // استخدم الـ admin_id من الـ JWT
    const admin_id = req.user.id;

    // جمع مسارات الصور من الطلب
    // const pictures = req.files.map(file => file.path);
    const pictures = req.files.map(
      (file) =>
        req.protocol +
        "://" +
        req.get("host") +
        "/uploads/decorations/" +
        file.filename
    );

    const newDecoration = new Decoration({
      dec_name,
      description,
      pictures,
      admin_id, // يتم ربط الـ admin_id بشكل تلقائي
    });

    await newDecoration.save();

    res.status(201).json(newDecoration);
  } catch (error) {
    res.status(500).json({ message: "Failed to create decoration", error });
  }
};

// جلب جميع الديكورات
// جلب الديكورات للزبائن

exports.getActiveDecorations = async (req, res) => {
  try {
    const decorations = await Decoration.find({ status: "مفعل" }).select(
      "dec_name description status pictures"
    ); // استرجاع الحقول المطلوبة فقط
    res.status(200).json(decorations);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve decorations", error });
  }
};


// جلب ديكور معين باستخدام ID
exports.getDecorationById = async (req, res) => {
  try {
    const decoration = await Decoration.findById(req.params.id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }
    res.status(200).json(decoration);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve decoration", error });
  }
};
//-----------------------------------------------
exports.getAllDecorations = async (req, res) => {
  try {
    const decorations = await Decoration.find().select(
      "dec_name description status pictures"
    ); // استرجاع الحقول المطلوبة فقط
    res.status(200).json(decorations);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve decorations", error });
  }
};

//==============================
// controllers/decorationController.js
exports.getDecorationsname= async (req, res) => {
  try {
    const decorations = await Decoration.find({}, 'dec_name _id'); // إرجاع اسم الديكور ومعرفه فقط
    res.status(200).json(decorations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch decorations', error });
  }
};


// تحديث ديكور باستخدام ID
// تحديث الحقول العامة بما في ذلك الصور
exports.updateDecoration = async (req, res) => {
  try {
    const { dec_name, description } = req.body;

    let pictures = req.body.pictures; // افتراضي: استخدام الصور القديمة
    if (req.files && req.files.length > 0) {
      pictures = req.files.map((file) => file.path); // تحديث الصور إذا تم رفع صور جديدة
    }

    const decoration = await Decoration.findByIdAndUpdate(
      req.params.id,
      { dec_name, description, pictures },
      { new: true }
    );

    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }

    res
      .status(200)
      .json({ message: "Decoration updated successfully", decoration });
  } catch (error) {
    res.status(500).json({ message: "Failed to update decoration", error });
  }
};

// حذف صورة معينة من الصور
exports.deleteDecorationImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagePath } = req.body;

    const decoration = await Decoration.findById(id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }

    decoration.pictures = decoration.pictures.filter(
      (img) => img !== imagePath
    );
    await decoration.save();

    res.status(200).json({ message: "Image removed successfully", decoration });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete image", error });
  }
};

// إضافة صور جديدة
exports.addDecorationImages = async (req, res) => {
  try {
    const { id } = req.params;

    const newImages = req.files.map(
      (file) =>
        req.protocol +
        "://" +
        req.get("host") +
        "/uploads/decorations/" +
        file.filename
    );

    const decoration = await Decoration.findById(id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }

    decoration.pictures.push(...newImages);
    await decoration.save();

    res.status(200).json({ message: "Images added successfully", decoration });
  } catch (error) {
    res.status(500).json({ message: "Failed to add images", error });
  }
};

// تحديث حالة التفعيل/التعطيل فقط باستخدام ID
exports.toggleDecorationStatus = async (req, res) => {
  try {
    const decoration = await Decoration.findById(req.params.id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }

    // عكس الحالة بين "مفعل" و "معطل"
    const newStatus = decoration.status === "مفعل" ? "معطل" : "مفعل";

    decoration.status = newStatus;
    await decoration.save();

    res.status(200).json({
      message: "Decoration status updated successfully",
      decoration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update decoration status", error });
  }
};

// حذف ديكور باستخدام ID
exports.deleteDecoration = async (req, res) => {
  try {
    const decoration = await Decoration.findByIdAndDelete(req.params.id);
    if (!decoration) {
      return res.status(404).json({ message: "Decoration not found" });
    }
    res.status(200).json({ message: "Decoration deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete decoration", error });
  }
};
