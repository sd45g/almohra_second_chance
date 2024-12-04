const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const plutu_api_key = process.env.PLUTU_API_KEY;
const plutu_secret_key = process.env.PLUTU_SECRET_KEY;
const plutu_access_token = process.env.PLUTU_ACCESS_TOKEN;

if (!plutu_api_key || !plutu_secret_key || !plutu_access_token) {
  throw new Error("Please provide all required environment variables");
}

function verifyPlutuCallbackHash(parameters, secretKey, isWebhook = false) {
  let callbackParameters = isWebhook
    ? [
        "gateway",
        "approved",
        "amount",
        "invoice_no",
        "canceled",
        "payment_method",
        "transaction_id",
      ]
    : [
        "gateway",
        "approved",
        "canceled",
        "invoice_no",
        "amount",
        "transaction_id",
      ];

  const data = callbackParameters
    .filter((key) => parameters.hasOwnProperty(key))
    .map((key) => `${key}=${parameters[key]}`)
    .join("&");

  const hashFromCallback = parameters.hashed || "";
  const generatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex")
    .toUpperCase();

  return generatedHash === hashFromCallback;
}

exports.createPayment = async (paymentData) => {
  const { payment_method, amount, invoice_no } = paymentData;

  // التحقق من القيم المطلوبة
  if (!payment_method || !amount || !invoice_no) {
    throw new Error("Payment method, amount, and invoice_no are required");
  }

  // التحقق من صحة المبلغ
  const formattedAmount = parseFloat(amount).toFixed(2);
  if (isNaN(formattedAmount) || formattedAmount <= 0) {
    throw new Error("Invalid amount value");
  }

  const MAX_AMOUNT = 2000; // الحد الأقصى للمبلغ
  if (parseFloat(formattedAmount) > MAX_AMOUNT) {
    throw new Error(
      `Amount exceeds the maximum allowed limit of ${MAX_AMOUNT}`
    );
  }

  console.log("Sending payment request to Plutu API:", {
    payment_method,
    amount: formattedAmount,
    invoice_no,
  });

  // إعداد البيانات لإرسالها إلى Plutu API
  const formData = new URLSearchParams();
  formData.append("amount", formattedAmount);
  formData.append("invoice_no", invoice_no);

  formData.append(
    "return_url",
    `${process.env.APP_URL}/api/reservations/return`
  ); // return URL
  formData.append("lang", "ar");

  try {
    // إرسال الطلب إلى Plutu API
    const response = await axios.post(
      `https://api.plutus.ly/api/v1/transaction/${payment_method}/confirm`,
      formData,
      {
        headers: {
          "x-api-key": plutu_api_key,
          lang: "ar",
          Authorization: `Bearer ${plutu_access_token}`,
        },
      }
    );
    console.log("Plutu API response:", response.data);

    if (response.data.result && response.data.result.redirect_url) {
      return response.data.result.redirect_url;
    } else {
      console.error("Plutu API response error:", response.data);
      throw new Error(
        "Failed to initiate payment, invalid response from Plutu"
      );
    }
  } catch (error) {
    console.error(
      "Payment initiation failed:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Payment initiation failed");
  }
};

exports.handleReturn = (req, res) => {
  console.log("Callback parameters received:", req.query);
  // const isVerified = verifyPlutuCallbackHash(req.query, plutu_secret_key);

  // if (!isVerified) {
  //   console.log("Redirect: Invalid hash");
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "Invalid callback hash" });
  // }

  const { approved, canceled } = req.query;

  if (approved === "1") {
   // console.log("Redirect: Payment successful");
    return res
      .status(200)
      .json({ success: true, message: "Payment successful" });
  }

  if (canceled === "1") {
    console.log("Redirect: Payment canceled");
    return res
      .status(400)
      .json({ success: false, message: "Payment canceled by the user" });
  }

  // حالة أخرى غير متوقعة
  console.log("Redirect: Unknown payment status");
  return res
    .status(400)
    .json({ success: false, message: "Unknown payment status" });
};
