async function clearThisWeek() {
  // ---- Google token (unchanged) ----
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

  // ---- Call Supabase clear function ----
  const calendarId = "bjones@usd260.com";

  const res = await fetch(
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase clear error: ${text}`);
  }

  console.log("🧹 Cleared this week's events");
}

clearThisWeek().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
