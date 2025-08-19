const API_ADD = "/api/addFavorite";
const API_GET = "/api/getFavorites";

// Load gallery from MongoDB
async function loadGallery() {
  gallery.innerHTML = "";
  try {
    const res = await fetch(API_GET);
    const data = await res.json();
    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
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
submitBtn.addEventListener('click', async () => {
  const model = modelInput.value.trim();
  const cover = coverInput.value.trim();
  const photoset = photosetInput.value.trim();

  if (!model || !cover || !photoset) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(API_ADD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, cover, photoset })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save favorite");

    overlay.style.display = 'none';
    modelInput.value = coverInput.value = photosetInput.value = "";
    loadGallery();
  } catch (err) {
    alert("Failed to save favorite: " + err.message);
  }
});
