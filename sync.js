async function testGoogleAuth() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Failed to get access token");
  }

  console.log("✅ Google access token retrieved");
}

testGoogleAuth().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
