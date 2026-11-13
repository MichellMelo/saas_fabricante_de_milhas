"use client";

import { useEffect, useState } from "react";
import {
  DESTINATION_LANDSCAPES,
  type DestinationLandscape,
} from "@/lib/destination-landscapes";

type CommonsPhoto = {
  imageSrc: string;
  imageAlt: string;
  sourceUrl: string;
  credit: string;
  license: string;
};
type PhotoState = { status: "loading" | "ready" | "unavailable"; photo?: CommonsPhoto };

// Country-qualified article titles avoid disambiguation and unrelated pictures.
const WIKI_TITLES: Record<string, string> = {
  AEP: "Buenos Aires", AMS: "Amesterdão", BCN: "Barcelona", BOG: "Bogotá",
  BSB: "Brasília", BYO: "Bonito (Mato Grosso do Sul)", CDG: "Paris",
  CGH: "São Paulo", CNF: "Belo Horizonte", COR: "Córdoba (Argentina)",
  CUR: "Willemstad", CWB: "Curitiba", EZE: "Buenos Aires",
  FEN: "Fernando de Noronha", FLN: "Florianópolis", FTE: "El Calafate",
  GIG: "Rio de Janeiro", GVA: "Genebra", GYN: "Goiânia",
  IBZ: "Ibiza", JDO: "Juazeiro do Norte", LHR: "Londres",
  LIM: "Lima", LIS: "Lisboa", MAO: "Manaus", MIA: "Miami",
  MVD: "Montevidéu", NAT: "Natal (Rio Grande do Norte)", NVT: "Navegantes",
  PET: "Pelotas", POA: "Porto Alegre", PRG: "Praga",
  PTY: "Cidade do Panamá", REC: "Recife", SAO: "São Paulo",
  SCL: "Santiago (Chile)", SDU: "Rio de Janeiro",
  SJP: "São José do Rio Preto", SLZ: "São Luís (Maranhão)",
  SSA: "Salvador (Bahia)", THE: "Teresina", UDI: "Uberlândia",
  USH: "Ushuaia", VCE: "Veneza", VCP: "Campinas",
  VIE: "Viena", VIX: "Vitória (Espírito Santo)",
};

const imageCache = new Map<string, Promise<CommonsPhoto | null>>();

function cleanMarkup(value?: string): string {
  if (!value) return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

async function findCommonsPhoto(iata: string): Promise<CommonsPhoto | null> {
  const location = DESTINATION_LANDSCAPES[iata];
  const title = WIKI_TITLES[iata];
  if (!location || !title) return null;
  try {
    const query = new URLSearchParams({
      action: "query",
      prop: "pageimages",
      piprop: "thumbnail|name",
      pithumbsize: "1000",
      titles: title,
      format: "json",
      origin: "*",
    });
    const response = await fetch(`https://pt.wikipedia.org/w/api.php?${query}`, {
      cache: "force-cache",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      query?: {
        pages?: Record<string, { thumbnail?: { source?: string }; pageimage?: string; missing?: string }>;
      };
    };
    const page = Object.values(payload.query?.pages ?? {})[0];
    const imageSrc = page?.thumbnail?.source;
    const filename = page?.pageimage;
    // No shields, flags, maps, or non-photographic SVG stand-ins.
    if (!imageSrc?.startsWith("https://") || !filename || /\.svg$/i.test(filename)) {
      return null;
    }
    const fileTitle = filename.startsWith("File:") ? filename : `File:${filename}`;
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle).replace(/%3A/i, ":")}`;
    const metadataQuery = new URLSearchParams({
      action: "query",
      prop: "imageinfo",
      iiprop: "extmetadata",
      titles: fileTitle,
      format: "json",
      origin: "*",
    });
    const metadataResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?${metadataQuery}`,
      { cache: "force-cache" },
    );
    if (!metadataResponse.ok) return null;
    const metadata = (await metadataResponse.json()) as {
      query?: {
        pages?: Record<string, {
          imageinfo?: Array<{
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }>;
      };
    };
    const info = Object.values(metadata.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata;
    const credit = cleanMarkup(info?.Artist?.value) || cleanMarkup(info?.Credit?.value);
    const license = cleanMarkup(info?.LicenseShortName?.value);
    // Only show images with verifiable attribution and license.
    if (!credit || !license || /all rights reserved|copyrighted/i.test(license)) return null;
    return {
      imageSrc,
      imageAlt: `Vista de ${location.city}, ${location.country}`,
      sourceUrl,
      credit,
      license,
    };
  } catch {
    return null;
  }
}

function cachedPhoto(iata: string) {
  let request = imageCache.get(iata);
  if (!request) {
    request = findCommonsPhoto(iata);
    imageCache.set(iata, request);
  }
  return request;
}

export function DestinationPhoto({ iata }: { iata: string }) {
  const destination = DESTINATION_LANDSCAPES[iata];
  const [state, setState] = useState<PhotoState>({ status: "loading" });
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
    if (!destination || destination.imageSrc) {
      setState({ status: "ready" });
      return;
    }
    let active = true;
    setState({ status: "loading" });
    void cachedPhoto(iata).then((photo) => {
      if (!active) return;
      setState(photo ? { status: "ready", photo } : { status: "unavailable" });
    });
    return () => { active = false; };
  }, [destination, iata]);

  if (!destination) return null;
  const photo: DestinationLandscape = { ...destination, ...state.photo };
  if (state.status === "loading" && !destination.imageSrc) {
    return <div className="mt-5 h-44 animate-pulse rounded-2xl bg-slate-100 sm:h-56" aria-label="Carregando foto do destino" />;
  }
  if (!photo.imageSrc || imageFailed) {
    return (
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {destination.city} · {destination.country}
      </div>
    );
  }
  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      <img
        src={photo.imageSrc}
        alt={photo.imageAlt ?? `Paisagem de ${destination.city}`}
        className="h-44 w-full object-cover sm:h-56"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px] text-slate-500">
        <span>{destination.city} · {destination.country}</span>
        {photo.sourceUrl && (
          <a
            href={photo.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            title="Ver autoria, licença e detalhes da fotografia"
          >
            Foto: {photo.credit} · {photo.license}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
