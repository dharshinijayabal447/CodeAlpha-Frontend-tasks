
const audio = document.getElementById("audio");
const coverImage = document.getElementById("coverImage");
const songTitle = document.getElementById("songTitle");
const songArtist = document.getElementById("songArtist");
const progressBar = document.getElementById("progressBar");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");
const playButton = document.getElementById("playButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const volumeBar = document.getElementById("volumeBar");
const volumeValue = document.getElementById("volumeValue");
const playlistList = document.getElementById("playlistList");
const trackCount = document.getElementById("trackCount");
const searchInput = document.getElementById("searchInput");
const addSongButton = document.getElementById("addSongButton");
const songFiles = document.getElementById("songFiles");
const autoplayButton = document.getElementById("autoplayButton");
const shuffleButton = document.getElementById("shuffleButton");
const repeatButton = document.getElementById("repeatButton");
const favoriteButton = document.getElementById("favoriteButton");
const themeButton = document.getElementById("themeButton");
const toast = document.getElementById("toast");

const songs = [
  {
    title: "Midnight City",
    artist: "Demo Artist",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    favorite: false
  },
  {
    title: "Golden Hour",
    artist: "Demo Artist",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80",
    favorite: false
  },
  {
    title: "Ocean Waves",
    artist: "Demo Artist",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80",
    favorite: false
  },
  {
    title: "Sunset",
    artist: "Demo Artist",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    favorite: false
  },
  {
    title: "Peaceful Moments",
    artist: "Demo Artist",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    cover: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80",
    favorite: false
  }
];

let currentIndex = 0;
let autoplay = true;
let shuffle = false;
let repeat = false;
let toastTimer;

/* FORMAT SONG TIME */

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

/* SHOW MESSAGE */

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* LOAD SONG */

function loadSong(index, shouldPlay = false) {
  if (songs.length === 0) return;

  currentIndex = (index + songs.length) % songs.length;

  const song = songs[currentIndex];

  audio.src = song.src;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  coverImage.src = song.cover;
  coverImage.alt = `${song.title} album cover`;

  progressBar.value = 0;
  currentTime.textContent = "0:00";
  duration.textContent = "0:00";

  favoriteButton.textContent = song.favorite ? "♥" : "♡";
  favoriteButton.classList.toggle("active", song.favorite);

  renderPlaylist();

  if (shouldPlay) {
    playSong();
  } else {
    updatePlayButton();
  }
}

/* PLAY AND PAUSE */

async function playSong() {
  try {
    await audio.play();
  } catch {
    showToast("Unable to play audio. Check your internet or select a local song.");
  }
}

function updatePlayButton() {
  playButton.textContent = audio.paused ? "▶" : "Ⅱ";
  playButton.setAttribute(
    "aria-label",
    audio.paused ? "Play" : "Pause"
  );

  renderPlaylist();
}

playButton.addEventListener("click", () => {
  if (audio.paused) {
    playSong();
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

/* NEXT AND PREVIOUS */

function nextSong() {
  if (shuffle && songs.length > 1) {
    let randomIndex;

    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex);

    loadSong(randomIndex, true);
  } else {
    loadSong(currentIndex + 1, true);
  }
}

function previousSong() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadSong(currentIndex - 1, true);
  }
}

nextButton.addEventListener("click", nextSong);
previousButton.addEventListener("click", previousSong);

/* AUTOPLAY AND REPEAT */

audio.addEventListener("ended", () => {
  if (repeat) {
    audio.currentTime = 0;
    playSong();
  } else if (autoplay) {
    nextSong();
  } else {
    updatePlayButton();
  }
});

autoplayButton.addEventListener("click", () => {
  autoplay = !autoplay;
  autoplayButton.classList.toggle("active", autoplay);

  showToast(`Autoplay ${autoplay ? "enabled" : "disabled"}.`);
});

shuffleButton.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleButton.classList.toggle("active", shuffle);

  showToast(`Shuffle ${shuffle ? "enabled" : "disabled"}.`);
});

repeatButton.addEventListener("click", () => {
  repeat = !repeat;
  repeatButton.classList.toggle("active", repeat);

  showToast(`Repeat ${repeat ? "enabled" : "disabled"}.`);
});

/* SONG PROGRESS */

audio.addEventListener("loadedmetadata", () => {
  progressBar.max = audio.duration || 100;
  duration.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration)) return;

  progressBar.max = audio.duration;
  progressBar.value = audio.currentTime;

  currentTime.textContent = formatTime(audio.currentTime);
  duration.textContent = formatTime(audio.duration);
});

progressBar.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = Number(progressBar.value);
  }
});

/* VOLUME CONTROL */

audio.volume = Number(volumeBar.value);

volumeBar.addEventListener("input", () => {
  audio.volume = Number(volumeBar.value);

  volumeValue.textContent =
    `${Math.round(audio.volume * 100)}%`;
});

/* RENDER PLAYLIST */

function renderPlaylist() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredSongs = songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) => {
      return `${song.title} ${song.artist}`
        .toLowerCase()
        .includes(query);
    });

  trackCount.textContent = songs.length;
  playlistList.innerHTML = "";

  if (filteredSongs.length === 0) {
    playlistList.innerHTML = `
      <div class="empty-playlist">
        <p>No songs found.</p>
        <small>Try another search or add a song.</small>
      </div>
    `;
    return;
  }

  filteredSongs.forEach(({ song, index }) => {
    const track = document.createElement("button");

    track.type = "button";
    track.className =
      `track ${index === currentIndex ? "active" : ""}`;

    track.innerHTML = `
      <img class="track-art" src="${song.cover}" alt="">
      <div class="track-info">
        <p class="track-title"></p>
        <p class="track-artist"></p>
      </div>
      <span class="track-duration">
        ${index === currentIndex && Number.isFinite(audio.duration)
          ? formatTime(audio.duration)
          : "—"}
      </span>
      <span class="track-play">
        ${index === currentIndex && !audio.paused ? "Ⅱ" : "▶"}
      </span>
    `;

    track.querySelector(".track-title").textContent = song.title;
    track.querySelector(".track-artist").textContent = song.artist;

    track.addEventListener("click", () => {
      loadSong(index, true);
    });

    playlistList.appendChild(track);
  });
}

searchInput.addEventListener("input", renderPlaylist);

/* ADD YOUR OWN MUSIC FILES */

addSongButton.addEventListener("click", () => {
  songFiles.click();
});

songFiles.addEventListener("change", event => {
  const files = Array.from(event.target.files || [])
    .filter(file => file.type.startsWith("audio/"));

  if (files.length === 0) {
    showToast("Please select audio files.");
    return;
  }

  files.forEach(file => {
    songs.push({
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Your device",
      src: URL.createObjectURL(file),
      cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80",
      favorite: false,
      local: true
    });
  });

  renderPlaylist();

  showToast(
    `${files.length} song${files.length === 1 ? "" : "s"} added.`
  );

  if (songs.length === files.length) {
    loadSong(0, false);
  }

  songFiles.value = "";
});

/* FAVORITES */

favoriteButton.addEventListener("click", () => {
  const song = songs[currentIndex];

  song.favorite = !song.favorite;

  favoriteButton.textContent = song.favorite ? "♥" : "♡";
  favoriteButton.classList.toggle("active", song.favorite);

  renderPlaylist();

  showToast(
    song.favorite
      ? "Added to favorites."
      : "Removed from favorites."
  );
});

/* DARK MODE */

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");

  themeButton.textContent = dark ? "☼" : "☾";

  try {
    localStorage.setItem(
      "melodyTheme",
      dark ? "dark" : "light"
    );
  } catch {
    // Theme remains active for this session.
  }
});

try {
  if (localStorage.getItem("melodyTheme") === "dark") {
    document.body.classList.add("dark");
    themeButton.textContent = "☼";
  }
} catch {
  // Continue if browser storage is unavailable.
}

/* INITIALIZE PLAYER */

audio.volume = Number(volumeBar.value);
volumeValue.textContent =
  `${Math.round(audio.volume * 100)}%`;

renderPlaylist();
loadSong(0, false);
