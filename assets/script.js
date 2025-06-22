class BookshelfApp {
  constructor() {
    this.books = this.loadBooks();
    this.currentShelf = 'unfinished';
    this.isEditing = false;
    this.editingId = null;
    this.filteredBooks = this.books;
    
    this.initializeElements();
    this.bindEvents();
    this.setCurrentYear();
    this.render();
  }

  initializeElements() {
    this.form = document.getElementById('bookForm');
    this.titleInput = document.getElementById('titleInput');
    this.authorInput = document.getElementById('authorInput');
    this.yearInput = document.getElementById('yearInput');
    this.isCompleteInput = document.getElementById('isCompleteInput');
    this.submitBtn = document.getElementById('submitBtn');
    this.searchForm = document.getElementById('searchForm');
    this.searchInput = document.getElementById('searchInput');
    this.unfinishedShelf = document.getElementById('unfinishedShelf');
    this.finishedShelf = document.getElementById('finishedShelf');
    this.shelfTabs = document.querySelectorAll('.shelf-tab');
  }

  setCurrentYear() {
    const currentYear = new Date().getFullYear();
    this.yearInput.max = currentYear;
    this.yearInput.placeholder = `1000-${currentYear}`;
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
    this.isCompleteInput.addEventListener('change', () => this.updateSubmitButton());
    
    this.shelfTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchShelf(tab.dataset.shelf));
    });

    // Event delegation for book actions
    document.addEventListener('click', (e) => {
      if (e.target.dataset.action) {
        this.handleBookAction(e.target.dataset.action, parseInt(e.target.dataset.id));
      }
    });
  }

  loadBooks() {
    const saved = localStorage.getItem('bookshelfBooks');
    return saved ? JSON.parse(saved) : [];
  }

  saveBooks() {
    localStorage.setItem('bookshelfBooks', JSON.stringify(this.books));
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const currentYear = new Date().getFullYear();
    const inputYear = parseInt(this.yearInput.value);
    
    if (inputYear > currentYear) {
      alert(`Year cannot be in the future. Maximum allowed year is ${currentYear}.`);
      return;
    }

    const bookData = {
      id: this.isEditing ? this.editingId : Date.now(),
      title: this.titleInput.value.trim(),
      author: this.authorInput.value.trim(),
      year: inputYear,
      isComplete: this.isCompleteInput.checked
    };

    if (this.isEditing) {
      const index = this.books.findIndex(book => book.id === this.editingId);
      if (index !== -1) {
        this.books[index] = bookData;
      }
      this.cancelEdit();
    } else {
      this.books.push(bookData);
    }

    this.saveBooks();
    this.resetForm();
    this.applyCurrentFilter();
    this.render();
  }

  handleSearch(e) {
    e.preventDefault();
    this.applyCurrentFilter();
    this.render();
  }

  applyCurrentFilter() {
    const query = this.searchInput.value.trim().toLowerCase();
    this.filteredBooks = query 
      ? this.books.filter(book => book.title.toLowerCase().includes(query))
      : this.books;
  }

  handleBookAction(action, bookId) {
    switch (action) {
      case 'toggle':
        this.toggleBookStatus(bookId);
        break;
      case 'edit':
        this.editBook(bookId);
        break;
      case 'delete':
        this.deleteBook(bookId);
        break;
    }
  }

  toggleBookStatus(bookId) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      book.isComplete = !book.isComplete;
      this.saveBooks();
      this.applyCurrentFilter();
      this.render();
    }
  }

  editBook(bookId) {
    const book = this.books.find(b => b.id === bookId);
    if (book) {
      this.titleInput.value = book.title;
      this.authorInput.value = book.author;
      this.yearInput.value = book.year;
      this.isCompleteInput.checked = book.isComplete;
      
      this.isEditing = true;
      this.editingId = bookId;
      this.updateSubmitButton();
      this.titleInput.focus();
    }
  }

  deleteBook(bookId) {
    const book = this.books.find(b => b.id === bookId);
    if (book && confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.books = this.books.filter(b => b.id !== bookId);
      this.saveBooks();
      this.applyCurrentFilter();
      this.render();
    }
  }

  switchShelf(shelf) {
    this.currentShelf = shelf;
    
    // Update tab appearance
    this.shelfTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.shelf === shelf);
    });

    // Show/hide shelves
    this.unfinishedShelf.style.display = shelf === 'unfinished' ? 'grid' : 'none';
    this.finishedShelf.style.display = shelf === 'finished' ? 'grid' : 'none';
  }

  updateSubmitButton() {
    if (this.isEditing) {
      this.submitBtn.textContent = '✏️ Update Book';
    } else {
      const status = this.isCompleteInput.checked ? 'Finished' : 'Unfinished';
      this.submitBtn.textContent = `📖 Add to ${status} Shelf`;
    }
  }

  resetForm() {
    this.form.reset();
    this.updateSubmitButton();
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingId = null;
    this.updateSubmitButton();
  }

  createBookCard(book) {
    return `
      <div class="book-card">
        <div class="book-title">${book.title}</div>
        <div class="book-info">
          <div>📝 ${book.author}</div>
          <div>📅 ${book.year}</div>
        </div>
        <div class="book-actions">
          <button class="btn btn-success" data-action="toggle" data-id="${book.id}">
            ${book.isComplete ? '↩️ Mark Unfinished' : '✅ Mark Finished'}
          </button>
          <button class="btn btn-primary" data-action="edit" data-id="${book.id}">
            ✏️ Edit
          </button>
          <button class="btn btn-danger" data-action="delete" data-id="${book.id}">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const unfinishedBooks = this.filteredBooks.filter(book => !book.isComplete);
    const finishedBooks = this.filteredBooks.filter(book => book.isComplete);

    // Render unfinished books
    if (unfinishedBooks.length === 0) {
      this.unfinishedShelf.innerHTML = '<div class="empty-state">No unfinished books yet. Add some books to get started!</div>';
    } else {
      this.unfinishedShelf.innerHTML = unfinishedBooks.map(book => this.createBookCard(book)).join('');
    }

    // Render finished books
    if (finishedBooks.length === 0) {
      this.finishedShelf.innerHTML = '<div class="empty-state">No finished books yet. Complete some readings!</div>';
    } else {
      this.finishedShelf.innerHTML = finishedBooks.map(book => this.createBookCard(book)).join('');
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BookshelfApp();
});