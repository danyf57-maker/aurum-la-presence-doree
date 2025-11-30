
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BetaLanding } from './components/BetaLanding';
import { BetaThankYou } from './components/BetaThankYou';
import { BetaAdmin } from './components/BetaAdmin';

const rootElement = document.getElementById('root');
const path = window.location.pathname;

if (rootElement) {
  const root = createRoot(rootElement);
  let element: JSX.Element;

  if (path.startsWith('/admin/beta')) {
    element = <BetaAdmin />;
  } else if (path.startsWith('/beta/merci')) {
    element = <BetaThankYou />;
  } else if (path.startsWith('/beta')) {
    element = <BetaLanding />;
  } else {
    element = <App />;
  }

  root.render(
    <React.StrictMode>
      {element}
    </React.StrictMode>
  );
}
