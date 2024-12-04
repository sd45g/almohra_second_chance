

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // يمكنك استخدام خدمات أخرى مثل Outlook
  auth: {
    user: process.env.EMAIL, // بريدك الإلكتروني
    pass: process.env.EMAIL_PASSWORD, // كلمة المرور (يفضل استخدام Password App إذا كنت تستخدم Gmail)
  },
});

exports.sendNotification = async (email, message) => {
  try {
    await transporter.sendMail({
      from: `"تذكير بالحجز" <${process.env.EMAIL}>`,
      to: email,
      subject: 'موعد مناسبتك قريب!',
      text: message,
    });
    console.log(`Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};


