declare global {
  interface WindowEventHandlersEventMap {
    "state:update": StorageEvent;
    "state:update-persistent": StorageEvent;
  }
}

export {};
