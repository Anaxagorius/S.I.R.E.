/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Application entry point.
 * Initializes the React application, attaches it to the DOM,
 * and wraps it with global providers (React Router & StrictMode).
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'

/** Renders the root React component into the DOM. */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
