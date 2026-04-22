// Eurostat API — Irish Labour Market Data
// Free, no key required, covers Ireland (geo=IE)
// https://ec.europa.eu/eurostat/web/json-and-unicode-web-services

const BASE_URL =
  process.env.EXPO_PUBLIC_MARKET_API_URL ??
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

export type UnemploymentPoint = {
  period: string;
  rate: number;
};

// Monthly Irish unemployment rate (seasonally adjusted, % of active population)
// Dataset: une_rt_m — filtered to Ireland, all ages, both sexes
export async function getIrishUnemploymentTrend(): Promise<UnemploymentPoint[]> {
  const url =
    `${BASE_URL}/une_rt_m` +
    `?geo=IE&s_adj=SA&age=TOTAL&sex=T&unit=PC_ACT` +
    `&format=JSON&lang=EN&lastTimePeriod=13`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat API returned ${res.status}`);

  const json = await res.json();

  const timeDim = json.dimension?.time?.category;
  if (!timeDim) throw new Error('Unexpected response structure from Eurostat.');

  // Sort time periods by their index position in the response
  const timeKeys: string[] = Object.keys(timeDim.index).sort(
    (a, b) => timeDim.index[a] - timeDim.index[b]
  );

  const values: (number | null)[] = json.value;

  return timeKeys
    .map((key, i) => ({ period: formatPeriod(key), rate: values[i] ?? 0 }))
    .filter((p) => p.rate > 0);
}

// Convert "2024M03" → "Mar 2024"
function formatPeriod(raw: string): string {
  const match = raw.match(/^(\d{4})M(\d{2})$/);
  if (!match) return raw;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(match[2], 10) - 1]} ${match[1]}`;
}
