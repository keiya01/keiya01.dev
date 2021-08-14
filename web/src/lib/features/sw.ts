if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/public/js/sw.js");
    console.log("Service Worker is now registered!");
  });
}
