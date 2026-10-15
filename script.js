const STORAGE_KEY = "campusVoiceAnnouncements";
const THEME_KEY = "campusVoiceTheme";

const defaultAnnouncements = [
  {
    id: "default-academic",
    category: "Academic",
    title: "Internal Assessment Schedule",
    description: "Internal assessments begin next Monday. Check your department timetable and prepare accordingly.",
    date: "2026-09-28",
    time: "10:30",
    views: 42
  },
  {
    id: "default-event",
    category: "Events",
    title: "Campus Fest",
    description: "Join us for exciting campus activities, live performances, games, and a day full of memories.",
    date: "2026-10-20",
    time: "11:00",
    views: 86
  },
  {
    id: "default-placement",
    category: "Placement",
    title: "Placement Drive Registration",
    description: "Registration is open for the upcoming placement drive. Update your resume and check the eligibility criteria.",
    date: "2026-10-22",
    time: "09:30",
    views: 64
  },
  {
    id: "default-library",
    category: "Academic",
    title: "Library Extended Hours",
    description: "The central library will remain open until 10 PM during the assessment preparation period.",
    date: "2026-10-05",
    time: "08:00",
    views: 31
  },
  {
    id: "default-scholarship",
    category: "Academic",
    title: "Scholarship Applications",
    description: "Submit your scholarship applications through the student portal before the deadline.",
    date: "2026-10-08",
    time: "16:00",
    views: 27
  },
  {
    id: "default-sports",
    category: "Events",
    title: "Inter-College Sports Meet",
    description: "Registrations are open for athletics, cricket, basketball, and indoor games.",
    date: "2026-10-12",
    time: "09:00",
    views: 53
  },
  {
    id: "default-workshop",
    category: "Events",
    title: "Design Thinking Workshop",
    description: "Learn practical problem-solving methods in this hands-on workshop led by industry mentors.",
    date: "2026-10-15",
    time: "14:00",
    views: 38
  },
  {
    id: "default-hackathon",
    category: "Events",
    title: "Annual Hackathon",
    description: "Form a team and build an innovative solution during the 24-hour campus hackathon.",
    date: "2026-10-18",
    time: "10:00",
    views: 71
  },
  {
    id: "default-internship",
    category: "Placement",
    title: "Internship Opportunities",
    description: "New software and data science internship opportunities are available on the placement portal.",
    date: "2026-10-25",
    time: "12:00",
    views: 47
  },
  {
    id: "default-alumni",
    category: "Placement",
    title: "Alumni Career Talk",
    description: "Meet successful alumni and ask questions about preparing for interviews and starting your career.",
    date: "2026-10-28",
    time: "15:30",
    views: 25
  }
];

document.title = "Campus Voice | One campus. One voice.";

const announcementList = document.querySelector("#announcementList");
const announcementCount = document.querySelector("#announcementCount");
const emptyState = document.querySelector("#emptyState");
const categoryTabs = document.querySelectorAll(".category-tab");
const dialog = document.querySelector("#announcementDialog");
const form = document.querySelector("#announcementForm");
const toast = document.querySelector("#toast");
const searchInput = document.querySelector("#announcementSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const sortSelect = document.querySelector("#announcementSort");
const themeToggle = document.querySelector("#themeToggle");

let activeCategory = "All";
let searchTerm = "";
let sortOrder = "views";
let toastTimeout;

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.querySelector(".theme-toggle-label").textContent = isDark ? "Light mode" : "Dark mode";
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return "dark";
}

applyTheme(loadTheme());

function loadAnnouncements() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const savedAnnouncements = parsed.map(item => ({
          ...item,
          views: Number.isFinite(item.views) ? item.views : 0
        }));
        const savedIds = new Set(savedAnnouncements.map(item => item.id));
        const missingDefaults = defaultAnnouncements.filter(item => !savedIds.has(item.id));
        if (missingDefaults.length > 0 && savedAnnouncements.length < defaultAnnouncements.length) {
          const migratedAnnouncements = [...savedAnnouncements, ...missingDefaults];
          saveAnnouncements(migratedAnnouncements);
          return migratedAnnouncements;
        }
        return savedAnnouncements;
      }
    }
  } catch (error) {
    console.warn("Could not read saved announcements:", error);
  }

  saveAnnouncements(defaultAnnouncements);
  return [...defaultAnnouncements];
}

let announcements = loadAnnouncements();

function saveAnnouncements(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Could not save announcements:", error);
    showToast("Could not save to this browser.");
  }
}

function formatDate(dateString) {
  if (!dateString) return "Date not set";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTime(timeString) {
  if (!timeString) return "Time not set";
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function categoryClass(category) {
  return {
    Academic: "badge-academic",
    Events: "badge-events",
    Placement: "badge-placement"
  }[category] || "badge-academic";
}

function icon(name, className = "") {
  const paths = {
    spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 5.5v16M8 7h8M8 11h7"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M7 2.5v4M17 2.5v4M3 9h18M7 13h.01M12 13h.01M17 13h.01M7 17h.01M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    eye: '<path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.2"/>',
    arrow: '<path d="M5 19 19 5M9 5h10v10"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>'
  };
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.spark}</svg>`;
}

function categoryIcon(category) {
  return category === "Academic" ? "book" : category === "Events" ? "spark" : "arrow";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function renderAnnouncements() {
  const filtered = (activeCategory === "All"
    ? announcements
    : announcements.filter(item => item.category === activeCategory))
    .filter(item => {
      const searchableText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return searchableText.includes(searchTerm);
    })
    .sort((first, second) => sortOrder === "views"
      ? second.views - first.views
      : `${second.date}T${second.time}`.localeCompare(`${first.date}T${first.time}`));

  announcementList.innerHTML = filtered.map(item => `
    <article class="announcement-card ${categoryClass(item.category)}" data-id="${escapeHTML(item.id)}" tabindex="0">
      <div class="card-top">
        <span class="category-badge ${categoryClass(item.category)}">${icon(categoryIcon(item.category))}${escapeHTML(item.category)}</span>
        <span class="card-icon">${icon("arrow")}</span>
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      <p class="card-description">${escapeHTML(item.description)}</p>
      <div class="card-meta">
        <span>${icon("calendar")} ${escapeHTML(formatDate(item.date))}</span>
        <span class="dot" aria-hidden="true">•</span>
        <span>${icon("clock")} ${escapeHTML(formatTime(item.time))}</span>
        <span class="view-count">${icon("eye")} ${item.views} view${item.views === 1 ? "" : "s"}</span>
      </div>
    </article>
  `).join("");

  announcementCount.textContent = `${filtered.length} announcement${filtered.length === 1 ? "" : "s"}`;
  emptyState.classList.toggle("hidden", filtered.length !== 0);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openDialog() {
  form.reset();
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  document.querySelector("#announcementDate").value = localToday;
  document.querySelector("#announcementTime").value = "10:00";
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    showToast("Your browser does not support the announcement form.");
  }
  document.querySelector("#announcementCategory").focus();
}

document.querySelector("#newAnnouncementBtn").addEventListener("click", openDialog);
document.querySelector("#closeDialogBtn").addEventListener("click", () => dialog.close());
document.querySelector("#cancelBtn").addEventListener("click", () => dialog.close());

categoryTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    categoryFilter.value = activeCategory;
    categoryTabs.forEach(button => {
      const isActive = button === tab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    renderAnnouncements();
  });
});

categoryFilter.addEventListener("change", event => {
  activeCategory = event.target.value;
  categoryTabs.forEach(tab => {
    const isActive = tab.dataset.category === activeCategory;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  renderAnnouncements();
});

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderAnnouncements();
});

sortSelect.addEventListener("change", event => {
  sortOrder = event.target.value;
  renderAnnouncements();
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
});

function recordView(card) {
  const announcement = announcements.find(item => item.id === card.dataset.id);
  if (!announcement) return;
  announcement.views = (Number.isFinite(announcement.views) ? announcement.views : 0) + 1;
  saveAnnouncements(announcements);
  renderAnnouncements();
}

announcementList.addEventListener("click", event => {
  const card = event.target.closest(".announcement-card");
  if (card) recordView(card);
});

announcementList.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".announcement-card");
  if (!card) return;
  event.preventDefault();
  recordView(card);
});

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const announcement = {
    id: `announcement-${Date.now()}`,
    category: formData.get("category"),
    title: formData.get("title").trim(),
    description: formData.get("description").trim(),
    date: formData.get("date"),
    time: formData.get("time"),
    views: 0
  };

  if (!announcement.title || !announcement.description) {
    showToast("Please complete all fields.");
    return;
  }

  announcements.unshift(announcement);
  saveAnnouncements(announcements);
  activeCategory = "All";
  categoryTabs.forEach(tab => {
    const isActive = tab.dataset.category === "All";
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  categoryFilter.value = "All";
  renderAnnouncements();
  dialog.close();
  showToast("Announcement published successfully.");
});

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

renderAnnouncements();
