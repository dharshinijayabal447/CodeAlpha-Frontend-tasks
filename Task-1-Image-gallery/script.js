
const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const emptyUploadButton = document.getElementById("emptyUploadButton");
const dropZone = document.getElementById("dropZone");
const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const totalCount = document.getElementById("totalCount");
const allFilterCount = document.getElementById("allFilterCount");
const favoriteCount = document.getElementById("favoriteCount");
const categoryFilters = document.getElementById("categoryFilters");

const addCategoryButton = document.getElementById("addCategoryButton");
const categoryModal = document.getElementById("categoryModal");
const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryNameInput");
const categoryModalClose = document.getElementById("categoryModalClose");
const categoryModalCancel = document.getElementById("categoryModalCancel");

const themeToggle = document.getElementById("themeToggle");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxCategory = document.getElementById("lightboxCategory");
const lightboxCounter = document.getElementById("lightboxCounter");
const lightboxFavorite = document.getElementById("lightboxFavorite");
const lightboxDownload = document.getElementById("lightboxDownload");
const toast = document.getElementById("toast");

const defaultCategories = ["Nature", "People", "Places", "Details"];

let categories = loadCategories();
let photos = loadPhotos();
let activeCategory = "All";
let activePhotoId = null;
let toastTimeout;

/* CATEGORY STORAGE */

function loadCategories() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("stillroomCategories") || "[]"
    );

    const custom = Array.isArray(saved)
      ? saved.filter(item => typeof item === "string")
      : [];

    return [
      ...defaultCategories,
      ...custom.filter(
        item => !defaultCategories.includes(item)
      )
    ];
  } catch {
    return [...defaultCategories];
  }
}

function saveCategories() {
  try {
    const customCategories = categories.filter(
      item => !defaultCategories.includes(item)
    );

    localStorage.setItem(
      "stillroomCategories",
      JSON.stringify(customCategories)
    );

    return true;
  } catch {
    showToast("Could not save categories in this browser.");
    return false;
  }
}

/* DISPLAY CATEGORY FILTERS */

function renderCategoryFilters() {
  const favoriteButton = categoryFilters.querySelector(
    '[data-category="Favorites"]'
  );

  categoryFilters
    .querySelectorAll(
      '[data-category]:not([data-category="All"]):not([data-category="Favorites"])'
    )
    .forEach(button => button.remove());

  categories.forEach(category => {
    const button = document.createElement("button");

    button.className = "filter-button";
    button.type = "button";
    button.dataset.category = category;
    button.textContent = category;

    categoryFilters.insertBefore(button, favoriteButton);
  });

  categoryFilters.querySelectorAll(".filter-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === activeCategory
    );
  });
}

/* ADD CATEGORY MODAL */

function openCategoryModal() {
  categoryNameInput.value = "";
  categoryModal.classList.add("open");
  categoryModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(() => categoryNameInput.focus(), 50);
}

function closeCategoryModal() {
  categoryModal.classList.remove("open");
  categoryModal.setAttribute("aria-hidden", "true");

  if (!lightbox.classList.contains("open")) {
    document.body.style.overflow = "";
  }
}

addCategoryButton.addEventListener("click", openCategoryModal);
categoryModalClose.addEventListener("click", closeCategoryModal);
categoryModalCancel.addEventListener("click", closeCategoryModal);

categoryModal.addEventListener("click", event => {
  if (event.target === categoryModal) {
    closeCategoryModal();
  }
});

categoryForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = categoryNameInput.value.trim().replace(/\s+/g, " ");

  if (!name) {
    showToast("Enter a category name.");
    categoryNameInput.focus();
    return;
  }

  const alreadyExists = categories.some(
    category => category.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    showToast("That category already exists.");
    categoryNameInput.focus();
    return;
  }

  categories.push(name);
  saveCategories();

  activeCategory = name;

  closeCategoryModal();
  renderCategoryFilters();
  renderGallery();

  showToast(`Category "${name}" added successfully.`);
});

/* PHOTO STORAGE */

function loadPhotos() {
  try {
    const saved = localStorage.getItem("stillroomPhotos");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function savePhotos() {
  try {
    localStorage.setItem("stillroomPhotos", JSON.stringify(photos));
    return true;
  } catch {
    showToast(
      "Browser storage is full. Download your images and remove a few large files."
    );
    return false;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* NOTIFICATION */

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* SECURITY: ESCAPE TEXT BEFORE INSERTING INTO HTML */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

/* IMAGE UPLOAD */

function openFilePicker() {
  fileInput.click();
}

uploadButton.addEventListener("click", openFilePicker);
emptyUploadButton.addEventListener("click", openFilePicker);

fileInput.addEventListener("change", async event => {
  await addFiles(event.target.files);
  fileInput.value = "";
});

async function addFiles(fileList) {
  const files = Array.from(fileList || []).filter(file =>
    file.type.startsWith("image/")
  );

  if (!files.length) {
    showToast("Choose one or more image files to upload.");
    return;
  }

  let added = 0;

  for (const file of files) {
    try {
      const dataUrl = await readFile(file);

      photos.unshift({
        id: makeId(),
        name: file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        category: categories.includes(activeCategory)
          ? activeCategory
          : categories[0],
        dataUrl,
        favorite: false,
        addedAt: Date.now() + added,
        type: file.type || "image/jpeg"
      });

      added++;
    } catch {
      showToast(`Could not read ${file.name}.`);
    }
  }

  if (added) {
    const saved = savePhotos();

    renderGallery();

    showToast(
      saved
        ? `${added} image${added === 1 ? "" : "s"} added to your collection.`
        : `${added} image${added === 1 ? "" : "s"} added for this session.`
    );
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* DRAG AND DROP */

dropZone.addEventListener("dragover", event => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", event => {
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove("dragging");
  }
});

dropZone.addEventListener("drop", async event => {
  event.preventDefault();
  dropZone.classList.remove("dragging");

  await addFiles(event.dataTransfer.files);
});

/* CATEGORY FILTER CLICK */

categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  activeCategory = button.dataset.category;

  categoryFilters.querySelectorAll(".filter-button").forEach(item => {
    item.classList.toggle("active", item === button);
  });

  renderGallery();
});

/* SEARCH AND SORT */

searchInput.addEventListener("input", renderGallery);
sortSelect.addEventListener("change", renderGallery);

function getVisiblePhotos() {
  const query = searchInput.value.trim().toLowerCase();

  let visible = photos.filter(photo => {
    const matchesCategory =
      activeCategory === "All" ||
      (
        activeCategory === "Favorites"
          ? photo.favorite
          : photo.category === activeCategory
      );

    const matchesSearch =
      `${photo.name} ${photo.fileName} ${photo.category}`
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesSearch;
  });

  if (sortSelect.value === "oldest") {
    visible.sort((a, b) => a.addedAt - b.addedAt);
  }

  if (sortSelect.value === "newest") {
    visible.sort((a, b) => b.addedAt - a.addedAt);
  }

  if (sortSelect.value === "name") {
    visible.sort((a, b) => a.name.localeCompare(b.name));
  }

  return visible;
}

/* RENDER GALLERY */

function renderGallery() {
  const visible = getVisiblePhotos();

  totalCount.textContent = photos.length;
  allFilterCount.textContent = photos.length;

  favoriteCount.textContent = photos.filter(
    photo => photo.favorite
  ).length;

  galleryGrid.innerHTML = "";

  visible.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    card.innerHTML = `
      <div class="photo-image-wrap"
           role="button"
           tabindex="0"
           aria-label="Open ${escapeHTML(photo.name)}">

        <img src="${photo.dataUrl}"
             alt="${escapeHTML(photo.name)}"
             loading="lazy">

        <div class="photo-overlay">
          <button class="icon-button ${photo.favorite ? "favorited" : ""}"
                  data-action="favorite"
                  type="button"
                  aria-label="${photo.favorite ? "Remove from favorites" : "Add to favorites"}">
            ${photo.favorite ? "♥" : "♡"}
          </button>

          <button class="download-button"
                  data-action="download"
                  type="button">
            Download ↓
          </button>
        </div>
      </div>

      <div class="photo-info">
        <div>
          <h3 class="photo-title">${escapeHTML(photo.name)}</h3>

          <p class="photo-meta">${formatDate(photo.addedAt)}</p>

          <select class="category-select"
                  aria-label="Change category for ${escapeHTML(photo.name)}"
                  data-photo-id="${photo.id}">
            ${categories.map(category => `
              <option value="${escapeHTML(category)}"
                ${photo.category === category ? "selected" : ""}>
                ${escapeHTML(category)}
              </option>
            `).join("")}
          </select>
        </div>

        <span class="photo-number">
          ${String(index + 1).padStart(2, "0")}
        </span>
      </div>
    `;

    const imageWrap = card.querySelector(".photo-image-wrap");

    imageWrap.addEventListener("click", () => {
      openLightbox(photo.id);
    });

    imageWrap.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(photo.id);
      }
    });

    card.querySelector('[data-action="favorite"]').addEventListener(
      "click",
      event => {
        event.stopPropagation();
        toggleFavorite(photo.id);
      }
    );

    card.querySelector('[data-action="download"]').addEventListener(
      "click",
      event => {
        event.stopPropagation();
        downloadPhoto(photo);
      }
    );

    const categorySelect = card.querySelector(".category-select");

    categorySelect.addEventListener("click", event => {
      event.stopPropagation();
    });

    categorySelect.addEventListener("change", event => {
      photo.category = event.target.value;
      savePhotos();
      renderGallery();
      showToast("Category updated.");
    });

    galleryGrid.appendChild(card);
  });

  const noResults = visible.length === 0;

  emptyState.style.display = noResults ? "block" : "none";
  galleryGrid.style.display = noResults ? "none" : "grid";

  if (photos.length === 0) {
    document.getElementById("emptyEyebrow").textContent = "A BLANK CANVAS";
    document.getElementById("emptyTitle").textContent =
      "Your collection starts here.";
    document.getElementById("emptyMessage").textContent =
      "Upload a few photographs and make this space your own.";
    emptyUploadButton.style.display = "inline-block";
    emptyUploadButton.textContent = "Upload images ↗";
  } else {
    document.getElementById("emptyEyebrow").textContent = "NOTHING TO SHOW";

    document.getElementById("emptyTitle").textContent =
      activeCategory === "Favorites"
        ? "No favorites just yet."
        : "No images found.";

    document.getElementById("emptyMessage").textContent =
      searchInput.value.trim()
        ? "Try another search term or choose a different category."
        : "Try another category or add more images to your collection.";

    emptyUploadButton.style.display = "inline-block";
    emptyUploadButton.textContent = "Add more images ↗";
  }
}

/* DATE AND PHOTO HELPERS */

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(timestamp));
}

function findPhoto(id) {
  return photos.find(photo => photo.id === id);
}

/* FAVORITES */

function toggleFavorite(id) {
  const photo = findPhoto(id);

  if (!photo) return;

  photo.favorite = !photo.favorite;

  savePhotos();
  renderGallery();

  if (activePhotoId === id && lightbox.classList.contains("open")) {
    updateLightbox();
  }

  showToast(
    photo.favorite
      ? "Added to favorites."
      : "Removed from favorites."
  );
}

/* DOWNLOAD IMAGE */

function downloadPhoto(photo) {
  const link = document.createElement("a");

  link.href = photo.dataUrl;
  link.download = photo.fileName || `${photo.name || "image"}.jpg`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast("Your download has started.");
}

/* IMAGE LIGHTBOX */

function openLightbox(id) {
  activePhotoId = id;

  updateLightbox();

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
  activePhotoId = null;
}

function updateLightbox() {
  const photo = findPhoto(activePhotoId);

  if (!photo) return;

  lightboxImage.src = photo.dataUrl;
  lightboxImage.alt = photo.name;
  lightboxTitle.textContent = photo.name;

  lightboxCategory.textContent =
    `${photo.category} · ${formatDate(photo.addedAt)}`;

  lightboxFavorite.textContent = photo.favorite ? "♥" : "♡";

  lightboxFavorite.classList.toggle(
    "favorited",
    photo.favorite
  );

  const visible = getVisiblePhotos();
  const position = visible.findIndex(item => item.id === photo.id);

  lightboxCounter.textContent =
    `${Math.max(position + 1, 1)} / ${Math.max(visible.length, 1)}`;
}

function moveLightbox(direction) {
  const visible = getVisiblePhotos();

  if (!visible.length) return;

  let index = visible.findIndex(
    photo => photo.id === activePhotoId
  );

  if (index < 0) index = 0;

  index = (index + direction + visible.length) % visible.length;

  activePhotoId = visible[index].id;

  updateLightbox();
}

document.getElementById("lightboxClose").addEventListener(
  "click",
  closeLightbox
);

document.getElementById("previousImage").addEventListener(
  "click",
  () => moveLightbox(-1)
);

document.getElementById("nextImage").addEventListener(
  "click",
  () => moveLightbox(1)
);

lightboxFavorite.addEventListener("click", () => {
  if (activePhotoId) toggleFavorite(activePhotoId);
});

lightboxDownload.addEventListener("click", () => {
  const photo = findPhoto(activePhotoId);

  if (photo) downloadPhoto(photo);
});

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});

/* KEYBOARD CONTROLS */

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    categoryModal.classList.contains("open")
  ) {
    closeCategoryModal();
    return;
  }

  if (
    event.key === "Escape" &&
    lightbox.classList.contains("open")
  ) {
    closeLightbox();
  }

  if (
    lightbox.classList.contains("open") &&
    event.key === "ArrowLeft"
  ) {
    moveLightbox(-1);
  }

  if (
    lightbox.classList.contains("open") &&
    event.key === "ArrowRight"
  ) {
    moveLightbox(1);
  }

  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(
      document.activeElement.tagName
    ) &&
    !lightbox.classList.contains("open") &&
    !categoryModal.classList.contains("open")
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

/* DARK MODE */

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");

  localStorage.setItem(
    "stillroomTheme",
    dark ? "dark" : "light"
  );

  themeToggle.textContent = dark ? "☼" : "◐";
});

if (localStorage.getItem("stillroomTheme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☼";
}

/* INITIALIZE GALLERY */

renderCategoryFilters();
renderGallery();
