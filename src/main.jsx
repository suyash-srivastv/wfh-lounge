import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../css/styles.css';

// Dark is the default; a "light" choice made with the toggle wins. Set before
// the first render so sign-in pages match too. (New key: the old one was saved
// automatically as "light" for everyone, so it isn't a real choice.)
try {
  document.documentElement.dataset.theme = localStorage.getItem('stillroom-theme') === 'light' ? '' : 'dark';
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
