import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type AirportRow = { iataCode: string; name: string; searchName: string; municipality: string | null; searchMunicipality: string | null; countryCode: string | null; countryName: string | null; sourceType: string };
const AIRPORTS_URL = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";
const COUNTRIES_URL = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/countries.csv";
const DAY_MS = 24 * 60 * 60 * 1000;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value); value = "";
    } else value += char;
  }
  values.push(value);
  return values;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

@Injectable()
export class AirportCatalogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AirportCatalogService.name);
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private refreshing = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.refreshIfDue();
    this.refreshTimer = setInterval(() => void this.refreshIfDue(), 60 * 60 * 1000);
    this.refreshTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  async search(query: string) {
    const term = normalize(query);
    if (term.length < 3) return [];
    const rows = await this.prisma.airport.findMany({ take: 500, where: {
      OR: [
        { iataCode: { startsWith: term.toUpperCase() } },
        { searchMunicipality: { contains: term } },
        { searchName: { contains: term } },
      ],
    }});
    const score = (airport: AirportRow) => {
      const code = normalize(airport.iataCode);
      const city = normalize(airport.municipality ?? "");
      const name = normalize(airport.name);
      if (code === term) return 0;
      if (code.startsWith(term)) return 1;
      if (city.startsWith(term)) return 2;
      if (name.startsWith(term)) return 3;
      if (city.includes(term)) return 4;
      return 5;
    };
    return rows.sort((a, b) => score(a as AirportRow) - score(b as AirportRow) || a.name.localeCompare(b.name)).slice(0, 8);
  }

  private async refreshIfDue() {
    if (this.refreshing) return;
    const sync = await this.prisma.airportCatalogSync.findUnique({ where: { id: "ourairports" } }).catch(() => null);
    if (sync?.lastSuccessAt && Date.now() - sync.lastSuccessAt.getTime() < DAY_MS) return;
    this.refreshing = true;
    const now = new Date();
    try {
      await this.prisma.airportCatalogSync.upsert({
        where: { id: "ourairports" },
        create: { id: "ourairports", lastAttemptAt: now, status: "RUNNING" },
        update: { lastAttemptAt: now, status: "RUNNING", errorMessage: null },
      });
      const [airportResponse, countryResponse] = await Promise.all([
        fetch(AIRPORTS_URL, { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "FabricanteDeMilhas/1.0" } }),
        fetch(COUNTRIES_URL, { signal: AbortSignal.timeout(25000), headers: { "User-Agent": "FabricanteDeMilhas/1.0" } }),
      ]);
      if (!airportResponse.ok || !countryResponse.ok) throw new Error("OurAirports não disponibilizou os arquivos CSV.");
      const [airportCsv, countryCsv] = await Promise.all([airportResponse.text(), countryResponse.text()]);
      const countryLines = countryCsv.split(/\r?\n/);
      const countryHeaders = parseCsvLine(countryLines.shift() ?? "");
      const countryCodeIndex = countryHeaders.indexOf("code");
      const countryNameIndex = countryHeaders.indexOf("name");
      const countries = new Map<string, string>();
      for (const line of countryLines) {
        if (!line) continue;
        const cols = parseCsvLine(line);
        if (cols[countryCodeIndex] && cols[countryNameIndex]) countries.set(cols[countryCodeIndex], cols[countryNameIndex]);
      }

      const lines = airportCsv.split(/\r?\n/);
      const headers = parseCsvLine(lines.shift() ?? "");
      const index = (name: string) => headers.indexOf(name);
      const required = ["iata_code", "name", "municipality", "iso_country", "type"];
      if (required.some((key) => index(key) < 0)) throw new Error("Formato inesperado do CSV de aeroportos.");
      const typeRank: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2 };
      const selected = new Map<string, AirportRow>();
      for (const line of lines) {
        if (!line) continue;
        const cols = parseCsvLine(line);
        const type = cols[index("type")] ?? "";
        const code = (cols[index("iata_code")] ?? "").toUpperCase();
        const name = cols[index("name")] ?? "";
        if (!(type in typeRank) || !/^[A-Z]{3}$/.test(code) || !name) continue;
        const row: AirportRow = {
          iataCode: code, name: name.slice(0, 255), searchName: normalize(name).slice(0, 255),
          municipality: (cols[index("municipality")] || null)?.slice(0, 255) ?? null,
          searchMunicipality: (cols[index("municipality")] ? normalize(cols[index("municipality")]).slice(0, 255) : null),
          countryCode: (cols[index("iso_country")] || null)?.slice(0, 2) ?? null,
          countryName: countries.get(cols[index("iso_country")] ?? "")?.slice(0, 100) ?? null,
          sourceType: type,
        };
        const previous = selected.get(code);
        if (!previous || typeRank[type] < typeRank[previous.sourceType]) selected.set(code, row);
      }
      if (selected.size < 1000) throw new Error("A validação de cobertura falhou: menos de 1.000 aeroportos elegíveis.");

      await this.prisma.$transaction(async (tx) => {
        // Replace the catalog atomically in batches. If any batch fails, the
        // transaction rolls back and the previously committed catalog remains.
        await tx.airport.deleteMany();
        const rows = [...selected.values()];
        const batchSize = 1000;
        for (let offset = 0; offset < rows.length; offset += batchSize) {
          await tx.airport.createMany({ data: rows.slice(offset, offset + batchSize) });
        }
        await tx.airportCatalogSync.upsert({
          where: { id: "ourairports" },
          create: { id: "ourairports", lastAttemptAt: now, lastSuccessAt: now, recordCount: selected.size, status: "SUCCESS" },
          update: { lastAttemptAt: now, lastSuccessAt: now, recordCount: selected.size, status: "SUCCESS", errorMessage: null },
        });
      }, { maxWait: 10000, timeout: 120000 });
      this.logger.log("Catálogo de aeroportos atualizado: " + selected.size + " códigos IATA.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido na importação.";
      this.logger.error("Falha ao atualizar catálogo; versão anterior preservada: " + message);
      await this.prisma.airportCatalogSync.upsert({
        where: { id: "ourairports" },
        create: { id: "ourairports", lastAttemptAt: now, status: "ERROR", errorMessage: message.slice(0, 2000) },
        update: { lastAttemptAt: now, status: "ERROR", errorMessage: message.slice(0, 2000) },
      }).catch(() => undefined);
    } finally {
      this.refreshing = false;
    }
  }
}
