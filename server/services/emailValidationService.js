
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function validateEmailAddress(email) {
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;

  if (!apiKey) {
    throw new Error("Abstract API key is missing.");
  }

  const url = new URL(
    "https://emailreputation.abstractapi.com/v1/"
  );

  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("email", email);

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    if (response.status !== 429) {
      break;
    }

    if (attempt < 3) {
      const delay = attempt * 3000;

      console.log(
        `Abstract API rate limited. Retrying in ${delay / 1000}s...`
      );

      await sleep(delay);
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Abstract API status:", response.status);
    console.error("Abstract API response:", errorBody.slice(0, 500));

    throw new Error(
      `Email validation failed: ${response.status}`
    );
  }

  const result = await response.json();

  const deliverability = result.email_deliverability || {};

  const status = String(
    deliverability.status || "unknown"
  ).toLowerCase();

  if (
    deliverability.is_format_valid === false ||
    deliverability.is_mx_valid === false ||
    status === "undeliverable"
  ) {
    return {
      valid: false,
      message: "This email address is invalid or undeliverable."
    };
  }

  return {
    valid: true,
    message: "Email can proceed to verification."
  };
}

module.exports = { validateEmailAddress };
