const GIST_JSON_URL = "/api/getFavorites";  // API for getting favorites (Backend)
const API_URL = "/api/updateGist";          // API for adding new favorite

// DOM Elements
const addFavBtn = document.getElementById('add-fav-btn');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('close-btn');
const submitBtn = document.getElementById('submit-btn');
const modelInput = document.getElementById('model');
const coverInput = document.getElementById('cover');
const photosetInput = document.getElementById('photoset');
const gallery = document.getElementById('gallery');

// Show the form
addFavBtn.addEventListener('click', () => {
  overlay.style.display = 'flex';
});

// Close the form
closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});

// Load the gallery
async function loadGallery() {
  try {
    const res = await fetch(GIST_JSON_URL);
    const data = await res.json();
    gallery.innerHTML = ''; // Clear existing gallery
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

// Add a new favorite
async function addNewFavorite(model, cover, photoset) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, cover, photoset })
    });

    const data = await response.json();
    if (response.ok) {
      alert('New favorite added!');
      loadGallery(); // Reload gallery with new favorite
    } else {
      alert(data.message || 'Error adding favorite');
    }
  } catch (err) {
    console.error('Error adding favorite:', err);
    alert('An error occurred while adding the favorite \n'+ err);
  }
}

// Submit the new favorite
submitBtn.addEventListener('click', () => {
  const model = modelInput.value.trim();
  const cover = coverInput.value.trim();
  const photoset = photosetInput.value.trim();

  if (model && cover && photoset) {
    addNewFavorite(model, cover, photoset);
    overlay.style.display = 'none';  // Close the form
  } else {
    alert('Please fill all fields');
  }
});
