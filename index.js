class Book {
  #id;
  #title;
  #author;
  #pageCount;
  #genre;
  #coverId;

  constructor(id, title, author, pageCount = 250, genre = 'General', coverId = null) {
    this.#id = id;
    this.#title = title || 'Unknown Title';
    this.#author = author || 'Unknown Author';
    this.#pageCount = Number(pageCount) > 0 ? Number(pageCount) : 250;
    this.#genre = genre;
    this.#coverId = coverId;
  }

  getId() { return this.#id; }
  getTitle() { return this.#title; }
  getAuthor() { return this.#author; }
  getPageCount() { return this.#pageCount; }
  getGenre() { return this.#genre; }
  getCoverId() { return this.#coverId; }

  getCoverUrl() {
    return this.#coverId 
      ? `https://covers.openlibrary.org/b/id/${this.#coverId}-M.jpg`
      : null;
  }

  setPageCount(pages) {
    if (pages > 0) this.#pageCount = pages;
  }

  displayDetails() {
    return `${this.#title} by ${this.#author} (${this.#pageCount} pages) [${this.#genre}]`;
  }
}

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusMessage = document.getElementById('statusMessage');
const apiResults = document.getElementById('apiResults');

const genreSelect = document.getElementById('genreSelect');
const pagesInput = document.getElementById('pagesInput');
const suggestBtn = document.getElementById('suggestBtn');
const suggestionResult = document.getElementById('suggestionResult');

const calcForm = document.getElementById('calcForm');
const calcResult = document.getElementById('calcResult');

let fetchedBookObjects = [];

async function executeSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    statusMessage.innerText = "Error: Please enter a keyword before searching.";
    statusMessage.className = "status-msg error";
    return;
  }

  statusMessage.innerText = "Loading books from OpenLibrary API...";
  statusMessage.className = "status-msg info";
  apiResults.innerHTML = "";

  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`);
    const data = await res.json();

    if (!data.docs || data.docs.length === 0) {
      statusMessage.innerText = "No results found for your search query. Please try another name.";
      statusMessage.className = "status-msg warning";
      return;
    }

    statusMessage.innerText = `Successfully loaded ${data.docs.length} books.`;
    statusMessage.className = "status-msg success";

    fetchedBookObjects = data.docs.map((doc, idx) => {
      const title = doc.title;
      const author = doc.author_name ? doc.author_name[0] : 'Unknown Author';
      const pages = doc.number_of_pages_median || Math.floor(Math.random() * 250) + 150;
      const genre = doc.subject ? doc.subject[0] : 'General';
      const coverId = doc.cover_i || null;
      return new Book(`book_${idx}_${Date.now()}`, title, author, pages, genre, coverId);
    });

    renderApiBooks(fetchedBookObjects);

  } catch (err) {
    statusMessage.innerText = "Failed to communicate with OpenLibrary API. Please check your internet connection.";
    statusMessage.className = "status-msg error";
  }
}

searchBtn.addEventListener('click', async () => {
  await executeSearch();
});

searchInput.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    await executeSearch();
  }
});

function renderApiBooks(bookList) {
  apiResults.innerHTML = "";
  bookList.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const coverUrl = book.getCoverUrl();
    const imageHtml = coverUrl 
      ? `<img src="${coverUrl}" alt="${book.getTitle()}" class="book-thumb">`
      : `<div class="cover-placeholder">📖 No Cover Image</div>`;

    card.innerHTML = `
      ${imageHtml}
      <h4>${book.getTitle()}</h4>
      <p><strong>Author:</strong> ${book.getAuthor()}</p>
      <p><strong>Est. Pages:</strong> ${book.getPageCount()} pages</p>
      <button class="btn btn-sm" onclick="quickSave('${book.getId()}')">Add to Watchlist</button>
    `;
    apiResults.appendChild(card);
  });
}

window.quickSave = function(id) {
  const book = fetchedBookObjects.find(b => b.getId() === id);
  if (!book) return;

  const saved = JSON.parse(localStorage.getItem('myBookWatchlist') || '[]');
  const exists = saved.some(item => item.title === book.getTitle());

  if (exists) {
    alert(`"${book.getTitle()}" is already in your watchlist!`);
    return;
  }

  saved.push({
    id: book.getId(),
    title: book.getTitle(),
    author: book.getAuthor(),
    pageCount: book.getPageCount(),
    category: book.getGenre(),
    status: 'Plan to Read',
    coverUrl: book.getCoverUrl(),
    addedDate: new Date().toISOString().split('T')[0]
  });

  localStorage.setItem('myBookWatchlist', JSON.stringify(saved));
  alert(`Added "${book.getTitle()}" to your Local Storage Watchlist!`);
};

suggestBtn.addEventListener('click', () => {
  const genre = genreSelect.value;
  const maxPages = Number(pagesInput.value);

  if (!genre && !maxPages) {
    suggestionResult.innerHTML = `<p class="error-text">Please select a genre or enter maximum page limit.</p>`;
    return;
  }

  let suggestion = "";
  let reason = "";

  if (genre === 'programming' && maxPages <= 300) {
    suggestion = "Eloquent JavaScript (3rd Edition)";
    reason = "A concise, essential guide for mastering JavaScript and modern web application development.";
  } else if (genre === 'programming' && maxPages > 300) {
    suggestion = "Clean Code: A Handbook of Agile Software Craftsmanship";
    reason = "Comprehensive deep-dive into object-oriented architecture, design principles, and clean code implementation.";
  } else if (genre === 'fiction' && maxPages <= 250) {
    suggestion = "The Little Prince";
    reason = "A short, timeless philosophical fable perfect for quick reading sessions.";
  } else if (genre === 'fiction' && maxPages > 250) {
    suggestion = "Dune by Frank Herbert";
    reason = "An immersive sci-fi epic suitable for extended reading goals.";
  } else if (genre === 'history') {
    suggestion = "Sapiens: A Brief History of Humankind";
    reason = "Engaging exploration of human civilization, biology, and historical milestones.";
  } else if (genre === 'science') {
    suggestion = "Astrophysics for People in a Hurry";
    reason = "A compact, highly informative overview of modern cosmology.";
  } else {
    suggestion = "Atomic Habits by James Clear";
    reason = "Universal recommendation for setting consistent daily reading routines and tracking goals.";
  }

  suggestionResult.innerHTML = `
    <h4>Recommended Title: ${suggestion}</h4>
    <p><strong>Reasoning:</strong> ${reason}</p>
    <p><em>Criteria Met:</em></p> 
    <p><em>Your chosen genre is: ${genre || 'Any'}</em></p>
    <p><em>Amount of Max Pages you wanted: ${maxPages || 'Unrestricted'} </em></p>
  `;
});

calcForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const totalPages = Number(document.getElementById('calcPages').value);
  const minPerDay = Number(document.getElementById('calcMinPerDay').value);
  const ppm = Number(document.getElementById('calcPPM').value);

  if (totalPages <= 0 || minPerDay <= 0 || ppm <= 0) {
    calcResult.innerHTML = `<p class="error-text">All calculation inputs must be positive numbers.</p>`;
    return;
  }

  const totalMinutesNeeded = totalPages / ppm;
  const totalHoursNeeded = totalMinutesNeeded / 60;
  const daysToComplete = Math.ceil(totalMinutesNeeded / minPerDay);
  const weeksToComplete = (daysToComplete / 7).toFixed(1);

  calcResult.innerHTML = `
    <h4>Reading Goal & Completion Metrics:</h4>
    <ul>
      <li><strong>Total Reading Time Required:</strong> ${totalMinutesNeeded.toFixed(1)} Minutes or (${totalHoursNeeded.toFixed(1)} Hours)</li>
      <li><strong>Estimated Daily Commitment:</strong> ${minPerDay} Minutes/Day at the speed of ${ppm} Pages/Minute</li>
      <li><strong>Projected Completion Time:</strong> ${daysToComplete} Days (approx. ${weeksToComplete} Weeks)</li>
    </ul>
  `;
});