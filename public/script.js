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
    galleryData = data; // save for slideshow
    data.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        ${deleteMode ? `<input type="checkbox" class="delete-checkbox" data-index="${index}">` : ""}
        <img src="${item.cover}" alt="${item.model}">
        <div class="info">
          <div>${item.model}</div>
          <a href="${item.photoset}" target="_blank">View Set</a>
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
  slideshowImg.src = galleryData[currentIndex].cover;
  slideshowOverlay.style.display = "flex";
}

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
  slideshowImg.src = galleryData[currentIndex].cover;
});
nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % galleryData.length;
  slideshowImg.src = galleryData[currentIndex].cover;
});
closeSlideBtn.addEventListener("click", () => {
  slideshowOverlay.style.display = "none";
});
