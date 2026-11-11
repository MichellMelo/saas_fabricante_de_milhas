export type ParsedWhatsappOpportunity = {
  dateRegistered: string;
  program: string;
  cabinClass: string;
  origin: string;
  destination: string;
  milesFloor: number;
  monthsAvailable: string;
  outboundDates: string;
  returnDates: string;
  outboundCount: number;
  returnCount: number;
};

const MONTHS: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4,
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

function plain(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function dateAt(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthDates(year: number, month: number, details: string, section: string) {
  const normalized = plain(details);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const except = normalized.match(/^mes\s+todo\s+exceto\s+(.+)$/);
  const isAll = /^mes\s+todo$/.test(normalized);
  if (!except && !isAll && !/^\d{1,2}(?:\s*[,;]\s*\d{1,2})*$/.test(normalized)) {
    throw new Error(`Datas não reconhecidas em ${section}: "${details}". Use dias separados por vírgula ou "mês todo exceto ...".`);
  }
  const list = except?.[1] ?? (isAll ? "" : normalized);
  if (list && !/^\d{1,2}(?:\s*[,;]\s*\d{1,2})*$/.test(list)) {
    throw new Error(`Lista de dias inválida em ${section}: "${details}".`);
  }
  const days = list ? list.split(/\s*[,;]\s*/).map(Number) : [];
  if (days.some((day) => day < 1 || day > last)) {
    throw new Error(`Dia inválido em ${section}: ${details} (mês com ${last} dias).`);
  }
  const chosen = except || isAll
    ? Array.from({ length: last }, (_, i) => i + 1).filter((day) => !days.includes(day))
    : [...new Set(days)].sort((a, b) => a - b);
  return chosen.map((day) => dateAt(year, month, day));
}

function parseSection(text: string, year: number, label: string) {
  const dates = new Set<string>();
  const months = new Set<number>();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error(`Informe as datas de ${label}.`);
  for (const line of lines) {
    const match = line.match(/^([A-Za-zÀ-ÿ]+)\s*:\s*(.+)$/);
    const month = match ? MONTHS[plain(match[1])] : undefined;
    if (!month || !match) throw new Error(`Linha não reconhecida em ${label}: "${line}".`);
    months.add(month);
    for (const date of monthDates(year, month, match[2], `${label}/${match[1]}`)) dates.add(date);
  }
  if (!dates.size) throw new Error(`Nenhuma data válida para ${label}.`);
  return { dates: [...dates].sort(), months: [...months] };
}

export function parseWhatsappOpportunity(
  message: string,
  year: number,
  cabinClass: string,
  dateRegistered: string,
): ParsedWhatsappOpportunity {
  if (message.length > 15000) throw new Error("A mensagem excede 15.000 caracteres.");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Informe o ano das datas (AAAA), sem presumir o ano da mensagem.");
  }
  if (!["Econômica", "Premium Economy", "Executiva", "Primeira"].includes(cabinClass)) {
    throw new Error("Selecione a classe da oportunidade.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRegistered) ||
      new Date(`${dateRegistered}T12:00:00Z`).toISOString().slice(0, 10) !== dateRegistered) {
    throw new Error("Informe uma data de registro válida.");
  }
  const clean = message.replace(/\r/g, "").replace(/\u00a0/g, " ").trim();
  const program = clean.match(/(?:programa\s+de\s+fidelidade|programa)\s*:\s*([^\n]+)/i)?.[1]?.trim();
  const origin = clean.match(/(?:^|\n)\s*origem\s+[^\n()]*\(([A-Za-z]{3})\)/i)?.[1]?.toUpperCase();
  const destination = clean.match(/(?:^|\n)\s*destino\s+[^\n()]*\(([A-Za-z]{3})\)/i)?.[1]?.toUpperCase();
  const priceText = clean.match(/(?:a\s+partir\s+de|por)\s*(\d+(?:[.,]\d+)?)\s*(k|mil\b|milhas\b)/i);
  if (!program || program.length > 100 || !origin || !destination || origin === destination || !priceText) {
    throw new Error("Identifique programa, origem e destino com códigos IATA (FOR), (BEL) e o valor em milhas (ex.: 8,9K).");
  }
  const number = Number(priceText[1].replace(",", "."));
  const milesFloor = Math.round(number * (/^(k|mil)$/i.test(priceText[2]) ? 1000 : 1));
  if (!Number.isSafeInteger(milesFloor) || milesFloor <= 0) {
    throw new Error("O valor em milhas não é válido.");
  }
  const idaMatch = /(?:^|\n)\s*IDA\s*\n/i.exec(clean);
  const voltaMatch = /(?:^|\n)\s*VOLTA\s*\n/i.exec(clean);
  if (!idaMatch || !voltaMatch || voltaMatch.index <= idaMatch.index) {
    throw new Error("A mensagem deve conter as seções IDA e VOLTA, nessa ordem.");
  }
  const idaText = clean.slice(idaMatch.index + idaMatch[0].length, voltaMatch.index);
  const voltaText = clean.slice(voltaMatch.index + voltaMatch[0].length);
  const ida = parseSection(idaText, year, "IDA");
  const volta = parseSection(voltaText, year, "VOLTA");
  const monthList = [...new Set([...ida.months, ...volta.months])].sort((a, b) => a - b);
  return {
    dateRegistered,
    program: plain(program).includes("latam") ? "LATAM Pass" : program.replace(/\s+/g, " "),
    cabinClass,
    origin, destination, milesFloor,
    monthsAvailable: monthList.map((m) => `${year}-${String(m).padStart(2, "0")}`).join(", "),
    outboundDates: ida.dates.join(", "),
    returnDates: volta.dates.join(", "),
    outboundCount: ida.dates.length,
    returnCount: volta.dates.length,
  };
}
