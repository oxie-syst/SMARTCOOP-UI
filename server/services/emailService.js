async function sendVerificationEmail(email, verificationUrl) {
  const {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY
  } = process.env;

  // Debug: Check EmailJS IDs
  console.log("Service ID:", JSON.stringify(EMAILJS_SERVICE_ID));
  console.log("Template ID:", JSON.stringify(EMAILJS_TEMPLATE_ID));

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_PRIVATE_KEY
  ) {
    throw new Error("Missing EmailJS configuration");
  }

  const response = await fetch(
    "https://api.emailjs.com/api/v1.0/email/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: email,
          verification_url: verificationUrl
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`EmailJS error ${response.status}: ${error}`);
  }

  console.log("SmartCoop verification email sent successfully");
}

module.exports = { sendVerificationEmail };