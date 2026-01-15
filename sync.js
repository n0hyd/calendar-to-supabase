async function fetchCalendarEvents() {
  // 1. Get access token
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

  // 2. Fetch upcoming events (next 7 days)
  const now = new Date().toISOString();
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now}&timeMax=${sevenDaysOut}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const eventsData = await eventsRes.json();

  if (!eventsData.items) {
    throw new Error("No events returned from Google Calendar");
  }

  console.log(`📅 Found ${eventsData.items.length} events in next 7 days`);
}

fetchCalendarEvents().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
