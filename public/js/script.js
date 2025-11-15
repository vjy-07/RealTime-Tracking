const socket = io();

// prompt for username (keeps asking until non-empty)
let username = "";
function askName() {
  username = prompt("Enter your name:");
  if (!username || username.trim() === "") {
    return askName();
  }
  username = username.trim();
  socket.emit("set-username", username);
}
askName();

// toast helper
function showToast(text) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  root.appendChild(t);
  setTimeout(() => {
    if (t && t.parentNode) t.parentNode.removeChild(t);
  }, 3000);
}

// create map
const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: true,
  touchZoom: true,
  doubleClickZoom: true,
}).setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© Vijay",
}).addTo(map);

map.touchZoom.enable();
map.doubleClickZoom.enable();

const markers = {};

// helper to create a divIcon with the name label
function createUserIcon(name) {
  return L.divIcon({
    html: `
      <div class="user-marker">
        <div class="marker-pin"></div>
        <div class="marker-stem"></div>
        <div class="marker-label">${name}</div>
      </div>
    `,
    className: "",
    iconSize: [40, 60],
    iconAnchor: [20, 60],
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// start sending user's location
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      socket.emit("send-location", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (err) => {
      console.warn("Geolocation error:", err);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
} else {
  alert("Geolocation not supported.");
}

// When user connects
socket.on("user-connected", (data) => {
  showToast(`${data.name} connected`);
});

// When user sends location
socket.on("receive-location", (data) => {
  const { id, username: name, latitude, longitude } = data;

  if (!markers[id]) {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindTooltip(name || "Unknown", {
        permanent: true,
        direction: "bottom",
        offset: [0, 5],
        className: "name-label",
      })
      .openTooltip();
  } else {
    markers[id].setLatLng([latitude, longitude]);
  }

  if (id === socket.id) {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 14));
  }
});

// When user disconnects
socket.on("user-disconnected", (data) => {
  if (!data) return;

  if (markers[data.id]) {
    markers[data.id].remove();
    delete markers[data.id];
  }

  showToast(`${data.name || "Unknown"} disconnected`);
});

socket.on("user-list", (users) => {
  const ul = document.getElementById("user-list");
  ul.innerHTML = ""; // clear previous list

  Object.values(users).forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    ul.appendChild(li);
  });
});
