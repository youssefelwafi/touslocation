// Notifications applicatives (toasts) + confirmation, sans popups natives.
let handlers = { toast: null, confirm: null };

export function registerHandlers(h) {
  handlers = h;
}

// toast("message")  ou  toast("message", "success" | "error" | "info")
export function toast(message, type = "error") {
  if (handlers.toast) handlers.toast(message, type);
}

// remplace window.confirm : renvoie une Promise<boolean>
export function confirmDialog(message) {
  return handlers.confirm ? handlers.confirm(message) : Promise.resolve(window.confirm(message));
}
