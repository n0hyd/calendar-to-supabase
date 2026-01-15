async function listCalendars() {
  // Get access token
  const tokenParams = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams,
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error("Failed to obtain access token");
  }

  // List all calendars
  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const calData = await calRes.json();

  if (!calData.items) {
    throw new Error("No calendars returned");
  }

  console.log("📅 Calendars visible to this account:");
  calData.items.forEach(cal => {
    console.log(`- ${cal.summary} (id: ${cal.id})`);
  });
}

listCalendars().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
