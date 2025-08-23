// DOM elements
const gallery = document.getElementById("gallery");
const addFavBtn = document.getElementById("add-fav-btn");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close-btn");
const submitBtn = document.getElementById("submit-btn");
const modelInput = document.getElementById("model");
const coverInput = document.getElementById("cover");
const photosetInput = document.getElementById("photoset");

const deleteModeBtn = document.getElementById("delete-mode-btn");
const deleteSelectedBtn = document.getElementById("delete-selected-btn");

const slideshowOverlay = document.getElementById("slideshow-overlay");
const slideshowImg = document.getElementById("slideshow-img");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const closeSlideBtn = document.getElementById("close-slide-btn");

let deleteMode = false;
let galleryData = [];
let currentIndex = 0;

const API_ADD = "/api/addFavorite";
const API_GET = "/api/getFavorites";
const API_DELETE = "/api/deleteFavorites"; // ✅ new API for deletion

// Show the form
addFavBtn.addEventListener("click", () => {
  overlay.style.display = "flex";
});

// Close the form
closeBtn.addEventListener("click", () => {
  overlay.style.display = "none";
});

// Toggle delete mode
deleteModeBtn.addEventListener("click", () => {
  deleteMode = !deleteMode;
  gallery.classList.toggle("delete-mode", deleteMode);
  deleteSelectedBtn.style.display = deleteMode ? "inline-block" : "none";
  loadGallery();
});


// Load gallery from MongoDB
async function loadGallery() {
  gallery.innerHTML = "";
  try {
    const res = await fetch(API_GET);
    const data = await res.json();
    galleryData = data; // <-- IMPORTANT: store data for slideshow use

    data.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        ${deleteMode ? `<input type="checkbox" class="delete-checkbox" data-index="${index}">` : ""}
        <img src="${item.cover}" alt="${item.model}">
        <div class="info">
          <div>${item.model}</div>
          ${item.photoset ? `<a href="${item.photoset}" target="_blank" class="view-set-btn">View Set</a>` : ""}
        </div>
      `;

      gallery.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading gallery:", err);
  }
}

loadGallery();

// Submit new favorite
submitBtn.addEventListener("click", async () => {
  const model = modelInput.value.trim();
  const cover = coverInput.value.trim();
  const photoset = photosetInput.value.trim();

  if (!model || !cover || !photoset) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(API_ADD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, cover, photoset })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save favorite");

    overlay.style.display = "none";
    modelInput.value = coverInput.value = photosetInput.value = "";
    loadGallery();
  } catch (err) {
    alert("Failed to save favorite: " + err.message);
  }
});

// Delete selected
deleteSelectedBtn.addEventListener("click", async () => {
  const selected = Array.from(document.querySelectorAll(".delete-checkbox"))
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.dataset.index));

  if (selected.length === 0) return alert("Select at least one favorite");

  if (!confirm(`Delete ${selected.length} favorite(s)?`)) return;

  try {
    const res = await fetch(API_DELETE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexes: selected })
    });
    if (!res.ok) throw new Error("Failed to delete favorites");
    loadGallery();
  } catch (err) {
    alert(err.message);
  }
});

// Slideshow open on click
gallery.addEventListener("click", e => {
  if (e.target.tagName === "IMG" && !deleteMode) {
    const idx = Array.from(gallery.querySelectorAll(".card img")).indexOf(e.target);
    if (idx >= 0) openSlideshow(idx);
  }
});

function openSlideshow(idx) {
  currentIndex = idx;
  updateSlide();
  document.getElementById("photoset-link").href = galleryData[currentIndex].photoset || "#";
  slideshowOverlay.style.display = "flex";
}

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
  updateSlide();
});
nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % galleryData.length;
  updateSlide();
});
closeSlideBtn.addEventListener("click", () => {
  slideshowOverlay.style.display = "none";
});

// --- Tap-to-navigate slideshow ---
slideshowOverlay.addEventListener("click", (e) => {
  // ✅ Ignore taps on the image itself or control buttons
  if (e.target === slideshowImg || e.target.closest("button")) {
    return;
  }

  const rect = slideshowOverlay.getBoundingClientRect();
  const clickX = e.clientX - rect.left;

  if (clickX < rect.width / 2) {
    // Left half → Previous
    currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
  } else {
    // Right half → Next
    currentIndex = (currentIndex + 1) % galleryData.length;
  }
  updateSlide();
});


// --- Zoom feature for slideshow image ---
let isZoomed = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;

slideshowImg.style.transition = "transform 0.2s ease"; // smooth zoom

// Double tap / double click to zoom
slideshowImg.addEventListener("dblclick", () => {
  if (!isZoomed) {
    slideshowImg.style.transform = "scale(2)";
    isZoomed = true;
  } else {
    slideshowImg.style.transform = "scale(1) translate(0, 0)";
    isZoomed = false;
    currentX = currentY = 0;
  }
});

// Pan (drag) when zoomed in (mouse)
slideshowImg.addEventListener("mousedown", (e) => {
  if (!isZoomed) return;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;

  function onMouseMove(ev) {
    currentX = ev.clientX - startX;
    currentY = ev.clientY - startY;
    slideshowImg.style.transform = `scale(2) translate(${currentX / 2}px, ${currentY / 2}px)`;
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

// Pan (drag) when zoomed in (touch)
slideshowImg.addEventListener("touchstart", (e) => {
  if (!isZoomed) return;
  const touch = e.touches[0];
  startX = touch.clientX - currentX;
  startY = touch.clientY - currentY;

  function onTouchMove(ev) {
    const t = ev.touches[0];
    currentX = t.clientX - startX;
    currentY = t.clientY - startY;
    slideshowImg.style.transform = `scale(2) translate(${currentX / 2}px, ${currentY / 2}px)`;
  }

  function onTouchEnd() {
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
  }

  document.addEventListener("touchmove", onTouchMove);
  document.addEventListener("touchend", onTouchEnd);
});

function updateSlide() {
  slideshowImg.classList.add("fade-out");
  setTimeout(() => {
    slideshowImg.src = galleryData[currentIndex].cover;
    document.getElementById("photoset-link").href = galleryData[currentIndex].photoset || "#";

    // fade back in when image is loaded
    slideshowImg.onload = () => {
      slideshowImg.classList.remove("fade-out");
    };
  }, 300); // half of the 0.6s transition
}

// --- Simple password gate ---
async function checkPassword() {
  const pw = document.getElementById("password-input").value;
  const res = await fetch("/api/checkPassword", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pw })
  });
  const data = await res.json();

  if (data.success) {
    localStorage.setItem("auth", "true"); // remember login
    document.getElementById("lock-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
  } else {
    document.getElementById("error-msg").style.display = "block";
  }
}

document.getElementById("login-btn").addEventListener("click", checkPassword);

// Auto-login if already authenticated
if (localStorage.getItem("auth") === "true") {
  document.getElementById("lock-screen").style.display = "none";
  document.getElementById("app").style.display = "block";
}
