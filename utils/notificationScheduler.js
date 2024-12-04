const cron = require("node-cron");
const { startOfDay, endOfDay, addDays } = require("date-fns");
const Reservation = require("../models/reservation");
const { sendNotification } = require("./notificationService");

const scheduleNotifications = () => {
  cron.schedule('53 18 * * *', async () => {
    console.log("Running notification job...");

    try {
      const today = startOfDay(new Date());
      const twoWeeksFromNow = endOfDay(addDays(today, 14));

      // البحث عن الحجوزات القريبة
      const reservations = await Reservation.find({
        bookingDate: { $gte: today, $lte: twoWeeksFromNow },
        notified: false,
      }).populate("user_id", "email user_name");

      if (reservations.length === 0) {
        console.log("No reservations to notify.");
        return;
      }

      for (const reservation of reservations) {
        const userEmail = reservation.user_id.email;

        if (!userEmail) {
          console.log(`No email found for reservation: ${reservation._id}`);
          continue;
        }

        const formattedDate = new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(reservation.bookingDate));

        const message = `مرحبًا ${reservation.customerName}، موعد مناسبتك (${reservation.classification}) قريب بعد أسبوعين بتاريخ ${formattedDate}.`;

        await sendNotification(userEmail, message);

        // تحديث حالة الإشعار
        reservation.notified = true;
        await reservation.save();

        console.log(`Notification sent to ${userEmail} for reservation: ${reservation._id}`);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  });
};

module.exports = scheduleNotifications;
