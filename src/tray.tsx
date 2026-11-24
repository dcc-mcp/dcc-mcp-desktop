import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import TrayApp from './windows/tray/TrayApp';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TrayApp />
  </React.StrictMode>,
);
