async function syncWeeklyCalendar() {
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

  // ---- Calculate Sunday → Saturday ----
  const now = new Date();
  const day = now.getDay(); // Sunday = 0

  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  const calendarId = "bjones@usd260.com";

  // ---- Clear this week ----
  const clearRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/rpc/clear_calendar_events_for_week`,
    {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_calendar_id: calendarId,
        p_week_start: sunday.toISOString().slice(0, 10),
        p_week_end: saturday.toISOString().slice(0, 10),
      }),
    }
  );

  if (!clearRes.ok) {
    throw new Error("Failed to clear week");
  }

  // ---- Fetch events for this week ----
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${sunday.toISOString()}&timeMax=${saturday.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const eventsData = await eventsRes.json();
  if (!eventsData.items) throw new Error("No events returned");

  // ---- Insert events ----
  for (const event of eventsData.items) {
    const row = {
      title: event.summary || "No title",
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end?.dateTime || event.end?.date,
      all_day: !!event.start.date,
      calendar_name: calendarId,
      calendar_id: calendarId,
    };

    const insertRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/insert_calendar_event`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_title: row.title,
          p_start_time: row.start_time,
          p_end_time: row.end_time,
          p_all_day: row.all_day,
          p_calendar_name: row.calendar_name,
          p_calendar_id: row.calendar_id,
        }),
      }
    );

    if (!insertRes.ok) {
      const text = await insertRes.text();
      throw new Error(`Insert failed: ${text}`);
    }
  }

  console.log(`✅ Synced ${eventsData.items.length} events for this week`);
}

syncWeeklyCalendar().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
