// controllers/advertisementController.js
const Advertisement = require("../models/advertisement");
//w

// Create a new advertisement
exports.createAdvertisement = async (req, res) => {
  try {
    // استخلاص admin_id من الـ JWT، وليس من body
    const admin_id = req.user.id; // ربط الإعلان بالمدير الذي قام بتسجيل الدخول

    // الحصول على مسار الصورة من Multer
    //const adImage = req.protocol + '://' + req.get('host') + '/uploads/advertisements/' + req.file.filename;
    const adImage = `${req.protocol}://${req.get(
      "host"
    )}/uploads/advertisements/${req.file.filename}`;

    // استخلاص الحقول من req.body
    const { description, expiryDate } = req.body;

    // إنشاء الإعلان الجديد
    const newAdvertisement = new Advertisement({
      adImage,
      description,
      expiryDate,
      admin_id,
    });

    // حفظ الإعلان في قاعدة البيانات
    await newAdvertisement.save();

    // إرجاع استجابة مع بيانات الإعلان الجديد
    res.status(201).json(newAdvertisement);
  } catch (error) {
    res.status(500).json({ message: "Failed to create advertisement", error });
  }
};

// Get all advertisements
exports.getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find().select(
      "adImage description expiryDate"
    );
    res.status(200).json(advertisements);
  } catch (error) {
    console.error("Failed to fetch advertisements:", error);
    res.status(500).json({ message: "Failed to fetch advertisements", error });
  }
};

exports.getPublicAdvertisements = async (req, res) => {
  try {
    const today = new Date();

    // جلب الإعلانات غير المنتهية فقط
    const advertisements = await Advertisement.find({
      $or: [
        { expiryDate: { $gte: today } }, // الإعلانات التي لم تنتهِ صلاحيتها
        { expiryDate: { $exists: false } }, // الإعلانات التي ليس لها تاريخ انتهاء
      ],
    }).select("adImage description expiryDate");

    res.status(200).json(advertisements);
  } catch (error) {
    console.error("Failed to fetch public advertisements:", error);
    res.status(500).json({ message: "Failed to fetch advertisements", error });
  }
};

// Get a specific advertisement by ID
exports.getAdvertisementById = async (req, res) => {
  try {
    // البحث عن الإعلان بواسطة `id`
    const advertisement = await Advertisement.findById(req.params.id).select(
      "adImage description expiryDate"
    );
    // const advertisement = await Advertisement.findById(req.params.id).populate(
    //   "admin_id",
    //   "name"
    // );
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    res.status(200).json(advertisement);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve advertisement", error });
  }
};

// Update an advertisement by ID

exports.updateAdvertisement = async (req, res) => {
  try {
    const admin_id = req.user.id;

    // جلب الإعلان الحالي من قاعدة البيانات باستخدام `id`
    const advertisement = await Advertisement.findById(req.params.id);

    // التحقق مما إذا كان الإعلان موجودًا
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    // استخراج الحقول من `req.body`
    const { description, expiryDate } = req.body;

    // التحقق مما إذا كانت هناك صورة جديدة مرفوعة
    if (req.file) {
      // حذف الصورة القديمة إذا كانت موجودة
      if (advertisement.adImage) {
        const oldImagePath = advertisement.adImage.replace(
          req.protocol + "://" + req.get("host"),
          "."
        );
        fs.unlink(oldImagePath, (err) => {
          if (err) console.log("Failed to delete old image:", err);
        });
      }

      // تحديث `adImage` بالصورة الجديدة
      advertisement.adImage =
        req.protocol +
        "://" +
        req.get("host") +
        "/uploads/advertisements/" +
        req.file.filename;
    }

    // تحديث الحقول الأساسية إذا كانت متوفرة
    if (description) advertisement.description = description;
    if (expiryDate) advertisement.expiryDate = expiryDate;

    // تحديث `admin_id` للإعلان
    advertisement.admin_id = admin_id;

    // حفظ التحديثات في قاعدة البيانات
    await advertisement.save();

    res.status(200).json(advertisement);
  } catch (error) {
    res.status(500).json({ message: "Failed to update advertisement", error });
  }
};

// exports.updateAdvertisement = async (req, res) => {
//   try {
//     const admin_id = req.user.id;

//     // الحصول على الإعلان الحالي من قاعدة البيانات
//     const advertisement = await Advertisement.findById(req.params.id);

//     if (!advertisement) {
//       return res.status(404).json({ message: "Advertisement not found" });
//     }

//     // استخراج الحقول من `req.body`
//     const { title, description, expiryDate } = req.body;
//     // التحقق مما إذا كانت صورة جديدة مرفوعة وتحديث `adImage` إذا كانت متوفرة
//     let adImage = advertisement.adImage;
//     if (req.file) {
//       adImage = req.protocol + '://' + req.get('host') + '/uploads/advertisements/' + req.file.filename;
//     }

//     // تحديث الإعلان
//     advertisement.adImage = adImage;
//     advertisement.admin_id = admin_id;

//     await advertisement.save();

//     res.status(200).json(advertisement);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to update advertisement", error });
//   }
// };

// exports.updateAdvertisement = async (req, res) => {
//   try {
//     const admin_id = req.user.id;

//     // التحقق من وجود الصورة
//     if (!req.file) {
//       return res.status(400).json({ message: 'No image file provided.' });
//     }

//     //const adImage = req.file.path;
//     const adImage = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename;
//     const advertisement = await Advertisement.findByIdAndUpdate(
//       req.params.id,
//       { adImage, admin_id },
//       { new: true }
//     );

//     if (!advertisement) {
//       return res.status(404).json({ message: "Advertisement not found" });
//     }

//     res.status(200).json(advertisement);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to update advertisement", error });
//   }
// };

// Delete an advertisement by ID
exports.deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    res.status(200).json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete advertisement", error });
  }
};
