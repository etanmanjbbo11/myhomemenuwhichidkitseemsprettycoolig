// Supabase Project Credentials
const SUPABASE_URL = 'https://wmfjqnzxnyperjetckuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmpxbnp4bnlwZXJqZXRja3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjE3NDQsImV4cCI6MjEwNDMzNzc0NH0.k-r5SOY_2GpHL5kS3-9lathbGYMUzecy-X8INLAk_Tw'; // Replace with your key from Settings > API

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Live Clock Tracker
function updateClock() {
  const now = new Date();
  let hrs = String(now.getHours()).padStart(2, '0');
  let mins = String(now.getMinutes()).padStart(2, '0');
  let secs = String(now.getSeconds()).padStart(2, '0');

  const clockMain = document.getElementById("clockMain");
  const dateLine = document.getElementById("dateLine");

  if (clockMain) {
    clockMain.innerHTML = `${hrs}:${mins}<span class="sec">:${secs}</span>`;
  }
  
  if (dateLine) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateLine.textContent = now.toLocaleDateString('en-US', options);
  }
}
setInterval(updateClock, 1000);
updateClock();

// Fetch assignments from Supabase
async function fetchAssignments() {
  const syncStatus = document.getElementById("syncStatus");
  
  try {
    const { data, error } = await supabaseClient
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderFeed(data);
    if (syncStatus) syncStatus.textContent = "Live Feed";
  } catch (err) {
    console.error("Fetch error:", err);
    if (syncStatus) syncStatus.textContent = "Sync Error";
    
    const feedContainer = document.getElementById("feed");
    if (feedContainer) {
      feedContainer.innerHTML = `
        <div class="app-card" style="justify-content: center; color: #ef4444; text-align: center;">
          Failed to load feed. Check browser console for details.
        </div>`;
    }
  }
}

// Render feed into DOM
function renderFeed(items) {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  if (!items || items.length === 0) {
    feedContainer.innerHTML = `<div class="app-card" style="justify-content: center; color: var(--text-muted);">No active broadcast assignments.</div>`;
    return;
  }

  feedContainer.innerHTML = items.map(item => `
    <article class="app-card">
      <small>${item.timestamp}</small>
      <h3>${item.title}</h3>
      <p>${item.content}</p>
    </article>
  `).join("");
}

// Subscribe to Realtime DB updates
function subscribeToBroadcasts() {
  supabaseClient
    .channel('public:assignments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'assignments' },
      () => {
        fetchAssignments();
      }
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });
}

// Boot setup once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  fetchAssignments();
  subscribeToBroadcasts();

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", fetchAssignments);
  }
});