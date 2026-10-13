interface NavigateOptions {
  replace?: boolean;
}

export function navigate(href: string | URL, { replace = false }: NavigateOptions = {}) {
  if (replace) {
    window.location.replace(href);
  } else {
    window.location.assign(href);
  }
}
