/**
 * Simulated Financial News API Service
 * Bietet marktrelevante Eilmeldungen, Sentiment-Analysen und Ticker-Daten
 * Generiert symbolbezogene Schlagzeilen für jedes gehandelte Asset.
 */

import { NewsArticle } from '../types/trading';

const INITIAL_NEWS_DATABASE: NewsArticle[] = [
  {
    id: 'news_1',
    headline: 'US-Notenbank Fed signalisiert Zinspause bei nächster FOMC-Sitzung',
    summary: 'FOMC-Vertreter betonen abkühlende Kerninflation und moderates Lohnwachstum. Marktteilnehmer preisen 85% Wahrscheinlichkeit für unveränderte Zinsen ein.',
    source: 'Bloomberg News',
    publishedAt: Date.now() - 1000 * 60 * 3, // vor 3 Min
    symbols: ['EUR/USD', 'SPY', 'Gold'],
    sentiment: 'BULLISH',
    impact: 'HIGH',
    category: 'macro',
  },
  {
    id: 'news_2',
    headline: 'Bitcoin testet Widerstand bei $68.500 nach Zuflüssen in Spot-ETFs',
    summary: 'Institutionelle Zuflüsse in US-Spot-ETFs übersteigen $420 Mio. am Handelstag. On-Chain-Metriken zeigen deutliche Akkumulation durch Langzeithalter.',
    source: 'CoinDesk',
    publishedAt: Date.now() - 1000 * 60 * 8, // vor 8 Min
    symbols: ['BTC/USDT', 'ETH/USDT'],
    sentiment: 'BULLISH',
    impact: 'HIGH',
    category: 'crypto',
  },
  {
    id: 'news_3',
    headline: 'NVIDIA stellt neue KI-Beschleuniger-Architektur vor – Analysten heben Kursziele an',
    summary: 'Hohe Nachfrage nach Blackwell-Rechenzentrumschips treibt Umsatzprognosen für Q4. Morgan Stanley bekräftigt Overweight-Einstufung.',
    source: 'Reuters Financials',
    publishedAt: Date.now() - 1000 * 60 * 16,
    symbols: ['NVDA', 'SPY', 'AAPL'],
    sentiment: 'BULLISH',
    impact: 'HIGH',
    category: 'stock',
  },
  {
    id: 'news_4',
    headline: 'Gold hält sich stabil über $2.650 / Unze inmitten geopolitischer Spannungen',
    summary: 'Zentralbankkäufe und Suche nach sicheren Häfen stützen Edelmetalle trotz festerer Renditen zehnjähriger US-Staatsanleihen.',
    source: 'Financial Times',
    publishedAt: Date.now() - 1000 * 60 * 25,
    symbols: ['Gold', 'EUR/USD'],
    sentiment: 'BULLISH',
    impact: 'MEDIUM',
    category: 'commodities',
  },
  {
    id: 'news_5',
    headline: 'EZB warnt vor anhaltendem Dienstleistungs-Preisdruck im Euroraum',
    summary: 'Lagarde betont, dass künftige Zinssenkungen datenabhängig bleiben. Euro reagiert mit leichtem Aufwärtsdruck gegen US-Dollar.',
    source: 'Handelsblatt',
    publishedAt: Date.now() - 1000 * 60 * 35,
    symbols: ['EUR/USD', 'GBP/USD', 'EURAUD'],
    sentiment: 'NEUTRAL',
    impact: 'MEDIUM',
    category: 'forex',
  },
  {
    id: 'news_6',
    headline: 'Rohöl Brent fällt unter $78 – OPEC+ berät über Förderstrategie',
    summary: 'Nachfragesorgen in Asien und steigende Lagerbestände in den USA drücken auf die Notierungen der Nordseesorte Brent.',
    source: 'Wall Street Journal',
    publishedAt: Date.now() - 1000 * 60 * 48,
    symbols: ['BRENT'],
    sentiment: 'BEARISH',
    impact: 'HIGH',
    category: 'commodities',
  },
  {
    id: 'news_7',
    headline: 'Apple plant Ausbau von On-Device AI-Funktionen in kommendem iOS Update',
    summary: 'Zuliefererberichte deuten auf stärkere Chipausstattung für verbesserte Sprach- und Bildmodelle hin.',
    source: 'TechCrunch Markets',
    publishedAt: Date.now() - 1000 * 60 * 62,
    symbols: ['AAPL', 'SPY'],
    sentiment: 'BULLISH',
    impact: 'MEDIUM',
    category: 'stock',
  },
  {
    id: 'news_8',
    headline: 'Solana verzeichnet Allzeithoch bei täglichen Transaktionen und DEX-Volumen',
    summary: 'DeFi-Aktivität und Memecoin-Handel kurbeln Gebühreneinnahmen des Netzwerks kräftig an.',
    source: 'CoinTelegraph',
    publishedAt: Date.now() - 1000 * 60 * 80,
    symbols: ['SOL/USDT', 'ETH/USDT'],
    sentiment: 'BULLISH',
    impact: 'MEDIUM',
    category: 'crypto',
  },
  {
    id: 'news_9',
    headline: 'Australischer Dollar (AUD) profitiert von robusten Rohstoffexporten',
    summary: 'Eisenerz- und Kupferpreise stützen australische Leistungsbilanz. RBA signalisiert weiterhin restriktiven Kurs.',
    source: 'ForexLive',
    publishedAt: Date.now() - 1000 * 60 * 105,
    symbols: ['AUDUSD', 'EURAUD'],
    sentiment: 'BULLISH',
    impact: 'LOW',
    category: 'forex',
  },
  {
    id: 'news_10',
    headline: 'Tesla senkt Finanzierungskonditionen in Europa zur Ankurbelung der Auslieferungen',
    summary: 'Rabattaktionen und 0%-Leasing sollen Quartalszahlen stützen. Margendruck bleibt Fokus der Anleger.',
    source: 'Reuters',
    publishedAt: Date.now() - 1000 * 60 * 130,
    symbols: ['TSLA', 'SPY'],
    sentiment: 'NEUTRAL',
    impact: 'MEDIUM',
    category: 'stock',
  },
  {
    id: 'news_11',
    headline: 'EURAUD: Währungspaar konsolidiert nach hawkischen Tönen der EZB',
    summary: 'Händler beobachten Schlüsselmarken im Devisenmarkt. Volatilität nimmt im Vorfeld der geldpolitischen Entscheidungen zu.',
    source: 'FXStreet',
    publishedAt: Date.now() - 1000 * 60 * 155,
    symbols: ['EURAUD', 'AUDUSD'],
    sentiment: 'NEUTRAL',
    impact: 'MEDIUM',
    category: 'forex',
  },
];

class NewsService {
  private articles: NewsArticle[] = [...INITIAL_NEWS_DATABASE];

  /**
   * Fetches news articles with simulated network latency based on the currently selected asset
   */
  public async fetchNews(symbol?: string, category?: string): Promise<NewsArticle[]> {
    // Simulate real-world API delay (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    let results = [...this.articles];

    if (symbol && symbol !== 'ALL') {
      const cleanSym = symbol.toUpperCase().replace('/', '');
      results = results.filter((item) =>
        item.symbols.some((s) => s.toUpperCase().replace('/', '') === cleanSym || cleanSym.includes(s.toUpperCase().replace('/', ''))) ||
        item.headline.toUpperCase().includes(cleanSym)
      );

      // If we have fewer than 3 headlines for this specific symbol, synthesize realistic headlines tailored to this asset
      if (results.length < 3) {
        const generated = this.generateArticlesForSymbol(symbol);
        results = [...generated, ...results];
      }
    }

    if (category && category !== 'ALL') {
      results = results.filter((item) => item.category === category);
    }

    // Sort newest first
    return results.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  /**
   * Synthesizes symbol-specific headlines so every asset has tailored, informative headlines
   */
  private generateArticlesForSymbol(symbol: string): NewsArticle[] {
    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
    const isForex = symbol.includes('AUD') || symbol.includes('EUR') || symbol.includes('USD') || symbol.includes('GBP');
    const isCommodity = symbol.toLowerCase().includes('gold') || symbol.toLowerCase().includes('brent') || symbol.toLowerCase().includes('copper');
    const category = isCrypto ? 'crypto' : isForex ? 'forex' : isCommodity ? 'commodities' : 'stock';

    const now = Date.now();

    return [
      {
        id: `news_${symbol}_1`,
        headline: `${symbol}: Orderbuch zeigt signifikante Liquiditätscluster und institutionelle Aktivität`,
        summary: `Händler verzeichnen ein überdurchschnittliches Handelsvolumen bei ${symbol}. Analysten sehen positive charttechnische Signale im aktuellen Intraday-Zeitfenster.`,
        source: isCrypto ? 'CoinDesk' : isForex ? 'ForexLive' : 'Bloomberg',
        publishedAt: now - 1000 * 60 * 4,
        symbols: [symbol],
        sentiment: 'BULLISH',
        impact: 'HIGH',
        category,
      },
      {
        id: `news_${symbol}_2`,
        headline: `${symbol}: Momentum-Indikatoren testen wichtige Widerstands- und Unterstützungszonen`,
        summary: `Relative Strength Index (RSI) und MACD deuten auf eine temporäre Konsolidierung hin. Kurzfristige Volatilität bleibt im Fokus der Marktteilnehmer.`,
        source: 'Reuters Markets',
        publishedAt: now - 1000 * 60 * 22,
        symbols: [symbol],
        sentiment: 'NEUTRAL',
        impact: 'MEDIUM',
        category,
      },
      {
        id: `news_${symbol}_3`,
        headline: `${symbol}: Makroökonomische Daten und Zinsausblick beeinflussen Risikobereitschaft`,
        summary: `Globale Marktstimmung und Anleiherenditen setzen Impulse für ${symbol}. Risikomanagement und Stop-Loss-Disziplin bleiben entscheidend.`,
        source: 'Financial Times',
        publishedAt: now - 1000 * 60 * 55,
        symbols: [symbol],
        sentiment: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        impact: 'MEDIUM',
        category,
      },
    ];
  }

  /**
   * Generates a fresh dynamic live news item for the specified asset
   */
  public generateDynamicNews(symbol: string): NewsArticle {
    const sentiments: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];
    const chosenSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const sources = ['Bloomberg Live', 'Reuters Flash', 'ForexLive Radar', 'CoinDesk Alerts', 'Dow Jones'];
    const chosenSource = sources[Math.floor(Math.random() * sources.length)];

    let headline = '';
    let summary = '';

    if (chosenSentiment === 'BULLISH') {
      headline = `${symbol}: Kaufdruck zieht dynamisch an – Ausbruch über Intraday-Widerstand!`;
      summary = `Starkes Handelsvolumen treibt ${symbol} nach oben. Händler verzeichnen zunehmende Long-Positionierungen im Orderbuch.`;
    } else if (chosenSentiment === 'BEARISH') {
      headline = `${symbol}: Gewinnmitnahmen und Verkaufsdruck belasten aktuellen Kurs`;
      summary = `Nach starker Aufwärtsbewegung setzen Konsolidierungen bei ${symbol} ein. Vorsicht vor überhitzten technischen Indikatoren.`;
    } else {
      headline = `${symbol}: Seitwärtsphase – Händler warten auf frische fundamentale Impulse`;
      summary = `Enge Tagesspanne bei ${symbol}. Das Orderbuch signalisiert ein ausgewogenes Kräfteverhältnis zwischen Käufern und Verkäufern.`;
    }

    const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
    const isForex = symbol.includes('AUD') || symbol.includes('EUR') || symbol.includes('USD');
    const category = isCrypto ? 'crypto' : isForex ? 'forex' : 'stock';

    const newArticle: NewsArticle = {
      id: 'news_' + Math.random().toString(36).substring(2, 9),
      headline,
      summary,
      source: chosenSource,
      publishedAt: Date.now(),
      symbols: [symbol],
      sentiment: chosenSentiment,
      impact: Math.random() > 0.4 ? 'HIGH' : 'MEDIUM',
      category,
    };

    this.articles.unshift(newArticle);
    return newArticle;
  }
}

export const newsService = new NewsService();
