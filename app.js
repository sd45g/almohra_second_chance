var express = require("express");
const { dbConnection } = require("./database/dbConnection");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const cors = require("cors"); // استدعاء مكتبة cors
const path = require("path");
var logger = require("morgan");
const userRouter = require("./routes/user");
const advertisementRouter = require("./routes/advertisement");
const reservationRouter = require("./routes/Reservation");
const decorationRoutes = require("./routes/decoration");
const receiptRoutes = require("./routes/receipt");

const scheduleNotifications = require("./utils/notificationScheduler");

var app = express();
const PORT = process.env.PORT || 3000;
// Middleware لإعداد الـ CORS
// app.use(cors({
//   origin: 'http://localhost:5000', // رابط الواجهة الأمامية
//   credentials: true // السماح بإرسال الكوكيز مع الطلبات
// }));

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // للسماح بإرسال ملفات تعريف الارتباط (Cookies) أو Headers أخرى
  })
);

//middleware
app.use(logger("dev"));
//تحول البيانات الى object
app.use(express.json()); //لتحليل جسم الطلبات (request body) بتنسيق JSON.
// extended: false: لمعالجة البيانات البسيطة (نصوص وأرقام).
// extended: true: لمعالجة البيانات المعقدة (كائنات متداخلة أو مصفوفات).
app.use(express.urlencoded({ extended: true })); //لتحليل الطلبات التي تحتوي على بيانات مُرسلة بتنسيق URL-encoded.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/users", userRouter);
app.use("/api/advertisements", advertisementRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/decorations", decorationRoutes);
app.use("/api/receipts", receiptRoutes);

dbConnection()
  .then(() => {
    // تشغيل وظيفة الجدولة بعد الاتصال بقاعدة البيانات
    scheduleNotifications();

    app.listen(PORT, () => {
      console.log(`Server listening at port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start the server:", err);
  });

//mongoose.connect(process.env.DB_URL)

module.exports = app;
