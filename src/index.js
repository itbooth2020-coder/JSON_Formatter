import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// The guard for the benign "ResizeObserver loop completed with undelivered
// notifications." browser warning lives in public/index.html as an inline
// <script> instead of here -- it has to run before CRA's dev-client/error-
// overlay script registers its own window 'error' listener (which happens
// before this module ever executes), so stopImmediatePropagation() can
// actually keep the message from reaching it. See that file for details.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
