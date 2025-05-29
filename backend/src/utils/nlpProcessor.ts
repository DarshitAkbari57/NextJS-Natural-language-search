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
  remainingQuery?: string;
}

export async function parseNaturalLanguageQuery(query: string): Promise<SearchIntent> {
  try {
    let remainingQuery = query.toLowerCase();
    const intent: SearchIntent = {
      filters: {},
      confidence: {
        productType: 0.8,
        location: 0.8,
        priceRange: 0.8,
      },
      remainingQuery: query,
    };

    const removeMatchedText = (matchedText: string) => {
      const regex = new RegExp(matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      remainingQuery = remainingQuery.replace(regex, '').trim();
    };

    const productTypes = ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'hat', 'accessories'];
    for (const type of productTypes) {
      if (remainingQuery.includes(type)) {
        intent.productType = type;
        removeMatchedText(type);
        break;
      }
    }

    const locationPattern = /\b(in|at|near|from)\s+([a-zA-Z\s]+?)(?:\s|$)/i;
    const locationMatch = remainingQuery.match(locationPattern);
    if (locationMatch) {
      const fullMatch = locationMatch[0];
      intent.location = locationMatch[2].trim();
      removeMatchedText(fullMatch);
    }

    const pricePatterns = {
      under: /(?:under|less than|below)\s*(?:₹|Rs\.?)?\s*(\d+)(?:\s*\/\s*(\w+))?/i,
      over: /(?:over|more than|above)\s*(\d+)/i,
      between: /(?:between|from)\s*(\d+)\s*(?:and|to)\s*(\d+)/i,
      exact: /\$?\s*(\d+)(?:\s*(?:dollars|USD))?/i,
    };

    let priceMatched = false;

    for (const [type, pattern] of Object.entries(pricePatterns)) {
      const match = remainingQuery.match(pattern);
      if (match) {
        const fullMatch = match[0];
        if (type === 'under') {
          intent.priceRange = {
            max: parseInt(match[1]),
            unit: match[2] || 'USD',
            currency: 'INR',
          };
        } else if (type === 'over') {
          intent.priceRange = {
            min: parseInt(match[1]),
            unit: 'USD',
          };
        } else if (type === 'between') {
          intent.priceRange = {
            min: parseInt(match[1]),
            max: parseInt(match[2]),
            unit: 'USD',
          };
        } else if (type === 'exact') {
          const priceContext = remainingQuery.substring(
            Math.max(0, remainingQuery.indexOf(match[1]) - 20),
            Math.min(remainingQuery.length, remainingQuery.indexOf(match[1]) + 20),
          );
          if (!/(?:under|over|between|less than|more than|above|below)/i.test(priceContext)) {
            intent.priceRange = {
              min: parseInt(match[1]),
              max: parseInt(match[1]),
              unit: 'USD',
            };
          }
        }
        removeMatchedText(fullMatch);
        priceMatched = true;
        break;
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
      const match = remainingQuery.match(pattern);
      if (match) {
        const fullMatch = match[0];
        intent.filters[filterType] = fullMatch.toLowerCase();
        removeMatchedText(fullMatch);
      }
    }

    if (!intent.productType) intent.confidence.productType = 0.3;
    if (!intent.location) intent.confidence.location = 0.3;
    if (!intent.priceRange) intent.confidence.priceRange = 0.3;

    intent.remainingQuery = remainingQuery;

    return intent;
  } catch (error) {
    return fallbackRuleBasedParsing(query);
  }
}

function fallbackRuleBasedParsing(query: string): SearchIntent {
  return {
    filters: {},
    confidence: {
      productType: 0.5,
      location: 0.5,
      priceRange: 0.5,
    },
    remainingQuery: query,
  };
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
