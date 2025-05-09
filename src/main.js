let debounceTimeout;
let currentPage = 1;
let totalPages = 0;
let searchQuery = "";
let allCharacters = [];

const searchInput = document.getElementById("search-input");
const results = document.getElementById("results");
const paginationControls = document.getElementById("pagination-controls");

// Custom descriptions for characters
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

// Search input with debounce
searchInput.addEventListener("input", function (e) {
  searchQuery = e.target.value;
  searchQuery = capitalizeName(searchQuery);

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    currentPage = 1;
    if (searchQuery.length >= 1) {
      searchForCharacter(searchQuery, currentPage);
    } else {
      // Reset when input is empty
      results.innerHTML = "";
      paginationControls.innerHTML = "";
    }
  }, 500);
});

// Pagination controls
function setPaginationControls() {
  const pagination = document.createElement('div');
  pagination.innerHTML = `
    <button id="prev-button" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="next-button" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;

  pagination.querySelector("#prev-button").addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      searchForCharacter(searchQuery, currentPage);
    }
  });

  pagination.querySelector("#next-button").addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      searchForCharacter(searchQuery, currentPage);
    }
  });

  paginationControls.innerHTML = ""; // Clear previous pagination
  paginationControls.appendChild(pagination);
}

// Fetch, merge, and filter characters
async function searchForCharacter(query, page) {
  const databankUrl = `https://starwars-databank-server.vercel.app/api/v1/characters?page=${page}&limit=100`;
  const akababUrl = `https://akabab.github.io/starwars-api/api/all.json`;

  try {
    const [databankRes, akababRes] = await Promise.all([fetch(databankUrl), fetch(akababUrl)]);

    const databankData = await databankRes.json();
    const akababData = await akababRes.json();

    totalPages = Math.ceil(databankData.info.total / databankData.info.limit);

    // Map Akabab by name
    const akababMap = {};
    akababData.forEach((char) => {
      akababMap[char.name.toLowerCase()] = {
        id: `akabab-${char.id}`,
        image: char.image || "",
        description: char.description || "",
      };
    });

    // Merge with Databank
    const databankCharacters = databankData.data.map((char) => {
      const key = char.name.trim(); // Keep original capitalization
      const akababMatch = akababMap[key.toLowerCase()];

      const finalDescription = customDescriptions[key] || char.description || akababMatch?.description || "More info coming soon...";

      return {
        _id: char._id,
        name: key,
        description: finalDescription,
        image: akababMatch?.image || "",
      };
    });

    // Add Akabab-only characters
    const databankNames = new Set(databankCharacters.map(c => c.name.toLowerCase()));
    const akababOnly = akababData
      .filter(c => !databankNames.has(c.name.toLowerCase()))
      .map(c => {
        const key = c.name;
        return {
          _id: `akabab-${c.id}`,
          name: key,
          description: customDescriptions[key] || c.description || "More info coming soon...",
          image: c.image || "",
        };
      });

    // Combine all characters
    allCharacters = [...databankCharacters, ...akababOnly];

    // Filter characters
    const filteredCharacters = allCharacters.filter(character =>
      (character.description || character.image) &&
      character.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredCharacters.length > 0) {
      displayCharacters(filteredCharacters);
      setPaginationControls();
    } else {
      displayError();
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    displayError();
  }
}

// Display list
function displayCharacters(characters) {
  const listOfCharacterNames = characters.map((character) => {
    return `
      <li>
        <a href="#" data-url="${character._id}">
          ${character.name}
        </a>
      </li>
    `;
  }).join(" ");

  results.innerHTML = `<ul class="characters">${listOfCharacterNames}</ul>`;

  document.querySelectorAll('.characters a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.target.dataset.url;
      const character = allCharacters.find(c => c._id === id);
      if (character) {
        showCharacterDialog(character);
      }
    });
  });
}

// Show character modal
function showCharacterDialog(character) {
  const dialog = document.getElementById("character-dialog");
  const dialogBody = document.getElementById("dialog-body");

  const imageUrl = character.image || '';

  dialogBody.innerHTML = `
    <h2>${character.name}</h2>
    ${imageUrl ? `<img src="${imageUrl}" alt="${character.name}" style="max-width: 100%; border-radius: 10px; margin: 10px 0;" />` : ''}
    <p>${character.description || "More info coming soon..."}</p>
  `;

  dialog.classList.remove("hidden");

  document.getElementById("close-dialog").addEventListener('click', () => {
    dialog.classList.add("hidden");
  });
}

// Error handler
function displayError() {
  results.innerHTML = "<ul class='characters'><li>The characters you seek are not here</li></ul>";
}

// Capitalize name input
function capitalizeName(query) {
  return query
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Unmute background video on click
document.addEventListener("click", function () {
  const video = document.getElementById("background-video");
  if (video) {
    video.muted = false;
    video.play();
  }
});

