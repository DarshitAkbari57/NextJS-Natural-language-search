interface SearchIntent {
  productType?: string;
  filters: {
    [key: string]: any;
  };
  location?: string;
  priceRange?: {
    min?: number;
    max?: number;
    unit?: string;
    currency?: string;
  };
  confidence: {
    [key: string]: number;
  };
}

export async function parseNaturalLanguageQuery(query: string): Promise<SearchIntent> {
  try {
    const normalizedQuery = query.toLowerCase();

    const intent: SearchIntent = {
      filters: {},
      confidence: {
        productType: 0.8,
        location: 0.8,
        priceRange: 0.8,
      },
    };

    const productTypes = ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'hat', 'accessories'];
    for (const type of productTypes) {
      if (normalizedQuery.includes(type)) {
        intent.productType = type;
        break;
      }
    }

    const locationPattern = /\b(in|at|near|from)\s+([a-zA-Z\s]+?)(?:\s|$)/i;
    const locationMatch = normalizedQuery.match(locationPattern);
    if (locationMatch) {
      intent.location = locationMatch[2].trim();
    }

    const pricePatterns = {
      under: /(?:under|less than|below)\s*(?:₹|Rs\.?)?\s*(\d+)(?:\s*\/\s*(\w+))?/i,
      over: /(?:over|more than|above)\s*(\d+)/i,
      between: /(?:between|from)\s*(\d+)\s*(?:and|to)\s*(\d+)/i,
      exact: /\$?\s*(\d+)(?:\s*(?:dollars|USD))?/i,
    };

    let priceMatched = false;

    if (pricePatterns.under.test(normalizedQuery)) {
      const match = normalizedQuery.match(pricePatterns.under);
      intent.priceRange = {
        max: parseInt(match![1]),
        unit: match![2] || 'USD',
        currency: 'INR',
      };
      priceMatched = true;
    } else if (pricePatterns.over.test(normalizedQuery)) {
      const match = normalizedQuery.match(pricePatterns.over);
      intent.priceRange = {
        min: parseInt(match![1]),
        unit: 'USD',
      };
      priceMatched = true;
    } else if (pricePatterns.between.test(normalizedQuery)) {
      const match = normalizedQuery.match(pricePatterns.between);
      intent.priceRange = {
        min: parseInt(match![1]),
        max: parseInt(match![2]),
        unit: 'USD',
      };
      priceMatched = true;
    } else if (!priceMatched && pricePatterns.exact.test(normalizedQuery)) {
      const match = normalizedQuery.match(pricePatterns.exact);
      const priceStr = match![1];
      const priceContext = normalizedQuery.substring(
        Math.max(0, normalizedQuery.indexOf(priceStr) - 20),
        Math.min(normalizedQuery.length, normalizedQuery.indexOf(priceStr) + 20),
      );

      if (!/(?:under|over|between|less than|more than|above|below)/i.test(priceContext)) {
        intent.priceRange = {
          min: parseInt(priceStr),
          max: parseInt(priceStr),
          unit: 'USD',
        };
      }
    }

    const filterPatterns = {
      color: /\b(red|blue|green|black|white|yellow|purple|pink|orange|brown|gray)\b/i,
      size: /\b(xs|s|m|l|xl|xxl|small|medium|large)\b/i,
      brand: /\b(nike|adidas|puma|gucci|zara|h&m|gap|levi's)\b/i,
      material: /\b(cotton|wool|silk|leather|denim|polyester|linen)\b/i,
      style: /\b(casual|formal|sport|vintage|modern|classic)\b/i,
    };

    for (const [filterType, pattern] of Object.entries(filterPatterns)) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        intent.filters[filterType] = match[0].toLowerCase();
      }
    }

    if (!intent.productType) intent.confidence.productType = 0.3;
    if (!intent.location) intent.confidence.location = 0.3;
    if (!intent.priceRange) intent.confidence.priceRange = 0.3;

    return intent;
  } catch (error) {
    console.error('Error parsing query:', error);
    return fallbackRuleBasedParsing(query);
  }
}

function fallbackRuleBasedParsing(query: string): SearchIntent {
  const intent: SearchIntent = {
    filters: {},
    confidence: {
      productType: 0.5,
      location: 0.5,
      priceRange: 0.5,
    },
  };
  return intent;
}

async function parseQuery(query: string): Promise<SearchIntent> {
  if (isSimpleQuery(query)) {
    return fallbackRuleBasedParsing(query);
  }

  try {
    return await parseNaturalLanguageQuery(query);
  } catch (error) {
    console.error('OpenAI parsing failed, falling back to rules:', error);
    return fallbackRuleBasedParsing(query);
  }
}

function isSimpleQuery(query: string): boolean {
  const simplePatterns = [/^price under \d+$/i, /^in [a-zA-Z]+$/i, /^organic [a-zA-Z]+$/i];
  return simplePatterns.some((pattern) => pattern.test(query));
}

type Unit = 'kg' | 'g' | 'ton';
type ConversionMap = Record<Unit, Record<Unit, number>>;

function getUnitConversionFactor(fromUnit: string, toUnit: string): number {
  const conversions: ConversionMap = {
    kg: { g: 0.001, ton: 1000, kg: 1 },
    g: { kg: 1000, ton: 1000000, g: 1 },
    ton: { kg: 0.001, g: 0.000001, ton: 1 },
  };
  return fromUnit in conversions && toUnit in conversions[fromUnit as Unit]
    ? conversions[fromUnit as Unit][toUnit as Unit]
    : 1;
}
