export async function checkYoumiApi() {
  const response = await fetch('/api.php?action=status', { credentials: 'include' });
  return response.json();
}
