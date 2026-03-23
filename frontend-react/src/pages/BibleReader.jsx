import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Type,
  Moon,
  Sun,
  Palette,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Bookmark,
  Loader2,
  RefreshCw,
  AlignLeft,
  Menu,
  X,
  Copy
} from 'lucide-react';
import { api } from '../api';
import './BibleReader.css';

const Toast = ({ message, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="toast-notification"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      style={{
        position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--dark)', color: 'white', padding: '0.85rem 1.75rem',
        borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)', zIndex: 10000, fontWeight: 500
      }}
    >
      <Check size={18} color="var(--success)" /> {message}
    </motion.div>
  );
};

// ── Complete Bible data (all 66 books with correct chapter counts) ──
const bibleData = {
  oldTestament: [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ],
  newTestament: [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ],
  chapters: {
    // Old Testament
    'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
    'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
    '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
    'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
    'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
    'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
    'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
    'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
    // New Testament
    'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
    'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
    'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
    '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
    '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
    'Jude': 1, 'Revelation': 22
  }
};

const TRANSLATIONS = [
  { value: 'kjv',    label: 'KJV: King James Version' },
  { value: 'web',    label: 'NKJV: World English Bible (Modern)' },
  { value: 'bbe',    label: 'NIV: Basic English Bible' },
  { value: 'oeb-us', label: 'MSG: Open English Bible' },
  { value: 'webbe',  label: 'NLT: World English Bible (British)' },
  { value: 'kjv',    label: 'Amplified: KJV Classic Edition' },
];

const BibleReader = () => {
  const [currentBook, setCurrentBook] = useState(() => localStorage.getItem('lastReadBook') || 'John');
  const [currentChapter, setCurrentChapter] = useState(() => parseInt(localStorage.getItem('lastReadChapter')) || 3);
  const [testament, setTestament] = useState(() => bibleData.oldTestament.includes(localStorage.getItem('lastReadBook')) ? 'old' : 'new');
  const [translation, setTranslation] = useState(() => localStorage.getItem('lastReadTranslation') || 'kjv');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('bibleFontFamily') || 'sans-serif');
  const [toast, setToast] = useState('');
  const [coloredHighlights, setColoredHighlights] = useState(() => {
    const saved = localStorage.getItem('bibleHighlights');
    return saved ? JSON.parse(saved) : {};
  });
  const COLORS = ['#ffeaaa', '#c5e1a5', '#b3e5fc', '#f48fb1']; // yellow, green, blue, pink
  const [searchQuery, setSearchQuery] = useState('');
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightedVerse, setHighlightedVerse] = useState(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState([]);
  const [readStatus, setReadStatus] = useState({});
  const [fontSize, setFontSize] = useState(1.15);
  const [theme, setTheme] = useState('light');
  const [chapterReference, setChapterReference] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  // Handle Load Verses & Save LocalStorage
  useEffect(() => {
    localStorage.setItem('lastReadBook', currentBook);
    localStorage.setItem('lastReadChapter', currentChapter.toString());
    localStorage.setItem('lastReadTranslation', translation);
    loadVerses();
  }, [currentBook, currentChapter, translation]);

  // Save color highlights
  useEffect(() => {
    localStorage.setItem('bibleHighlights', JSON.stringify(coloredHighlights));
  }, [coloredHighlights]);

  // Save font family
  useEffect(() => {
    localStorage.setItem('bibleFontFamily', fontFamily);
  }, [fontFamily]);

  const showToast = (msg) => setToast(msg);

  const copyVerse = (v) => {
    const text = `${currentBook} ${currentChapter}:${v.verse} - ${v.text}`;
    navigator.clipboard.writeText(text);
    showToast('Verse copied to clipboard!');
    setHighlightedVerse(null);
  };

  const toggleColorHighlight = (verseNum, color) => {
    const key = `${currentBook}-${currentChapter}-${verseNum}`;
    setColoredHighlights(prev => {
      const next = { ...prev };
      if (next[key] === color) {
        delete next[key];
      } else {
        next[key] = color;
      }
      return next;
    });
  };

  const loadVerses = async (forceTranslation = null) => {
    setLoading(true);
    setError('');
    setHighlightedVerse(null);
    const activeTranslation = forceTranslation || translation;
    
    try {
      const encodedBook = currentBook.replace(/ /g, '+');
      const url = `https://bible-api.com/${encodedBook}+${currentChapter}?translation=${activeTranslation}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Fallback for incomplete translations (like OEB)
        if (activeTranslation !== 'web') {
           console.log(`Translation ${activeTranslation} failed, falling back to WEB`);
           return loadVerses('web');
        }
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      if (!data.verses || data.verses.length === 0) {
        throw new Error('No verses found for this chapter.');
      }
      const cleanVerses = data.verses.map(v => ({ ...v, text: v.text.trim() }));
      setVerses(cleanVerses);
      setChapterReference(data.reference || `${currentBook} ${currentChapter}`);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } catch (err) {
      setError('Could not load this chapter. Please try a different book, chapter, or translation.');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    const chapterKey = `${currentBook}-${currentChapter}`;
    if (readStatus[chapterKey]) return;
    try {
      await api.post('/bible/record-progress', {
        book: currentBook,
        chapter: currentChapter,
        minutesSpent: 5
      });
      setReadStatus(prev => ({ ...prev, [chapterKey]: true }));
    } catch (err) {
      // Still mark locally even if API fails
      setReadStatus(prev => ({ ...prev, [chapterKey]: true }));
    }
  };

  const toggleBookmark = (verseNum) => {
    const key = `${currentBook}-${currentChapter}-${verseNum}`;
    setBookmarkedVerses(prev =>
      prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key]
    );
  };

  const isBookmarked = (verseNum) => bookmarkedVerses.includes(`${currentBook}-${currentChapter}-${verseNum}`);
  const isRead = readStatus[`${currentBook}-${currentChapter}`];
  const books = testament === 'old' ? bibleData.oldTestament : bibleData.newTestament;
  const totalChapters = bibleData.chapters[currentBook] || 1;

  const goToPrevChapter = useCallback(() => {
    if (currentChapter > 1) {
      setCurrentChapter(c => c - 1);
    } else {
      // Go to previous book
      const allBooks = [...bibleData.oldTestament, ...bibleData.newTestament];
      const idx = allBooks.indexOf(currentBook);
      if (idx > 0) {
        const prevBook = allBooks[idx - 1];
        setCurrentBook(prevBook);
        setCurrentChapter(bibleData.chapters[prevBook] || 1);
        setTestament(bibleData.oldTestament.includes(prevBook) ? 'old' : 'new');
      }
    }
  }, [currentBook, currentChapter]);

  const goToNextChapter = useCallback(() => {
    if (currentChapter < totalChapters) {
      setCurrentChapter(c => c + 1);
    } else {
      // Go to next book
      const allBooks = [...bibleData.oldTestament, ...bibleData.newTestament];
      const idx = allBooks.indexOf(currentBook);
      if (idx < allBooks.length - 1) {
        const nextBook = allBooks[idx + 1];
        setCurrentBook(nextBook);
        setCurrentChapter(1);
        setTestament(bibleData.oldTestament.includes(nextBook) ? 'old' : 'new');
      }
    }
  }, [currentBook, currentChapter, totalChapters]);

  // Keyboard events
  useEffect(() => {
    const handleKey = (e) => { 
      if (e.key === 'Escape') setSidebarOpen(false); 
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft') goToPrevChapter();
        if (e.key === 'ArrowRight') goToNextChapter();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrevChapter, goToNextChapter]);

  const sidebarContent = (
    <>
      <div className="sidebar-search">
        <Search size={16} color="var(--gray)" />
        <input
          type="text"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="testament-toggle">
        <button className={testament === 'old' ? 'active' : ''} onClick={() => setTestament('old')}>
          Old
        </button>
        <button className={testament === 'new' ? 'active' : ''} onClick={() => setTestament('new')}>
          New
        </button>
      </div>

      <div className="book-list">
        {books
          .filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(book => (
            <button
              key={book}
              className={`book-btn ${currentBook === book ? 'active' : ''}`}
              onClick={() => {
                setCurrentBook(book);
                setCurrentChapter(1);
                setSidebarOpen(false);
              }}
            >
              {readStatus[`${book}-1`] ? '✓ ' : ''}{book}
            </button>
          ))
        }
      </div>
    </>
  );

  return (
    <div className="bible-reader-page section container">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="bible-layout">

        {/* ── SIDEBAR (desktop always visible, mobile as drawer) ── */}
        <aside className={`bible-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          {/* Mobile close button inside sidebar */}
          <button
            className="sidebar-toggle-btn"
            style={{ marginBottom: '1rem', background: 'transparent', color: 'var(--gray)', border: '1px solid var(--gray-lighter)' }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close book list"
          >
            <X size={16} /> Close
          </button>
          {sidebarContent}
        </aside>

        {/* ── READER MAIN ── */}
        <main className="reader-main">
          {/* Mobile sidebar toggle button */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open book list"
          >
            <Menu size={16} /> {currentBook} {currentChapter}
          </button>

          {/* Reader Header */}
          <div className="reader-header">
            <div className="reader-nav">
              <div>
                <h2 className="mb-0">{chapterReference || `${currentBook} ${currentChapter}`}</h2>
                <small className="text-muted">{TRANSLATIONS.find(t => t.value === translation)?.label}</small>
              </div>
              <div className="nav-controls">
                <button className="icon-btn" disabled={loading} onClick={goToPrevChapter} title="Previous Chapter">
                  <ChevronLeft size={20} />
                </button>
                <select
                  value={currentChapter}
                  onChange={(e) => setCurrentChapter(parseInt(e.target.value))}
                  disabled={loading}
                >
                  {[...Array(totalChapters)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Ch. {i + 1}</option>
                  ))}
                </select>
                <button className="icon-btn" disabled={loading} onClick={goToNextChapter} title="Next Chapter">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="reader-toolbar">
              <div className="d-flex align-items-center gap-3 flex-wrap" style={{ minWidth: 0, maxWidth: '100%' }}>
                {/* Translation & Font Select */}
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  disabled={loading}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', maxWidth: '100%', minWidth: 0, flex: '1 1 auto', border: '1px solid var(--gray-lighter)', borderRadius: '8px' }}
                >
                  {TRANSLATIONS.map(t => (
                    <option key={t.label} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-lighter)', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: 'var(--gray)' }}
                >
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="serif">Serif (Classic)</option>
                  <option value="monospace">Monospace</option>
                </select>

                {/* Theme Buttons */}
                <div className="reader-settings">
                  <button className={`setting-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} title="Light">
                    <Sun size={16} />
                  </button>
                  <button className={`setting-btn sepia ${theme === 'sepia' ? 'active' : ''}`} onClick={() => setTheme('sepia')} title="Sepia">
                    <Palette size={16} />
                  </button>
                  <button className={`setting-btn dark ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} title="Dark">
                    <Moon size={16} />
                  </button>
                </div>

                {/* Font Size Controls */}
                <div className="font-scaler">
                  <button onClick={() => setFontSize(f => Math.max(0.8, parseFloat((f - 0.1).toFixed(1))))} title="Smaller Text">
                    <Type size={13} />
                  </button>
                  <span style={{ fontSize: '0.75rem', padding: '0 4px', color: 'var(--gray)', lineHeight: '32px' }}>{Math.round(fontSize * 100)}%</span>
                  <button onClick={() => setFontSize(f => Math.min(2.5, parseFloat((f + 0.1).toFixed(1))))} title="Larger Text">
                    <Type size={19} />
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="icon-btn" onClick={loadVerses} title="Reload" disabled={loading}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                {!isRead && verses.length > 0 && (
                  <button className="btn-primary btn-sm" onClick={handleMarkAsRead} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} /> Mark Read
                  </button>
                )}
                {isRead && (
                  <span className="status-badge approved" style={{ padding: '6px 12px' }}>✓ Completed</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="reader-progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(currentChapter / totalChapters) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Verses */}
          <div 
            className={`chapter-content theme-${theme}`} 
            ref={contentRef}
            style={{ fontFamily: fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' : fontFamily === 'monospace' ? '"Courier New", monospace' : 'system-ui, -apple-system, sans-serif' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentBook}-${currentChapter}-${translation}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {loading && (
                  <div className="loading-state">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Fetching God's Word...</p>
                  </div>
                )}
                {error && !loading && (
                  <div className="error-state">
                    <BookOpen size={40} />
                    <p>{error}</p>
                    <button className="btn-outline mt-3" onClick={loadVerses}>Try Again</button>
                  </div>
                )}
                {!loading && !error && verses.length === 0 && (
                  <div className="empty-chapter-hint">
                    <BookOpen size={48} />
                    <p>Select a book and chapter to begin reading.</p>
                  </div>
                )}
                {!loading && !error && verses.map(v => {
                  const highlightColor = coloredHighlights[`${currentBook}-${currentChapter}-${v.verse}`];
                  return (
                  <div
                    key={v.verse}
                    className={`verse-container ${highlightedVerse === v.verse ? 'highlighted' : ''}`}
                    style={{ backgroundColor: highlightColor || 'transparent' }}
                    onClick={() => setHighlightedVerse(prev => prev === v.verse ? null : v.verse)}
                  >
                    <p className="verse" style={{ fontSize: `${fontSize}rem` }}>
                      <span className="verse-num">{v.verse}</span>
                      {v.text}
                    </p>
                    {highlightedVerse === v.verse && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="verse-action-bar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="verse-action-btn" onClick={() => copyVerse(v)} title="Copy Verse text">
                          <Copy size={14} /> Copy
                        </button>
                        <button className={`verse-action-btn ${isBookmarked(v.verse) ? 'active' : ''}`} onClick={() => toggleBookmark(v.verse)} title="Bookmark">
                          <Bookmark size={14} fill={isBookmarked(v.verse) ? 'var(--primary)' : 'none'} color={isBookmarked(v.verse) ? 'var(--primary)' : 'currentColor'} /> Bookmark
                        </button>
                        <div className="color-picker">
                           {COLORS.map(c => (
                             <div 
                               key={c} 
                               className="color-dot" 
                               style={{ background: c, border: highlightColor === c ? '2px solid var(--dark)' : '1px solid #ddd' }}
                               onClick={() => toggleColorHighlight(v.verse, c)}
                             />
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )})}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Nav */}
          <div className="reader-footer-nav">
            <button className="btn-outline" disabled={loading} onClick={goToPrevChapter}>
              <ChevronLeft size={18} /> Previous
            </button>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              <AlignLeft size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {verses.length} verses
            </span>
            <button className="btn-outline" disabled={loading} onClick={goToNextChapter}>
              Next <ChevronRight size={18} />
            </button>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast('')} />}
      </AnimatePresence>
    </div>
  );
};

export default BibleReader;
