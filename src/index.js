import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Disable noisy console output by default. Enable by setting localStorage.FAB_DEBUG = '1'
(() => {
	try {
		const isDebugEnabled = typeof window !== 'undefined' && (window.__FAB_DEBUG__ || localStorage.getItem('FAB_DEBUG') === '1');
		if (!isDebugEnabled) {
			const noop = () => {};
			// Silence common console methods
			console.log = noop;
			console.warn = noop;
			console.info = noop;
			console.debug = noop;
			console.table = noop;
		}
	} catch (e) {
		// Ignore any errors while silencing logs
	}
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
