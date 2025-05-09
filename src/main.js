// Updated JS: Characters shown in alphabetical order by default, searchable by name

let debounceTimeout;
let currentPage = 1;
const itemsPerPage = 20;
let searchQuery = "";
let allCharacters = [];
let filteredCharacters = [];

const searchInput = document.getElementById("search-input");
const results = document.getElementById("results");
const paginationControls = document.getElementById("pagination-controls");

const customDescriptions = {
  "Yoda": "A wise Jedi Master, over 900 years old, who played a key role in the Clone Wars.",
  "Padmé Amidala": "A courageous queen turned senator, dedicated to peace in the Galactic Republic.",
  "Leia Organa": "A fearless leader of the Rebel Alliance, known for her diplomacy and combat skills.",
  "Han Solo": "A legendary smuggler turned hero, captain of the Millennium Falcon.",
  "Luke Skywalker": "A Jedi Knight who restored hope to the galaxy, trained by Yoda and Obi-Wan Kenobi.",
  "Darth Vader": "A Sith Lord formerly known as Anakin Skywalker, wielding a red lightsaber.",
  "Chewbacca": "A Wookiee warrior and Han Solo's co-pilot, known for his strength and loyalty.",
  "Lando Calrissian": "A charismatic gambler and strategist who became an essential Rebel ally.",
  "Finn": "A former stormtrooper who fought for the Resistance, choosing freedom over tyranny.",
  "Rey": "A skilled Force user who seeks the balance between Light and Dark.",
  "Poe Dameron": "An ace pilot and commander in the Resistance, known for daring tactics.",
  "BB8": "A resourceful droid companion to Rey and sometimes Poe, rolling into action when needed.",
  "R2-D2": "A heroic astromech droid who aided Jedi and Rebels across generations.",
  "C-3PO": "A protocol droid fluent in over six million forms of communication, often anxious but loyal.",
  "Darth Maul": "A Sith apprentice with a double-bladed lightsaber, known for his fierce combat and hatred of the Jedi.",
  "Obi-Wan Kenobi": "A noble Jedi Master who trained Anakin and Luke Skywalker, known for wisdom and bravery."
};

searchInput.addEventListener("input", function (e) {
  searchQuery = capitalizeName(e.target.value);

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    currentPage = 1;
    updateDisplay();
  }, 500);
});

function setPaginationControls() {
  const totalPages = Math.ceil(filteredCharacters.length / itemsPerPage);
  const pagination = document.createElement('div');

  pagination.innerHTML = `
    <button id="prev-button" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="next-button" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;

  pagination.querySelector("#prev-button").addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateDisplay();
    }
  });

  pagination.querySelector("#next-button").addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateDisplay();
    }
  });

  paginationControls.innerHTML = "";
  paginationControls.appendChild(pagination);
}

function updateDisplay() {
  filteredCharacters = allCharacters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  displayCharacters(filteredCharacters.slice(start, end));
  setPaginationControls();
}

async function fetchCharacters() {
  const databankUrl = `https://starwars-databank-server.vercel.app/api/v1/characters?page=1&limit=1000`;
  const akababUrl = `https://akabab.github.io/starwars-api/api/all.json`;

  try {
    const [databankRes, akababRes] = await Promise.all([fetch(databankUrl), fetch(akababUrl)]);

    const databankData = await databankRes.json();
    const akababData = await akababRes.json();

    const akababMap = {};
    akababData.forEach((char) => {
      akababMap[char.name.toLowerCase()] = {
        id: `akabab-${char.id}`,
        image: char.image || "",
        description: char.description || "",
      };
    });

    const databankCharacters = databankData.data.map((char) => {
      const key = char.name.trim();
      const akababMatch = akababMap[key.toLowerCase()];

      return {
        _id: char._id,
        name: key,
        description: customDescriptions[key] || char.description || akababMatch?.description || "More info coming soon...",
        image: akababMatch?.image || "",
      };
    });

    const databankNames = new Set(databankCharacters.map(c => c.name.toLowerCase()));
    const akababOnly = akababData.filter(c => !databankNames.has(c.name.toLowerCase())).map(c => {
      const key = c.name;
      return {
        _id: `akabab-${c.id}`,
        name: key,
        description: customDescriptions[key] || c.description || "More info coming soon...",
        image: c.image || "",
      };
    });

    allCharacters = [...databankCharacters, ...akababOnly].sort((a, b) => a.name.localeCompare(b.name));

    updateDisplay();

  } catch (error) {
    console.error("Fetch Error:", error);
    displayError();
  }
}

function displayCharacters(characters) {
  const list = characters.map(character => `
    <li>
      <a href="#" data-url="${character._id}">${character.name}</a>
    </li>
  `).join(" ");

  results.innerHTML = `<ul class="characters">${list}</ul>`;

  document.querySelectorAll('.characters a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.target.dataset.url;
      const character = allCharacters.find(c => c._id === id);
      if (character) showCharacterDialog(character);
    });
  });
}

function showCharacterDialog(character) {
  const dialog = document.getElementById("character-dialog");
  const dialogBody = document.getElementById("dialog-body");

  dialogBody.innerHTML = `
    <h2>${character.name}</h2>
    ${character.image ? `<img src="${character.image}" alt="${character.name}" style="max-width: 100%; border-radius: 10px; margin: 10px 0;" />` : ''}
    <p>${character.description}</p>
  `;

  dialog.classList.remove("hidden");
  document.getElementById("close-dialog").addEventListener('click', () => {
    dialog.classList.add("hidden");
  });
}

function displayError() {
  results.innerHTML = "<ul class='characters'><li>The characters you seek are not here</li></ul>";
}

function capitalizeName(query) {
  return query
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

document.addEventListener("click", function () {
  const video = document.getElementById("background-video");
  if (video) {
    video.muted = false;
    video.play();
  }
});

fetchCharacters();
window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("intro-modal");
  const crawlOverlay = document.querySelector('.crawl-overlay');
  const uiWrapper = document.querySelector('.ui-wrapper');
  const video = document.getElementById("background-video");

  // Close the modal and start the video
  const closeModal = () => {
    modal.style.display = "none";
    if (video) {
      video.muted = false;
      video.play();
    }

    // Give DOM a chance to update
    setTimeout(() => {
      crawlOverlay.classList.add('fade-out');  // Trigger the fade out effect
      uiWrapper.classList.add('ready');  // Update UI (or anything else needed)
    }, 200);  // Small delay before starting fade-out
  };

  // Trigger modal close after crawl finishes (30s) automatically
  setTimeout(() => {
    closeModal();
  }, 60000); // Adjust if crawl duration changes

  modal.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !document.querySelector("input:focus")) {
      closeModal();
    }
  });
});
