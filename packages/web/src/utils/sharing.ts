export async function sharePage() {
  if (!navigator.share) {
    return;
  }
  await navigator.share({
    url: window.location.href,
    title: document.title,
  });
}
