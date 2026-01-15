async function fetchWorkCalendarEvents() {
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

  // 2. Fetch events from the SCHOOL calendar only
  const calendarId = "bjones@usd260.com";

  const now = new Date().toISOString();
  const sevenDaysOut = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${now}&timeMax=${sevenDaysOut}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const eventsData = await eventsRes.json();

  if (!eventsData.items) {
    throw new Error("No events returned");
  }

  console.log(
    `📅 Found ${eventsData.items.length} events on ${calendarId}`
  );
}

fetchWorkCalendarEvents().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
