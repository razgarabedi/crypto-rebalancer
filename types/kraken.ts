export interface KrakenTickerData {
  a: [string, string, string]; // ask [price, whole lot volume, lot volume]
  b: [string, string, string]; // bid [price, whole lot volume, lot volume]
  c: [string, string]; // last trade closed [price, lot volume]
  v: [string, string]; // volume [today, last 24 hours]
  p: [string, string]; // volume weighted average price [today, last 24 hours]
  t: [number, number]; // number of trades [today, last 24 hours]
  l: [string, string]; // low [today, last 24 hours]
  h: [string, string]; // high [today, last 24 hours]
  o: string; // today's opening price
}

export interface KrakenTickerResponse {
  error: string[];
  result: {
    [pair: string]: KrakenTickerData;
  };
}

export interface KrakenBalance {
  [asset: string]: string;
}

export interface KrakenBalanceResponse {
  error: string[];
  result: KrakenBalance;
}

export interface KrakenAssetPair {
  altname: string;
  wsname: string;
  aclass_base: string;
  base: string;
  aclass_quote: string;
  quote: string;
  pair_decimals: number;
  cost_decimals: number;
  lot_decimals: number;
  lot_multiplier: number;
  margin_call: number;
  margin_stop: number;
}

export interface KrakenAssetPairsResponse {
  error: string[];
  result: {
    [pair: string]: KrakenAssetPair;
  };
}

