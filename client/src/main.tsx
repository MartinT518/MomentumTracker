import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the error from appearing in console
});

window.addEventListener('error', (event) => {
  console.warn('Global error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
