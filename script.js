const API_BASE_URLS = [
      "https://de1.api.radio-browser.info",
      "https://de2.api.radio-browser.info",
      "https://fr1.api.radio-browser.info",
      "https://nl1.api.radio-browser.info",
      "https://us1.api.radio-browser.info",
      "https://br1.api.radio-browser.info",
      "https://fi1.api.radio-browser.info",
      "https://pl1.api.radio-browser.info",
      "https://es1.api.radio-browser.info",
      "https://au1.api.radio-browser.info"
    ];

    // DOM Elements
    const countrySelect = document.getElementById("countrySelect");
    const stationSearch = document.getElementById("stationSearch");
    const stationsList = document.getElementById("stationsList");
    const audioPlayer = document.getElementById("audioPlayer");
    const audioElement = document.getElementById("audioElement");
    const nowPlayingTitle = document.getElementById("nowPlayingTitle");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const playIcon = document.getElementById("playIcon");
    const volumeSlider = document.getElementById("volumeSlider");

    // State
    let allStations = [];
    let currentStation = null;
    let isPlaying = false;

    // Fetch with fallback
    async function fetchWithFallback(endpoint) {
      for (const baseUrl of API_BASE_URLS) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`);
          if (response.ok) return await response.json();
        } catch (error) {
          console.warn(`Failed to fetch from ${baseUrl}`);
        }
      }
      throw new Error("All API servers failed");
    }

    // Load countries
    async function loadCountries() {
      showLoading("Loading countries...");
      try {
        const data = await fetchWithFallback("/json/countries");
        const uniqueCountries = Array.from(
          new Map(data.map(c => [c.name, c])).values()
        );
        const sorted = uniqueCountries.sort((a, b) => a.name.localeCompare(b.name));
        
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        sorted.forEach(country => {
          const option = document.createElement("option");
          option.value = country.name;
          option.textContent = country.name;
          countrySelect.appendChild(option);
        });
        
        showEmptyState("Explore Global Radio Stations", "Select a country to discover amazing radio stations");
      } catch (error) {
        showEmptyState("Error", "Failed to load countries. Please try again.");
        console.error(error);
      }
    }

    // Load stations
    async function loadStations(country) {
      showLoading(`Loading stations for ${country}...`);
      try {
        const data = await fetchWithFallback(
          `/json/stations/bycountry/${encodeURIComponent(country)}?hidebroken=true&order=clickcount&reverse=true`
        );
        allStations = data.filter(s => s.url_resolved);
        
        if (allStations.length > 0) {
          displayStations(allStations);
        } else {
          showEmptyState("No stations found", `No stations available for ${country}`);
        }
      } catch (error) {
        showEmptyState("Error", "Failed to load stations. Please try again.");
        console.error(error);
      }
    }

    // Display stations
    function displayStations(stations) {
      stationsList.innerHTML = "";
      
      stations.forEach(station => {
        const card = document.createElement("div");
        card.className = "station-card";
        card.innerHTML = `
          <div class="station-info">
            <div class="station-name">${escapeHtml(station.name || "Unknown Station")}</div>
            <div class="station-details">
              <span class="station-country">${escapeHtml(station.country || "Unknown")}</span>
              ${station.tags ? `<span>•</span><span>${escapeHtml(station.tags.split(',').slice(0, 2).join(', '))}</span>` : ''}
            </div>
          </div>
          <div class="play-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        `;
        
        card.addEventListener("click", () => playStation(station, card));
        stationsList.appendChild(card);
      });
    }

    // Play station
    function playStation(station, element) {
      // Remove active class from all cards
      document.querySelectorAll('.station-card').forEach(card => {
        card.classList.remove('active');
      });
      
      // Add active class to clicked card
      element.classList.add('active');
      
      currentStation = station;
      audioElement.src = station.url_resolved || station.url;
      
      audioElement.play()
        .then(() => {
          isPlaying = true;
          nowPlayingTitle.textContent = `${station.name || 'Unknown'} • ${station.country || 'Unknown'}`;
          audioPlayer.classList.add('visible');
          updatePlayButton();
        })
        .catch(error => {
          console.error("Playback failed:", error);
          nowPlayingTitle.textContent = "Error playing station";
        });
    }

    // Toggle play/pause
    function togglePlayPause() {
      if (!currentStation) return;
      
      if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
      } else {
        audioElement.play()
          .then(() => {
            isPlaying = true;
          })
          .catch(error => {
            console.error("Playback failed:", error);
          });
      }
      updatePlayButton();
    }

    // Update play button icon
    function updatePlayButton() {
      if (isPlaying) {
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      } else {
        playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      }
    }

    // Search stations
    function searchStations(term) {
      if (!term.trim()) {
        displayStations(allStations);
        return;
      }
      
      const filtered = allStations.filter(station => 
        (station.name && station.name.toLowerCase().includes(term.toLowerCase())) ||
        (station.tags && station.tags.toLowerCase().includes(term.toLowerCase())) ||
        (station.country && station.country.toLowerCase().includes(term.toLowerCase()))
      );
      
      if (filtered.length > 0) {
        displayStations(filtered);
      } else {
        showEmptyState("No results", `No stations found for "${escapeHtml(term)}"`);
      }
    }

    // Show loading state
    function showLoading(message) {
      stationsList.innerHTML = `
        <div class="loading-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <p>${message}</p>
        </div>
      `;
    }

    // Show empty state
    function showEmptyState(title, message) {
      stationsList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      `;
    }

    // Escape HTML
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Event Listeners
    countrySelect.addEventListener("change", (e) => {
      if (e.target.value) {
        loadStations(e.target.value);
      } else {
        allStations = [];
        showEmptyState("Explore Global Radio Stations", "Select a country to discover amazing radio stations");
      }
    });

    stationSearch.addEventListener("input", (e) => {
      searchStations(e.target.value);
    });

    playPauseBtn.addEventListener("click", togglePlayPause);

    volumeSlider.addEventListener("input", (e) => {
      audioElement.volume = e.target.value / 100;
    });

    // Audio event listeners for automatic state updates
    audioElement.addEventListener('play', () => {
      isPlaying = true;
      updatePlayButton();
    });

    audioElement.addEventListener('pause', () => {
      isPlaying = false;
      updatePlayButton();
    });

    // Set initial volume
    audioElement.volume = 0.7;

    // Initialize
    loadCountries();