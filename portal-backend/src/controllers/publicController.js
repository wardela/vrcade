const {
  insertContactSubmission,
} = require("../services/contactSubmissionService");

const normalizeText = (value) => {
  if (value == null) {
    return "";
  }

  return String(value).trim();
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

exports.submitContactForm = async (req, res) => {
  const fullName = normalizeText(req.body.full_name);
  const businessEmail = normalizeText(req.body.business_email).toLowerCase();
  const phoneNumber = normalizeText(req.body.phone_number);
  const message = normalizeText(req.body.message);
  const locale = normalizeText(req.body.locale) || null;

  if (!fullName || !businessEmail || !phoneNumber || !message) {
    return res.status(400).json({
      ok: false,
      message:
        "full_name, business_email, phone_number, and message are required",
    });
  }

  if (!isValidEmail(businessEmail)) {
    return res.status(400).json({
      ok: false,
      message: "business_email must be a valid email address",
    });
  }

  try {
    const submission = await insertContactSubmission({
      fullName,
      businessEmail,
      phoneNumber,
      message,
      locale,
      userAgent: normalizeText(req.get("user-agent")) || null,
      submittedFromIp: normalizeText(req.ip) || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Contact submission saved successfully",
      submission,
    });
  } catch (error) {
    console.error("Failed to save contact submission:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to save contact submission",
    });
  }
};
