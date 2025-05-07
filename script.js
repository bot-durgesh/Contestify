// Determine current page
const currentPage = window.location.pathname.split("/").pop() || "index.html";

// UI Elements (only query if relevant)
let btnAlarm, btnHome, btnSetting, btnLeaderboard, Alarm, Home, Setting, Leaderboard, calendertable, alarmtable, livecontestsbtn, todaybtn, upcomingbtn, fil;
if (["contest.html", "notify.html"].includes(currentPage)) {
  btnAlarm = document.querySelector("#btnAlarm");
  btnHome = document.querySelector("#btnHome");
  btnSetting = document.querySelector("#btnSetting");
  btnLeaderboard = document.querySelector("#btnLeaderboard");
  Alarm = document.querySelector("#Alarm");
  Home = document.querySelector("#Home");
  Setting = document.querySelector("#Setting");
  Leaderboard = document.querySelector("#Leaderboard");
  calendertable = document.querySelector(".contest_table");
  alarmtable = document.querySelector(".remIsSet");
  livecontestsbtn = document.querySelector("#liveContests");
  todaybtn = document.querySelector("#today");
  upcomingbtn = document.querySelector("#upcoming");
  fil = document.querySelector("#filter");
}

// Contest Data
const host_sites = [
  "codeforces.com",
  "codechef.com",
  "atcoder.jp",
  "leetcode.com",
  "codingninjas.com/codestudio",
  "hackerearth.com",
  "geeksforgeeks.org",
  "topcoder.com",
];
const hosts = host_sites.join("%2C");
let today = false;
let livecontests = false;
const iddata = new Map();
let apiData;
let dur = 24 * 60 * 60;

// Platform logos and names
const logo = new Map([
  ["atcoder.jp", "atcoder.png"],
  ["leetcode.com", "leetcode.png"],
  ["topcoder.com", "topcoder.png"],
  ["codechef.com", "codechef.png"],
  ["codeforces.com", "codeforces.png"],
  ["hackerearth.com", "HackerEarth.png"],
  ["geeksforgeeks.org", "GeeksforGeeks.png"],
  ["codingninjas.com/codestudio", "naukriCode360.png"],
]);

const platform = new Map([
  ["atcoder.jp", "AtCoder"],
  ["leetcode.com", "LeetCode"],
  ["topcoder.com", "TopCoder"],
  ["codechef.com", "CodeChef"],
  ["codeforces.com", "Codeforces"],
  ["hackerearth.com", "HackerEarth"],
  ["geeksforgeeks.org", "GeeksforGeeks"],
  ["codingninjas.com/codestudio", "CodeStudio"],
]);

// Initialize local storage
if (!localStorage.getItem("alarms")) {
  localStorage.setItem("alarms", JSON.stringify([]));
}
if (!localStorage.getItem("host-sites")) {
  localStorage.setItem("host-sites", JSON.stringify(host_sites));
}

// Time calculations
const curr_time = new Date();
const curr_time_api_temp = curr_time.toISOString().substring(0, 19);
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const day15back = new Date();
day15back.setDate(day15back.getDate() - 15);
day15back.setHours(0, 0, 0, 0);
const day15back_time_api_temp = day15back.toISOString().substring(0, 19);

// API endpoint
const apiUrl = "https://cp-calendar-server.vercel.app/upcomingContests/";

// Helper Functions
function formatDuration(duration) {
  const minutes = Math.floor((duration / 60) % 60);
  const hours = Math.floor((duration / 3600) % 24);
  const days = Math.floor(duration / (3600 * 24));
  let timeDuration = "";
  if (days > 0) timeDuration += `${days}d `;
  if (hours > 0) timeDuration += `${hours}h `;
  if (minutes > 0) timeDuration += `${minutes}m`;
  return timeDuration.trim() || "0m";
}

function formatDateTime(date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ensureHttps(url) {
  return url.startsWith("http") ? url : `https://${url}`;
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function normalizeDomain(domain) {
  return domain.replace("www.", "").trim().toLowerCase();
}

// Event Listeners
if (fil && currentPage === "contest.html") {
  fil.addEventListener("change", () => {
    switch (fil.value) {
      case "dur3":
        dur = 3 * 60 * 60;
        break;
      case "dur24":
        dur = 24 * 60 * 60;
        break;
      case "durg24":
        dur = 365 * 24 * 60 * 60;
        break;
    }
    render();
  });
}

function toggleView(view) {
  const views = {
    alarm: { element: Alarm, button: btnAlarm },
    home: { element: Home, button: btnHome },
    setting: { element: Setting, button: btnSetting },
  };

  Object.values(views).forEach((v) => {
    if (v.element) v.element.classList.add("hidden");
    if (v.button) v.button.classList.remove("okactive");
  });

  if (views[view].element) views[view].element.classList.remove("hidden");
  if (views[view].button) views[view].button.classList.add("okactive");
}

if (btnAlarm && currentPage === "contest.html") {
  btnAlarm.addEventListener("click", () => toggleView("alarm"));
}
if (btnHome && currentPage === "contest.html") {
  btnHome.addEventListener("click", () => toggleView("home"));
}
if (btnSetting && currentPage === "contest.html") {
  btnSetting.addEventListener("click", () => toggleView("setting"));
}

if (todaybtn && currentPage === "contest.html") {
  todaybtn.addEventListener("click", () => {
    today = true;
    livecontests = false;
    todaybtn.classList.add("okactive");
    if (upcomingbtn) upcomingbtn.classList.remove("okactive");
    if (livecontestsbtn) livecontestsbtn.classList.remove("okactive");
    render();
  });
}

if (livecontestsbtn && currentPage === "contest.html") {
  livecontestsbtn.addEventListener("click", () => {
    livecontests = true;
    today = true;
    livecontestsbtn.classList.add("okactive");
    if (todaybtn) todaybtn.classList.add("okactive");
    if (upcomingbtn) upcomingbtn.classList.remove("okactive");
    render();
  });
}

if (upcomingbtn && currentPage === "contest.html") {
  upcomingbtn.addEventListener("click", () => {
    today = false;
    livecontests = false;
    upcomingbtn.classList.add("okactive");
    if (todaybtn) todaybtn.classList.remove("okactive");
    if (livecontestsbtn) livecontestsbtn.classList.remove("okactive");
    render();
  });
}

// Contest Fetching
async function fetchAndStoreContests() {
  try {
    const url = `${apiUrl}?resource=${hosts}&end__gt=${curr_time_api_temp}&start__gt=${day15back_time_api_temp}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    localStorage.setItem("contests", JSON.stringify(data));
    localStorage.setItem("timeUpdate", new Date().toISOString());
    console.log("✅ Contests fetched and saved.");
    return data;
  } catch (err) {
    console.error("❌ Failed to fetch contests:", err);
    showEmptyState("Unable to fetch contests!<br>Please check your internet connection.");
    return null;
  }
}

function showEmptyState(message) {
  if (calendertable) {
    calendertable.innerHTML = `
      <div class="emptyAlarm min-h-[60vh] flex items-center justify-center">
        ${message}
      </div>
    `;
  }
  const loader = document.querySelector(".loader");
  if (loader) loader.style.display = "none";
  const mainDiv = document.querySelector(".mainDIV");
  if (mainDiv) mainDiv.classList.remove("hidden");
}

// Contest Rendering
function render() {
  if (currentPage !== "contest.html") return;
  if (!apiData?.objects) {
    fetchAndStoreContests().then((data) => {
      apiData = data;
      renderContests();
    });
    return;
  }
  renderContests();
}

function renderContests() {
  let tableItem = "";
  const alarm_id = [];
  const alreadySetAlarm = JSON.parse(localStorage.getItem("alarms") || "[]");
  const currentHosts = JSON.parse(localStorage.getItem("host-sites") || JSON.stringify(host_sites));

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  apiData.objects.forEach((contest) => {
    if (!currentHosts.includes(contest.resource)) return;

    const startTime = new Date(contest.start + ".000Z");
    const endTime = new Date(contest.end + ".000Z");
    let shouldDisplay = false;

    if (today) {
      shouldDisplay = startTime < tomorrow && endTime > now && contest.duration <= dur;
    } else if (livecontests) {
      shouldDisplay = startTime < tomorrow && endTime > now && contest.duration <= dur;
    } else {
      shouldDisplay = contest.duration <= dur;
    }

    if (shouldDisplay) {
      tableItem += createContestItem(contest, alreadySetAlarm.includes(contest.id));
      if (!alreadySetAlarm.includes(contest.id)) {
        alarm_id.push(contest.id);
      }
    }
  });

  if (calendertable) {
    calendertable.innerHTML = tableItem || `
      <div class="emptyAlarm min-h-[60vh] flex items-center justify-center">
        No contests found matching your criteria.
      </div>
    `;
  }

  setupAlarmHandlers(alarm_id);
  fetchAlarm();
  updateIdData();
}

function createContestItem(contest, isAlarmSet) {
  const startTime = new Date(contest.start + ".000Z");
  const timeDuration = formatDuration(contest.duration);
  const startFormatted = formatDateTime(startTime);
  const contestUrl = ensureHttps(contest.href);
  const conEvent = truncateText(contest.event, 42);

  return `
    <div class="tableitem" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; font-size: 0.75rem; border: 1px solid #464646; border-radius: 0.375rem; margin: 0.5rem 0;">
      <a href="${contestUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; width: 100%; gap: 0.5rem; color: white; text-decoration: none;">
        <img style="width: 32px; height: 32px;" src="images/platforms/${logo.get(contest.resource)}" alt="${contest.resource} logo">
        <div class="details" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%; font-weight: 300;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <span style="text-transform: uppercase; font-weight: 600; color: #0c9e41;">${platform.get(contest.resource)}</span>
            <span style="font-weight: 300;">${conEvent}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <p><strong>${startFormatted}</strong></p>
            <p><strong>${timeDuration}</strong></p>
          </div>
        </div>
      </a>
      <div class="alarm" style="display: flex; align-items: center; justify-content: flex-end; width: 2rem;">
        ${isAlarmSet ? alarmSetIcon() : alarmNotSetIcon(contest.id)}
      </div>
    </div>
  `;
}

function alarmSetIcon() {
  return `
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#75FB4C">
        <path d="m438-298 226-226-57-57-169 169-85-85-57 57 142 142Zm42 218q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z"/>
      </svg>
    </div>
  `;
}

function alarmNotSetIcon(id) {
  return `
    <div class="set-alarm" id="id${id}">
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M480-500Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Zm240-360v-120H600v-80h120v-120h80v120h120v80H800v120h-80ZM160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q14 4 27.5 8.5T593-772q-15 14-27 30.5T545-706q-15-7-31.5-10.5T480-720q-66 0-113 47t-47 113v280h320v-112q18 11 38 18t42 11v83h80v80H160Z"/>
      </svg>
    </div>
  `;
}

function setupAlarmHandlers(alarmIds) {
  alarmIds.forEach((id) => {
    const alarmElement = document.getElementById(`id${id}`);
    if (alarmElement) {
      alarmElement.addEventListener("click", () => {
        let alarmArray = JSON.parse(localStorage.getItem("alarms") || "[]");
        if (!alarmArray.includes(id)) {
          alarmArray.push(id);
          localStorage.setItem("alarms", JSON.stringify(alarmArray));
          fetchAlarm();
          render();
        }
      });
    }
  });
}

function updateIdData() {
  iddata.clear();
  if (apiData?.objects) {
    apiData.objects.forEach((contest) => {
      const startTime = new Date(contest.start + ".000Z");
      const formattedTime = formatDateTime(startTime);
      const timeDuration = formatDuration(contest.duration);
      const conEvent = truncateText(contest.event, 42);
      iddata.set(contest.id, [
        conEvent,
        ensureHttps(contest.href),
        formattedTime,
        timeDuration,
        contest.resource,
        startTime,
      ]);
    });
  }
  const alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
  const validAlarms = alarms.filter((id) => iddata.has(id));
  localStorage.setItem("alarms", JSON.stringify(validAlarms));
}

// Alarm Management
function fetchAlarm() {
  if (currentPage !== "contest.html") return;
  const alarmArray = JSON.parse(localStorage.getItem("alarms") || "[]");
  if (alarmArray.length === 0) {
    if (alarmtable) {
      alarmtable.innerHTML = `
        <div class="emptyAlarm min-h-[60vh] flex items-center justify-center">
          No alarms set.<br>
          Click the bell icon on contests to set alarms.
        </div>
      `;
    }
    return;
  }

  const now = Date.now();
  const sortedAlarms = alarmArray
    .map((id) => ({
      id,
      timeLeft: Date.parse(iddata.get(id)[5]) - now,
    }))
    .sort((a, b) => a.timeLeft - b.timeLeft)
    .map((item) => item.id);

  let alarmHTML = "";
  sortedAlarms.forEach((id) => {
    const [event, href, time, duration, resource] = iddata.get(id) || [];
    if (!event) return;
    alarmHTML += `
      <div class="tableitem" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; font-size: 12px; border: 1px solid #464646; border-radius: 6px; margin: 0.5rem 0;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; width: 100%; text-decoration: none; gap: 8px;">
          <img style="width: 32px; height: 32px;" src="images/platforms/${logo.get(resource)}" alt="${resource} logo">
          <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; width: 100%; font-size: 12px; font-weight: 300; color: white;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="text-transform: uppercase; font-weight: 600; color: green;">${platform.get(resource)}</span>
              <span style="font-weight: 300; color: white;">${event}</span>
              <p><span class="update" id="update${id}"></span></p>
            </div>
            <div style="display: flex; flex-direction: column; font-size: 10px; text-align: center; padding: 4px;">
              <p><strong>${time}</strong></p>
              <p><strong>${duration}</strong></p>
            </div>
          </div>
        </a>
        <div class="delete" style="display: flex; align-items: center; justify-content: center; width: 32px; cursor: pointer;">
          <div id="del${id}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323">
              <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  });

  if (alarmtable) alarmtable.innerHTML = alarmHTML;

  sortedAlarms.forEach((id) => {
    const delElement = document.querySelector(`#del${id}`);
    if (delElement) delElement.addEventListener("click", () => removeAlarm(id));
    setupCountdownTimer(id);
  });
}

function setupCountdownTimer(id) {
  const countDownDate = Date.parse(iddata.get(id)[5]);
  const timerElement = document.getElementById(`update${id}`);
  if (!timerElement) return;

  const timer = setInterval(() => {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    if (distance < 0) {
      clearInterval(timer);
      timerElement.innerHTML = "Started";
      removeAlarm(id);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}

function removeAlarm(id) {
  let alarmArray = JSON.parse(localStorage.getItem("alarms") || "[]");
  alarmArray = alarmArray.filter((alarmId) => alarmId !== id);
  localStorage.setItem("alarms", JSON.stringify(alarmArray));
  fetchAlarm();
}

// Platform Selection
function platformLocalStorage() {
  if (currentPage !== "contest.html") return;
  host_sites.forEach((host_site, i) => {
    const checkbox = document.querySelector(`#host${i + 1}`);
    if (checkbox) {
      checkbox.addEventListener("change", (btn) => {
        let host = JSON.parse(localStorage.getItem("host-sites") || JSON.stringify(host_sites));
        if (btn.target.checked) {
          if (!host.includes(host_site)) host.push(host_site);
        } else {
          const index = host.indexOf(host_site);
          if (index > -1) host.splice(index, 1);
        }
        localStorage.setItem("host-sites", JSON.stringify(host));
        render();
      });
    }
  });
}

// Email Notifications
function sendEmailNotifications() {
    if (!["contest.html", "notify.html"].includes(currentPage)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      console.log("📬 sendEmailNotifications() called");
  
      if (!firebase?.auth) {
        console.error("❌ Firebase not initialized.");
        return reject("Firebase not initialized");
      }
  
      firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
          console.log("❌ User not logged in.");
          return reject("User not logged in");
        }
  
        console.log("👤 Logged in as:", user.email);
  
        firebase
          .database()
          .ref("users/" + user.uid + "/preferences")
          .once("value")
          .then((snapshot) => {
            const prefs = snapshot.val();
            console.log("🔧 Preferences:", prefs);
  
            localStorage.setItem("userPreferences", JSON.stringify(prefs));
  
            if (!prefs || prefs.notificationsEnabled !== true) {
              console.log("⚠️ Notifications are turned off or preferences not found.");
              return resolve();
            }
  
            const preferredPlatforms = (prefs.platforms || []).map(normalizeDomain);
            const contestList = JSON.parse(localStorage.getItem("contests"))?.objects || [];
  
            const upcoming = contestList.filter((c) => {
              if (!c.start || !c.resource) return false;
              const startTime = new Date(c.start + ".000Z");
              const now = new Date();
              const msUntilStart = startTime - now;
              const startsSoon = msUntilStart >= -60 * 1000 && msUntilStart <= 24 * 60 * 60 * 1000;
              return preferredPlatforms.includes(normalizeDomain(c.resource)) && startsSoon;
            });
  
            if (upcoming.length === 0) {
              console.log("📭 No upcoming contests found for selected platforms.");
              return resolve();
            }
  
            const messageBody = upcoming
              .map((c) => {
                // Convert to IST
                const startTime = new Date(c.start + ".000Z");
                const options = {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                };
                const istTimeString = startTime.toLocaleString('en-IN', options);
                
                return `🏆 ${c.event}\n📌 Platform: ${platform.get(c.resource) || c.resource}\n⏰ Start: ${istTimeString} (IST)\n🔗 Link: ${ensureHttps(c.href)}`;
              })
              .join("\n\n------------------------------\n\n");
  
            if (typeof emailjs === "undefined") {
              console.error("❌ EmailJS is not loaded.");
              return reject("EmailJS not loaded");
            }
  
            emailjs
              .send("service_1lamezb", "template_bgl01k8", {
                to_email: user.email,
                to_name: user.displayName || "User",
                message: messageBody,
              })
              .then(() => {
                console.log("✅ Email successfully sent to", user.email);
                localStorage.setItem("lastNotificationSent", Date.now());
                resolve();
              })
              .catch((err) => {
                console.error("❌ Failed to send email:", err);
                reject(err);
              });
          })
          .catch((err) => {
            console.error("❌ Error reading preferences:", err);
            reject(err);
          });
      });
    });
  }

// Save Preferences
function savePreferences() {
  if (currentPage !== "notify.html") return;
  const saveBtn = document.getElementById("savePreferencesBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const email = document.getElementById("userEmail")?.value;
      const checkboxes = document.querySelectorAll('input[name="platform"]:checked');
      const platforms = Array.from(checkboxes).map((cb) => cb.value);

      const userId = firebase.auth().currentUser?.uid;
      const feedback = document.getElementById("saveFeedback");

      if (!userId || !email || platforms.length === 0) {
        if (feedback) feedback.innerText = "Please fill out all fields.";
        return;
      }

      const preferences = {
        email,
        platforms,
        notificationsEnabled: true,
      };
      console.log("Saving preferences for:", userId, preferences);

      firebase
        .database()
        .ref("users/" + userId + "/preferences")
        .set(preferences)
        .then(() => {
          if (feedback) feedback.innerText = "Preferences saved successfully!";
        })
        .catch((err) => {
          console.error("Failed to save preferences", err);
          if (feedback) feedback.innerText = "Error saving preferences.";
        });
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (["contest.html"].includes(currentPage)) {
    platformLocalStorage();

    const savedHosts = JSON.parse(localStorage.getItem("host-sites") || "[]");
    savedHosts.forEach((host_site) => {
      const checkbox = document.getElementsByName(host_site)[0];
      if (checkbox) checkbox.checked = true;
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const lastFetch = new Date(localStorage.getItem("timeUpdate") || 0);

    if (!localStorage.getItem("contests") || lastFetch < todayStart) {
      fetchAndStoreContests().then((data) => {
        apiData = data;
        render();
        sendEmailNotifications().then(() => {
          const loader = document.querySelector(".loader");
          if (loader) loader.style.display = "none";
          const mainDiv = document.querySelector(".mainDIV");
          if (mainDiv) mainDiv.classList.remove("hidden");
        });
      });
    } else {
      try {
        apiData = JSON.parse(localStorage.getItem("contests"));
        render();
        sendEmailNotifications().then(() => {
          const loader = document.querySelector(".loader");
          if (loader) loader.style.display = "none";
          const mainDiv = document.querySelector(".mainDIV");
          if (mainDiv) mainDiv.classList.remove("hidden");
        });
      } catch (e) {
        console.error("Error parsing saved contests:", e);
        fetchAndStoreContests().then((data) => {
          apiData = data;
          render();
        });
      }
    }
  }

  if (["notify.html"].includes(currentPage)) {
    savePreferences();
  }

  if (["contest.html", "notify.html"].includes(currentPage)) {
    const lastCheck = localStorage.getItem("lastNotificationSent");
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (!lastCheck || lastCheck < oneHourAgo) {
      sendEmailNotifications();
    }
  }
});

// Periodic Notification Check
if (["contest.html", "notify.html"].includes(currentPage)) {
  setInterval(() => {
    const lastCheck = localStorage.getItem("lastNotificationSent");
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (!lastCheck || lastCheck < oneHourAgo) {
      sendEmailNotifications();
    }
  }, 60 * 60 * 1000);
}