import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import GatewayCenterPrototype from './windows/main/GatewayCenterPrototype';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GatewayCenterPrototype />
  </React.StrictMode>,
);
