import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registrar Service Worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Remover elementos do Lovable se existirem
const removeLovableElements = () => {
  // Remover por atributos
  document.querySelectorAll('[data-lovable]').forEach(el => el.remove());
  document.querySelectorAll('[class*="lovable"]').forEach(el => el.remove());
  document.querySelectorAll('[id*="lovable"]').forEach(el => el.remove());
  
  // Remover links/banners promocionais do Lovable
  document.querySelectorAll('a[href*="lovable"]').forEach(el => {
    const parent = el.closest('div, section, header, nav');
    if (parent && (parent.textContent?.includes('Lovable') || parent.textContent?.includes('Upgrade'))) {
      parent.remove();
    }
  });
  
  // Remover elementos com gradiente característico do Lovable (orange-pink-magenta-blue)
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage || style.background || '';
    if (bg.includes('orange') && bg.includes('pink') && bg.includes('magenta')) {
      const text = el.textContent || '';
      if (text.includes('TREINÃO') || text.includes('Lovable')) {
        el.remove();
      }
    }
  });
};

// Executar imediatamente e após DOM carregar
removeLovableElements();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeLovableElements);
} else {
  removeLovableElements();
}

// Observar mudanças no DOM para remover elementos injetados dinamicamente
const observer = new MutationObserver(() => {
  removeLovableElements();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
