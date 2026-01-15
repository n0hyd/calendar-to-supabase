async function insertOneEvent() {
  // ---- Google token ----
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

  const { access_token } = await tokenRes.json();
  if (!access_token) throw new Error("No access token");

  // ---- Fetch one calendar's events ----
  const calendarId = "bjones@usd260.com";
  const now = new Date().toISOString();

  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${now}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const eventsData = await eventsRes.json();
  if (!eventsData.items || eventsData.items.length === 0) {
    throw new Error("No events found");
  }

  const event = eventsData.items[0];

  // ---- Prepare Supabase row ----
  const row = {
    title: event.summary || "No title",
    start_time: event.start.dateTime || event.start.date,
    end_time: event.end?.dateTime || event.end?.date,
    all_day: !!event.start.date,
    calendar_name: "bjones@usd260.com",
    calendar_id: calendarId,
  };

  // ---- Insert into Supabase ----
  const sbRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/calendar_events`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    }
  );

  if (!sbRes.ok) {
    const text = await sbRes.text();
    throw new Error(`Supabase error: ${text}`);
  }

  console.log("✅ Inserted 1 event into Supabase");
}

insertOneEvent().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
