export async function getCsrfToken() {
  if (process.env.API === "mock") return;

  const response = await fetch("/libs/granite/csrf/token.json");
  const { token } = await response.json();

  return token;
}
