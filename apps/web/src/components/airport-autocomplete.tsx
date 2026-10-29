"use client";

import { useEffect, useId, useState } from "react";
import { MapPin, Search } from "lucide-react";

type AirportOption = {
  iataCode: string;
  name: string;
  municipality: string | null;
  countryCode: string | null;
  countryName: string | null;
  sourceType: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
};

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "IATA, cidade ou aeroporto",
  ariaLabel,
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      setNoResults(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "/api/airports?q=" + encodeURIComponent(term),
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Falha ao pesquisar aeroportos.");
        const results = (await response.json()) as AirportOption[];
        setOptions(results);
        setNoResults(results.length === 0);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setOptions([]);
          setNoResults(true);
          setOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(option: AirportOption) {
    setQuery(option.iataCode);
    onChange(option.iataCode);
    setOpen(false);
    setOptions([]);
    setNoResults(false);
    setActiveIndex(-1);
  }

  function changeText(text: string) {
    const next = /^[a-z]{1,3}$/i.test(text) ? text.toUpperCase() : text;
    setQuery(next);
    onChange(next);
    setOpen(next.trim().length >= 3);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (
      event.key === "Enter" &&
      open &&
      activeIndex >= 0 &&
      options[activeIndex]
    ) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative mt-1.5">
      <div className="relative">
        <MapPin
          size={15}
          aria-hidden="true"
          className="absolute left-3 top-3 text-slate-400"
        />
        <input
          value={query}
          onChange={(event) => changeText(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 3) setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#c6a45c] focus:ring-2 focus:ring-[#c6a45c]/15"
        />
        {loading && (
          <Search
            size={14}
            className="absolute right-3 top-3 text-slate-400 animate-pulse"
            aria-label="Buscando"
          />
        )}
      </div>
      {open && (options.length > 0 || noResults) && (
        <div
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          role="listbox"
          id={listId}
        >
          {options.map((option, index) => (
            <button
              type="button"
              key={option.iataCode}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              className={
                "flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-amber-50 " +
                (activeIndex === index ? "bg-amber-50" : "")
              }
            >
              <span className="mt-0.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                {option.iataCode}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">
                  {option.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {[
                    option.municipality,
                    option.countryName || option.countryCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            </button>
          ))}
          {noResults && (
            <p className="px-3 py-3 text-xs text-slate-600">
              Nenhum aeroporto encontrado. Você pode informar manualmente um
              código IATA de 3 letras; ele não será confirmado pelo catálogo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
