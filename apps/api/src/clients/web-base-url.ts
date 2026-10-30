import { InternalServerErrorException } from "@nestjs/common";

export function getWebBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configuredUrl = env.WEB_BASE_URL?.trim();
  if (!configuredUrl) {
    throw new InternalServerErrorException("A variável WEB_BASE_URL não está configurada.");
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new InternalServerErrorException("A variável WEB_BASE_URL deve conter uma URL válida.");
  }

  const isProduction = env.NODE_ENV === "production";
  const isLocalHttp =
    !isProduction &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (
    (url.protocol !== "https:" && !isLocalHttp) ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new InternalServerErrorException(
      "A variável WEB_BASE_URL deve ser uma origem HTTPS válida (HTTP é permitido apenas para localhost fora de produção).",
    );
  }

  return url.origin;
}
