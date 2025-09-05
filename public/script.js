// DOM elements
const fallbackCover = "https://via.placeholder.com/300x400?text=No+Image";
let inCollectionView = false;

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

const pageTitle = document.getElementById("page-title");

const gallery2 = document.querySelector('.gallery');
const toggleBtn = document.getElementById('toggle-layout');

let sortMode = "alpha"; // default
const toggleSortBtn = document.getElementById("toggle-sort");

const collectionHeader = document.getElementById("collection-header");
collectionHeader.classList.add("hidden");

let deleteMode = false;
let galleryData = [];
let galleryCache = {
    favorites: null,
    collections: null,
    json1: null,
    json2: null
};
let currentIndex = 0;
let currentSet = 'favorites';

const API_ADD = "/api/addFavorite";
const API_GET = "/api/getFavorites";
const API_DELETE = "/api/deleteFavorites";

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


// Modify the JSON paths to use raw Gist URLs
async function fetchJsonData(url) {
    try {
        const res = await fetch(url);
        return await res.json(); // Parse JSON response
    } catch (err) {
        console.error("Error fetching JSON data:", err);
        return []; // Return empty array in case of error
    }
}

async function loadGallery() {
    console.log("✅ loadGallery called for", currentSet);
    gallery.innerHTML = "";

    let data = galleryCache[currentSet];
    if (!data) {
        try {
            if (currentSet === 'json1') {
                const res = await fetch('/api/fetchJson?set=json1');
                data = res.ok ? await res.json() : [];
            } else if (currentSet === 'json2') {
                const res = await fetch('/api/fetchJson?set=json2');
                data = res.ok ? await res.json() : [];
            } else if (currentSet === 'favorites') {
                const res = await fetch('/api/getFavorites');
                data = res.ok ? await res.json() : [];
            } else if (currentSet === 'collections') {
                const res = await fetch('/api/getCollections');
                data = res.ok ? await res.json() : [];
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            data = [];
        }

        galleryCache[currentSet] = data;
    }

    galleryData = data;

    // Apply sorting
    if (currentSet === "favorites" || currentSet === "collections") {
        if (sortMode === "alpha") {
            galleryData.sort((a, b) => (a.model || a.title || "").toLowerCase().localeCompare((b.model || b.title || "").toLowerCase()));
        } else {
            galleryData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }

    renderGallery(galleryData);
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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                cover,
                photoset
            })
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

    if (selected.length === 0) return alert("Select at least one item");

    if (!confirm(`Delete ${selected.length} item(s)?`)) return;

    try {
        if (currentSet === "favorites") {
            const res = await fetch(API_DELETE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    indexes: selected
                })
            });
            if (!res.ok) throw new Error("Failed to delete favorites");
        } else if (currentSet === "collections") {
            // Map indexes → gistIds
            const gistIds = selected.map(i => galleryData[i].gistId);

            const res = await fetch("/api/deleteGist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    gistIds
                })
            });
            if (!res.ok) throw new Error("Failed to delete collections");
        }

        loadGallery(); // reload
    } catch (err) {
        alert(err.message);
    }
});


// Slideshow open on click
gallery.addEventListener("click", async (e) => {
    if (e.target.tagName === "IMG" && !deleteMode) {
        const idx = Array.from(gallery.querySelectorAll(".card img")).indexOf(e.target);
        if (idx >= 0) openSlideshow(idx);
    }

    if (e.target.classList.contains("open-slideshow-btn")) {
        const gistUrl = e.target.getAttribute("data-gist-url");
        const res = await fetch(gistUrl);
        const data = await res.json();
        openSlideshow(data.content); // reuse your favourites slideshow function
    }

    // 📂 Render whole set (like favourites page render)
    if (e.target.classList.contains("view-set-btn")) {
        const {
            gistUrl,
            title,
            img,
            description,
            url
        } = e.target.dataset;
        console.log("Datasets:", e.target.dataset);

        await renderCollection(gistUrl, title, img, description, url);
    }
});

function openSlideshow(idx) {
    currentIndex = idx;
    updateSlide();
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
    if (
        e.target === slideshowImg ||
        e.target.closest("button") ||
        e.target.closest("a")
    ) {
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
let startX = 0,
    startY = 0;
let currentX = 0,
    currentY = 0;

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

    // Existing button hide logic for json1/json2 toggle
    document.getElementById("set-toggle-btn").addEventListener("click", (e) => {
        const targetSet = e.target.dataset.set;

        if (targetSet && targetSet !== currentSet) {
            currentSet = targetSet;
            loadGallery(); // Reload gallery based on the selected set
        }

        // Hide Add to Favorites and Delete Favorites when json1 or json2 is selected
        if (targetSet === "json1" || targetSet === "json2") {
            document.getElementById("addFavBtn").style.display = "none";
            document.getElementById("deleteModeBtn").style.display = "none";
        } else {
            document.getElementById("addFavBtn").style.display = "block";
            document.getElementById("deleteModeBtn").style.display = "block";
        }
    });

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
        const item = galleryData[currentIndex];

        let imgSrc = item.cover || item.title_img || "";
        let link = item.photoset || item.collection_url || "#";

        slideshowImg.src = imgSrc;
        document.getElementById("photoset-link").href = link;

        // fade back in when image is loaded
        slideshowImg.onload = () => {
            slideshowImg.classList.remove("fade-out");
        };
    }, 300); // half of the 0.6s transition
}

function updateTitle(set) {
    let newTitle = "💫⭐ My Favorites ⭐💫";
    if (set === "json1") newTitle = "🍑 Cute Butts 🍑";
    if (set === "json2") newTitle = "😻 Innie Pussies 😻";
    if (set === "collections") newTitle = "📚 Collections 📚";

    // Fade out → change → fade in
    pageTitle.classList.add("fade-out");
    setTimeout(() => {
        pageTitle.textContent = newTitle;
        pageTitle.classList.remove("fade-out");
    }, 400);
}

// --- Simple password gate ---
async function checkPassword() {
    const pw = document.getElementById("password-input").value;
    const res = await fetch("/api/checkPassword", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            password: pw
        })
    });
    const data = await res.json();

    if (data.success) {
        document.getElementById("lock-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
    } else {
        document.getElementById("error-msg").style.display = "block";
    }
}

document.getElementById("login-btn").addEventListener("click", checkPassword);

// --- Auto-login if already authenticated via cookie ---
async function autoLogin() {
    try {
        const res = await fetch("/api/validateSession");
        const data = await res.json();

        if (data.success) {
            document.getElementById("lock-screen").style.display = "none";
            document.getElementById("app").style.display = "block";
        } else {
document.getElementById("lock-screen").style.display = "flex";
document.getElementById("app").style.display = "none";
        }
    } catch (err) {
        console.error(err);
document.getElementById("lock-screen").style.display = "flex";
document.getElementById("app").style.display = "none";
    }
}

// Run autoLogin on page load
autoLogin();

// Toggle button event listener
const favControls = document.getElementById("fav-controls");

document.querySelectorAll(".set-toggle .btn").forEach(button => {
    button.addEventListener("click", (e) => {
 inCollectionView = false;
        const targetSet = e.target.dataset.set;
        if (targetSet && targetSet !== currentSet) {
            currentSet = targetSet;
            updateTitle(currentSet); // 🔥 animate title change
            // highlight active button
            document.querySelectorAll(".set-toggle .btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");

            // ✅ Animate controls
            if (targetSet === "favorites") {
                favControls.classList.remove("hidden");
                hideCollectionHeader();
            } else if (targetSet === "collections") {
                favControls.classList.remove("hidden");
                hideCollectionHeader();
            } else {
                favControls.classList.add("hidden");
                hideCollectionHeader();
            }

            // ✅ Animate gallery fade
            gallery.classList.add("fade-out");
            setTimeout(() => {
                loadGallery().then(() => {
                    gallery.classList.remove("fade-out");
                });
            }, 400);

        }
    });
});

// Attach click for "View Set" buttons
gallery.querySelectorAll(".view-set-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        e.stopPropagation(); // prevent triggering the card click
        const raw = btn.dataset.raw;
        const title = btn.dataset.title;
        const img = btn.dataset.img;
        renderCollection(raw, title, img);
    });
});


async function renderCollection(gistUrl, collectionTitle, collectionImg, collectionDescription, collectionUrl) {
    console.log("renderCollections called");
inCollectionView = true; 
    gallery.innerHTML = "";
    try {
        // Fetch gist JSON
        const res = await fetch(gistUrl);
        const data = await res.json();

        // Update header
        document.getElementById("collection-img").src = collectionImg || "";
        document.getElementById("collection-title").textContent = collectionTitle || "Collection";
        document.getElementById("collection-description").textContent = collectionDescription || "";
        document.getElementById("collection-link").href = collectionUrl || "https://google.com";
        favControls.classList.add("hidden");
        collectionHeader.classList.remove("hidden");

        // Save data globally for slideshow
        galleryData = data.content || [];

    if (sortMode === "alpha") {
      galleryData.sort((a, b) => (a.model || "").localeCompare(b.model || ""));
    } else if (sortMode === "random") {
      for (let i = galleryData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [galleryData[i], galleryData[j]] = [galleryData[j], galleryData[i]];
      }
    }

        gallery.innerHTML = "";
        data.content.forEach((item, idx) => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
        <img src="${item.cover}" alt="${item.model}">
        <div class="info">
          <div>${item.model}</div>
          ${item.photoset ? `<a href="${item.photoset}" target="_blank" class="view-set-btn">View Set</a>` : ""}
        </div>
      `;
            gallery.appendChild(card);
        });

    } catch (err) {
        console.error("Error rendering collection:", err);
    }
}

document.getElementById("reload-btn").addEventListener("click", () => {
    // Clear only the current set from cache
    galleryCache = {
        favorites: null,
        collections: null,
        json1: null,
        json2: null
    };
    console.log("♻️ Reloading", currentSet);
    loadGallery(); // refetch fresh data
});

function hideCollectionHeader() {
    if (collectionHeader) {
        collectionHeader.classList.add("hidden");
    }
}
toggleBtn.addEventListener('click', () => {
  if (gallery.classList.contains('grid')) {
    gallery.classList.remove('grid');
    gallery.classList.add('masonry');
    toggleBtn.textContent = "🗃";
  } else {
    gallery.classList.remove('masonry');
    gallery.classList.add('grid');
    toggleBtn.textContent = "🧱";
  }
});

// --- Toggle sort button ---
toggleSortBtn.addEventListener("click", () => {
  if (currentSet === "favorites" || currentSet === "collections") {
    sortMode = sortMode === "alpha" ? "date" : "alpha";
    toggleSortBtn.textContent = sortMode === "alpha" ? "🔠" : "📅";
  } else {
    sortMode = sortMode === "alpha" ? "random" : "alpha";
    toggleSortBtn.textContent = sortMode === "alpha" ? "🔠" : "🎲";
  }

  renderGallery(galleryData); // ✅ render with new sortMode
});


const randomSortBtn = document.getElementById("random-sort");

randomSortBtn.addEventListener("click", () => {
  if (!galleryData || galleryData.length === 0) return;

  // Use Fisher–Yates shuffle
  for (let i = galleryData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [galleryData[i], galleryData[j]] = [galleryData[j], galleryData[i]];
  }

  renderGallery(galleryData); // ✅ re-render shuffled items
});


function renderGallery(items) {
  gallery.innerHTML = "";

  // --- Sort items first ---
  let sortedItems = [...items]; // copy to avoid mutating original

  if (currentSet === "favorites" || currentSet === "collections") {
    if (sortMode === "alpha") {
      sortedItems.sort((a, b) => {
        const fieldA = (a.model || a.title || "").toLowerCase();
        const fieldB = (b.model || b.title || "").toLowerCase();
        return fieldA.localeCompare(fieldB);
      });
    } else if (sortMode === "date") {
      sortedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } else if (sortMode === "alpha") {
    sortedItems.sort((a, b) => (a.model || "").localeCompare(b.model || ""));
  } else if (sortMode === "random") {
    for (let i = sortedItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortedItems[i], sortedItems[j]] = [sortedItems[j], sortedItems[i]];
    }
  }

  // --- Render sorted items ---
  sortedItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";

    let img, name, link, extraButton;

    if (inCollectionView || currentSet === "favorites") {
      img = item.cover || fallbackCover;
      name = item.model || "Unknown";
      link = item.photoset ? `<a href="${item.photoset}" target="_blank" class="view-set-btn">View Set</a>` : "";
      extraButton = "";
    } else if (currentSet === "collections") {
      img = item.title_img || fallbackCover;
      name = item.title || "Untitled";
      link = item.collection_url ? `<a href="${item.collection_url}" target="_blank">Source</a>` : "";
      extraButton = item.rawUrl ? `
        <button 
          class="btn view-set-btn" 
          data-gist-url="${item.rawUrl}" 
          data-title="${item.title || ""}" 
          data-img="${item.title_img || ""}" 
          data-description="${item.description || ""}" 
          data-url="${item.collection_url || ""}">
          View Set
        </button>` : "";
    }

    const checkbox = (deleteMode && (currentSet === "favorites" || currentSet === "collections")) 
      ? `<input type="checkbox" class="delete-checkbox" data-index="${index}">` 
      : "";

    card.innerHTML = `
      ${checkbox}
      <img src="${img}" alt="${name}">
      <div class="info">
        <div>${name}</div>
        ${link}
        ${extraButton}
      </div>
    `;

    gallery.appendChild(card);
  });
}
