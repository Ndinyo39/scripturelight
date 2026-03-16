import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book as BookIcon, 
  Download, 
  Eye, 
  Upload, 
  Search, 
  Filter, 
  X, 
  Loader2, 
  FileText,
  User,
  Plus,
  BookOpen
} from 'lucide-react';
import { api } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import './BooksLibrary.css';

const CATEGORIES = [
  { id: 'all', name: 'All Books' },
  { id: 'devotional', name: 'Devotionals' },
  { id: 'theology', name: 'Theology' },
  { id: 'biography', name: 'Biographies' },
  { id: 'prayer', name: 'Prayer' },
  { id: 'leadership', name: 'Leadership' },
  { id: 'children', name: 'Children' },
  { id: 'commentary', name: 'Commentaries' },
  { id: 'other', name: 'Other' }
];

const BooksLibrary = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        author: '',
        description: '',
        category: 'other',
        coverColor: '#4a6fa5'
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/books');
            setBooks(res);
        } catch (err) {
            console.error('Failed to fetch books:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };


    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !uploadData.title || !uploadData.author) {
            alert('Please fill in all required fields and select a file.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('book', selectedFile);
            formData.append('title', uploadData.title);
            formData.append('author', uploadData.author);
            formData.append('description', uploadData.description);
            formData.append('category', uploadData.category);
            formData.append('coverColor', uploadData.coverColor);

            const token = localStorage.getItem('token');
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const baseUrl = isLocal ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/books/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(result.message || 'Upload failed');
            }

            const result = await response.json();
            alert(result.message);
            setShowUploadModal(false);
            setUploadData({
                title: '',
                author: '',
                description: '',
                category: 'other',
                coverColor: '#4a6fa5'
            });
            setSelectedFile(null);
            fetchBooks();
        } catch (err) {
            console.error('Upload Error:', err);
            alert(`Error: ${err.message}. Please make sure the backend server is running.`);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (bookId, title) => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseUrl = isLocal ? 'http://localhost:5000' : '';
        const url = `${baseUrl}/api/books/${bookId}/download`;
        
        // Use a hidden anchor tag to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', title);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRead = (bookId) => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseUrl = isLocal ? 'http://localhost:5000' : '';
        const url = `${baseUrl}/api/books/${bookId}/read`;
        window.open(url, '_blank');
    };

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             book.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || book.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="books-library">
            <div className="library-header">
                <div className="search-bar">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search books or authors..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                    <Upload size={18} className="mr-2" /> Upload Book
                </button>
            </div>

            <div className="library-content-layout">
                <aside className="library-sidebar">
                    <h4>Categories</h4>
                    <div className="category-list">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id} 
                                className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="library-main">
                    {/* Featured Section */}
                    {activeCategory === 'all' && !searchQuery && books.length > 0 && (
                        <div className="featured-books mb-5">
                            <h2 className="mb-3">Featured Resources</h2>
                            <div className="featured-overlay">
                                <div className="featured-content">
                                    <div className="featured-badge">Classic Choice</div>
                                    <h3>{books[0].title}</h3>
                                    <p>{books[0].author}</p>
                                    <button className="btn-primary btn-sm mt-3" onClick={() => handleRead(books[0].id)}>
                                        <BookOpen size={16} className="mr-2" /> Open Now
                                    </button>
                                </div>
                                <div className="featured-accent" style={{ background: books[0].coverColor }}></div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-5"><Loader2 className="animate-spin" size={32} /></div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="empty-state">
                            <BookIcon size={48} className="text-muted mb-3" />
                            <p>No books found in this category.</p>
                        </div>
                    ) : (
                        <div className="books-grid">
                            <AnimatePresence>
                                {filteredBooks.map(book => (
                                    <motion.div 
                                        key={book.id}
                                        className="book-card"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <div className="book-cover" style={{ backgroundColor: book.coverColor }}>
                                            <BookIcon size={48} color="rgba(255,255,255,0.8)" />
                                            <span className="book-category-tag">{book.category}</span>
                                        </div>
                                        <div className="book-info">
                                            <h3>{book.title}</h3>
                                            <p className="author">by {book.author}</p>
                                            <p className="description">{book.description || 'No description provided.'}</p>
                                            <div className="book-meta">
                                                <span><User size={14} /> {book.uploader?.name || 'Community'}</span>
                                                <span><Download size={14} /> {book.downloadCount}</span>
                                            </div>
                                            <div className="book-actions">
                                                <button className="btn-read" onClick={() => handleRead(book.id)} title="Read Online">
                                                    <Eye size={18} /> Read
                                                </button>
                                                <button className="btn-download" onClick={() => handleDownload(book.id, book.title)} title="Download">
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="modal-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <button className="close-modal" onClick={() => setShowUploadModal(false)}><X /></button>
                            <h2>Upload Christian Resource</h2>
                            <p className="text-muted mb-4">Share spiritual books, devotionals, or study guides with the community.</p>
                            
                            <form onSubmit={handleUpload}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Book Title *</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={uploadData.title}
                                            onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Author *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={uploadData.author}
                                            onChange={(e) => setUploadData({...uploadData, author: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group mt-3">
                                    <label>Category</label>
                                    <select 
                                        value={uploadData.category}
                                        onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                                    >
                                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group mt-3">
                                    <label>Brief Description</label>
                                    <textarea 
                                        rows={3}
                                        value={uploadData.description}
                                        onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                                    ></textarea>
                                </div>

                                <div className="form-group mt-3">
                                    <label>File (PDF, EPUB, DOCX)</label>
                                    <div className="file-upload-zone">
                                        <input 
                                            type="file" 
                                            accept=".pdf,.epub,.docx" 
                                            onChange={handleFileChange}
                                            id="book-file"
                                        />
                                        <label htmlFor="book-file">
                                            {selectedFile ? (
                                                <span className="file-name"><FileText size={20} /> {selectedFile.name}</span>
                                            ) : (
                                                <>
                                                    <Plus />
                                                    <span>Click to choose file</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group mt-3">
                                    <label>Cover Color</label>
                                    <div className="color-selector">
                                        {['#4a6fa5', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#7400b8', '#1a1a2e'].map(color => (
                                            <div 
                                                key={color}
                                                className={`color-swatch ${uploadData.coverColor === color ? 'selected' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setUploadData({...uploadData, coverColor: color})}
                                            ></div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary w-100 mt-4" disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin" /> : 'Upload to Community Library'}
                                </button>
                                <p className="text-center text-xs mt-2 text-muted">Books will be visible once approved by an admin.</p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BooksLibrary;
