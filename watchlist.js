class WatchlistRecord {
  constructor(id, title, author, pageCount, category, status) {
    this.id = id || `rec_${Date.now()}`;
    this.title = title;
    this.author = author;
    this.pageCount = Number(pageCount);
    this.category = category || 'General';
    this.status = status || 'Plan to Read';
  }

  validate() {
    if (!this.title.trim()) return "Title cannot be empty.";
    if (!this.author.trim()) return "Author cannot be empty.";
    if (isNaN(this.pageCount) || this.pageCount <= 0) return "Page count must be a positive number.";
    return null;
  }
}

const crudForm = document.getElementById('crudForm');
const recordIdInput = document.getElementById('recordId');
const bookTitleInput = document.getElementById('bookTitle');
const bookAuthorInput = document.getElementById('bookAuthor');
const bookPagesInput = document.getElementById('bookPages');
const bookCategoryInput = document.getElementById('bookCategory');
const bookStatusInput = document.getElementById('bookStatus');

const formTitle = document.getElementById('formTitle');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const crudStatus = document.getElementById('crudStatus');
const tableBody = document.getElementById('watchlistTableBody');

const STORAGE_KEY = 'myBookWatchlist';

function getStoredRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveStoredRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function updateWatchlistStats(records) {
  const totalBooks = records.length;
  const totalPages = records.reduce((sum, r) => sum + Number(r.pageCount || 0), 0);
  const completedBooks = records.filter(r => r.status === 'Completed').length;

  const totalBooksEl = document.getElementById('statTotalBooks');
  const totalPagesEl = document.getElementById('statTotalPages');
  const completedEl = document.getElementById('statCompleted');

  if (totalBooksEl) totalBooksEl.innerText = totalBooks;
  if (totalPagesEl) totalPagesEl.innerText = totalPages.toLocaleString();
  if (completedEl) completedEl.innerText = completedBooks;
}

function renderRecords() {
  const records = getStoredRecords();
  tableBody.innerHTML = '';

  updateWatchlistStats(records);

  if (records.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No records stored in Local Storage yet. Add one above!</td></tr>`;
    crudStatus.innerText = "Storage status: Empty.";
    crudStatus.className = "status-msg warning";
    return;
  }

  crudStatus.innerText = `Storage status: Displaying ${records.length} record(s).`;
  crudStatus.className = "status-msg success";

  records.forEach((rec) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(rec.title)}</strong></td>
      <td>${escapeHtml(rec.author)}</td>
      <td>${rec.pageCount}</td>
      <td>${escapeHtml(rec.category)}</td>
      <td><span class="badge ${getStatusBadgeClass(rec.status)}">${rec.status}</span></td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="setupEditRecord('${rec.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRecord('${rec.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function getStatusBadgeClass(status) {
  if (status === 'Completed') return 'badge-success';
  if (status === 'Currently Reading') return 'badge-info';
  return 'badge-warning';
}

crudForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = recordIdInput.value;
  const title = bookTitleInput.value.trim();
  const author = bookAuthorInput.value.trim();
  const pageCount = bookPagesInput.value;
  const category = bookCategoryInput.value.trim();
  const status = bookStatusInput.value;

  const newRecord = new WatchlistRecord(id, title, author, pageCount, category, status);
  const validationError = newRecord.validate();

  if (validationError) {
    alert(`Validation Failure: ${validationError}`);
    return;
  }

  let records = getStoredRecords();

  if (id) {
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = newRecord;
      crudStatus.innerText = `Record "${title}" updated successfully!`;
    }
  } else {
    records.push(newRecord);
    crudStatus.innerText = `Record "${title}" added to Local Storage!`;
  }

  saveStoredRecords(records);
  resetForm();
  renderRecords();
});

window.setupEditRecord = function(id) {
  const records = getStoredRecords();
  const target = records.find(r => r.id === id);

  if (!target) return;

  recordIdInput.value = target.id;
  bookTitleInput.value = target.title;
  bookAuthorInput.value = target.author;
  bookPagesInput.value = target.pageCount;
  bookCategoryInput.value = target.category;
  bookStatusInput.value = target.status;

  formTitle.innerText = "Edit Book / Reading Plan Record";
  saveRecordBtn.innerText = "Update Record";
  cancelEditBtn.style.display = "inline-block";

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteRecord = function(id) {
  const records = getStoredRecords();
  const target = records.find(r => r.id === id);

  if (!target) return;

  const confirmDelete = confirm(`Are you sure you want to remove "${target.title}" from your saved records?`);
  if (confirmDelete) {
    const filtered = records.filter(r => r.id !== id);
    saveStoredRecords(filtered);
    crudStatus.innerText = `Record "${target.title}" removed.`;
    crudStatus.className = "status-msg error";
    renderRecords();
  }
};

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  crudForm.reset();
  recordIdInput.value = '';
  formTitle.innerText = "Add Custom Book / Reading Plan Record";
  saveRecordBtn.innerText = "Save Record to Local Storage";
  cancelEditBtn.style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecords();
});