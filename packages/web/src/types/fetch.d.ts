// https://developer.mozilla.org/en-US/docs/Web/API/Request/duplex
declare global {
  interface RequestInit {
    duplex?: "half";
  }
}

export {};
