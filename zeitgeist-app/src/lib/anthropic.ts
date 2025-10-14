import Anthropic from '@anthropic-ai/sdk';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData, 
  StockAnalysis,
  StockAPIError 
} from '@/types/stock';

// Interface for parsed analysis data from Claude
interface ParsedAnalysisData {
  ticker?: string;
  company_name?: string;
  analysis_timestamp?: string;
  model_used?: string;
  summary?: string;
  recommendation?: string;
  confidence_score?: number;
  technical_analysis?: {
    trend?: string;
    support_levels?: number[];
    resistance_levels?: number[];
    key_indicators?: string;
    short_term_outlook?: string;
  };
  fundamental_analysis?: {
    valuation?: string;
    financial_health?: string;
    growth_prospects?: string;
    competitive_position?: string;
  };
  sentiment_analysis?: {
    market_sentiment?: string;
    news_sentiment?: string;
  };
  risk_factors?: string[];
  risk_level?: string;
  price_targets?: {
    short_term?: number;
    medium_term?: number;
    long_term?: number;
  };
  key_metrics?: {
    pe_ratio?: number;
    market_cap?: number;
    revenue_growth?: number;
    profit_margin?: number;
  };
  catalysts?: string[];
  concerns?: string[];
  comparable_companies?: string[];
  raw_analysis?: string;
}

// Anthropic client will be initialized when needed

// Get the model from environment or default to Claude Sonnet 4.5
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

// Note: API key validation is done at runtime in the API routes
// to allow builds to succeed without environment variables

/**
 * Creates a comprehensive prompt for stock analysis
 */
function createStockAnalysisPrompt(
  stockData: StockData,
  companyDetails?: CompanyDetails,
  priceHistory?: StockPriceData[]
): string {
  const historyContext = priceHistory && priceHistory.length > 0 
    ? `\n\n**30-Day Price History:**
${priceHistory.slice(-10).map(day => 
  `${day.date}: Open $${day.open.toFixed(2)}, Close $${day.close.toFixed(2)}, Volume ${day.volume.toLocaleString()}`
).join('\n')}`
    : '';

  const companyContext = companyDetails 
    ? `\n\n**Company Information:**
- Name: ${companyDetails.name}
- Description: ${companyDetails.description || 'N/A'}
- Market Cap: ${companyDetails.market_cap ? `$${(companyDetails.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
- Employees: ${companyDetails.total_employees?.toLocaleString() || 'N/A'}
- Industry: ${companyDetails.sic_description || 'N/A'}`
    : '';

  return `You are a professional financial analyst with expertise in stock market analysis. Analyze the following stock data and provide a comprehensive investment analysis.

**Stock Information:**
- Ticker: ${stockData.ticker}
- Company: ${stockData.name}
- Current Price: $${stockData.price.toFixed(2)}
- Change: ${stockData.change >= 0 ? '+' : ''}$${stockData.change.toFixed(2)} (${stockData.change_percent.toFixed(2)}%)
- Previous Close: $${stockData.previous_close.toFixed(2)}
- Daily Range: $${stockData.low.toFixed(2)} - $${stockData.high.toFixed(2)}
- Volume: ${stockData.volume.toLocaleString()}
- VWAP: ${stockData.volume_weighted_average_price ? `$${stockData.volume_weighted_average_price.toFixed(2)}` : 'N/A'}
- Market Status: ${stockData.market_status}${companyContext}${historyContext}

**Analysis Requirements:**
Please provide a structured analysis that includes:

1. **Overall Assessment**: A clear summary of your investment recommendation
2. **Technical Analysis**: Chart patterns, support/resistance levels, trend analysis
3. **Fundamental Analysis**: Company valuation, financial health, growth prospects
4. **Risk Assessment**: Key risk factors and overall risk level
5. **Price Targets**: Short-term (1-3 months), medium-term (3-12 months), and long-term (1+ years) price projections
6. **Investment Recommendation**: One of: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL

**Response Format:**
Please respond with ONLY a JSON object that matches this exact structure. Do not include any additional text before or after the JSON:

{
  "ticker": "${stockData.ticker}",
  "company_name": "${stockData.name}",
  "analysis_timestamp": "${new Date().toISOString()}",
  "model_used": "${MODEL}",
  "summary": "Brief 2-3 sentence overall assessment",
  "recommendation": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence_score": 75,
  "technical_analysis": {
    "trend": "BULLISH|BEARISH|NEUTRAL",
    "support_levels": [150.00, 145.00],
    "resistance_levels": [160.00, 165.00],
    "key_indicators": "Description of technical indicators",
    "short_term_outlook": "Short-term technical outlook"
  },
  "fundamental_analysis": {
    "valuation": "UNDERVALUED|FAIRLY_VALUED|OVERVALUED",
    "financial_health": "Assessment of financial health",
    "growth_prospects": "Growth potential analysis",
    "competitive_position": "Market position assessment"
  },
  "sentiment_analysis": {
    "market_sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
    "news_sentiment": "Current news sentiment analysis"
  },
  "risk_factors": ["Risk factor 1", "Risk factor 2", "Risk factor 3"],
  "risk_level": "LOW|MEDIUM|HIGH",
  "price_targets": {
    "short_term": 150.00,
    "medium_term": 175.00,
    "long_term": 200.00
  },
  "key_metrics": {
    "pe_ratio": null,
    "market_cap": null,
    "revenue_growth": null,
    "profit_margin": null
  },
  "catalysts": ["Positive catalyst 1", "Positive catalyst 2"],
  "concerns": ["Concern 1", "Concern 2"],
  "comparable_companies": ["COMP1", "COMP2", "COMP3"],
  "raw_analysis": "Detailed narrative analysis for display to user"
}

Ensure all numerical values are realistic and based on the provided data. The confidence_score should be between 0-100. Price targets should be reasonable projections based on current price and market conditions.`;
}

/**
 * Analyzes stock data using Anthropic Claude Sonnet 4.5
 */
export async function analyzeStockData(
  stockData: StockData,
  companyDetails?: CompanyDetails,
  priceHistory?: StockPriceData[]
): Promise<StockAnalysis> {
  try {
    // Initialize Anthropic client
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 60000, // 60 second timeout to prevent long hangs
    });
    
    const prompt = createStockAnalysisPrompt(stockData, companyDetails, priceHistory);
    
    // Make the API call to Anthropic Claude
    const completion = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0.1, // Very low temperature for consistent JSON formatting
      system: 'You are a professional financial analyst. Provide accurate, objective stock analysis based on the data provided. CRITICAL: You must respond with ONLY valid JSON in the exact format requested. Do not include any text before or after the JSON object. Do not use markdown code blocks.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseContent = completion.content[0];
    
    if (!responseContent || responseContent.type !== 'text') {
      throw new Error('No response content received from Anthropic');
    }

    // Parse the JSON response
    let analysisData: ParsedAnalysisData;
    try {
      // Clean the response text - sometimes AI adds markdown code blocks
      let cleanedResponse = responseContent.text.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON within the response if there's extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      analysisData = JSON.parse(cleanedResponse) as ParsedAnalysisData;
    } catch (parseError) {
      console.error('Failed to parse Anthropic response as JSON. Raw response:', responseContent.text);
      console.error('Parse error:', parseError);
      throw new Error('Invalid JSON response from Anthropic API');
    }

    // Validate and structure the response
    const analysis: StockAnalysis = {
      ticker: (analysisData.ticker as string) || stockData.ticker,
      company_name: (analysisData.company_name as string) || stockData.name,
      analysis_timestamp: (analysisData.analysis_timestamp as string) || new Date().toISOString(),
      model_used: (analysisData.model_used as string) || MODEL,
      
      summary: (analysisData.summary as string) || 'Analysis summary not available',
      recommendation: (analysisData.recommendation as 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL') || 'HOLD',
      confidence_score: Math.min(100, Math.max(0, (analysisData.confidence_score as number) || 50)),
      
      technical_analysis: {
        trend: (analysisData.technical_analysis?.trend as 'BULLISH' | 'BEARISH' | 'NEUTRAL') || 'NEUTRAL',
        support_levels: Array.isArray(analysisData.technical_analysis?.support_levels) 
          ? analysisData.technical_analysis.support_levels.slice(0, 3)
          : [],
        resistance_levels: Array.isArray(analysisData.technical_analysis?.resistance_levels)
          ? analysisData.technical_analysis.resistance_levels.slice(0, 3)
          : [],
        key_indicators: analysisData.technical_analysis?.key_indicators || 'No technical indicators available',
        short_term_outlook: analysisData.technical_analysis?.short_term_outlook || 'Neutral outlook'
      },
      
      fundamental_analysis: {
        valuation: (analysisData.fundamental_analysis?.valuation as 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED') || 'FAIRLY_VALUED',
        financial_health: analysisData.fundamental_analysis?.financial_health || 'Assessment not available',
        growth_prospects: analysisData.fundamental_analysis?.growth_prospects || 'Growth prospects unclear',
        competitive_position: analysisData.fundamental_analysis?.competitive_position || 'Position assessment not available'
      },
      
      sentiment_analysis: {
        market_sentiment: (analysisData.sentiment_analysis?.market_sentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL') || 'NEUTRAL',
        news_sentiment: analysisData.sentiment_analysis?.news_sentiment || 'Sentiment analysis not available'
      },
      
      risk_factors: Array.isArray(analysisData.risk_factors) 
        ? (analysisData.risk_factors as string[]).slice(0, 5)
        : ['Market volatility', 'Economic uncertainty'],
      risk_level: (analysisData.risk_level as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
      
      price_targets: {
        short_term: analysisData.price_targets?.short_term || stockData.price * 1.05,
        medium_term: analysisData.price_targets?.medium_term || stockData.price * 1.10,
        long_term: analysisData.price_targets?.long_term || stockData.price * 1.15
      },
      
      key_metrics: {
        pe_ratio: analysisData.key_metrics?.pe_ratio || undefined,
        market_cap: analysisData.key_metrics?.market_cap || companyDetails?.market_cap || undefined,
        revenue_growth: analysisData.key_metrics?.revenue_growth || undefined,
        profit_margin: analysisData.key_metrics?.profit_margin || undefined
      },
      
      catalysts: Array.isArray(analysisData.catalysts) 
        ? (analysisData.catalysts as string[]).slice(0, 5)
        : [],
      concerns: Array.isArray(analysisData.concerns)
        ? (analysisData.concerns as string[]).slice(0, 5)
        : [],
      comparable_companies: Array.isArray(analysisData.comparable_companies)
        ? (analysisData.comparable_companies as string[]).slice(0, 5)
        : [],
      
      raw_analysis: (analysisData.raw_analysis as string) || (analysisData.summary as string) || 'Detailed analysis not available'
    };

    return analysis;
    
  } catch (error) {
    console.error('Error in Anthropic stock analysis:', error);
    
    // Handle specific Anthropic API errors with detailed logging
    let errorMessage = 'Unknown error occurred during analysis';
    
    if (error instanceof Error) {
      console.log(`Anthropic API Error Details: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        errorMessage = 'Invalid Anthropic API key - please check your API key configuration';
      } else if (error.message.includes('403')) {
        errorMessage = 'Anthropic API access forbidden - check your subscription and permissions';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'Anthropic API rate limit exceeded - please try again in a few moments';
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'Anthropic API quota exceeded - check your billing and usage limits';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Anthropic API request timed out - please try again';
      } else if (error.message.includes('model') || error.message.includes('does not exist')) {
        errorMessage = `Anthropic model "${MODEL}" not available - please update model configuration`;
      } else if (error.message.includes('Invalid JSON')) {
        errorMessage = 'Anthropic returned invalid response format - retrying may help';
      } else {
        errorMessage = `Anthropic API error: ${error.message}`;
      }
    }
    
    console.warn(`Falling back to basic analysis due to: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Validates Anthropic API configuration
 */
export async function validateAnthropicConfig(): Promise<boolean> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return false;
    }
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 60000, // 60 second timeout to prevent long hangs
    });
    
    // Make a minimal API call to test configuration
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test' }]
    });
    return response.content.length > 0;
  } catch (error) {
    console.error('Anthropic configuration validation failed:', error);
    return false;
  }
}

/**
 * Estimates token count for a prompt (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Checks if a prompt would exceed token limits
 */
export function checkTokenLimits(prompt: string, maxTokens: number = 4000): { withinLimits: boolean; estimatedTokens: number } {
  const estimatedTokens = estimateTokenCount(prompt);
  return {
    withinLimits: estimatedTokens <= maxTokens,
    estimatedTokens
  };
}

/**
 * DO NOT USE - Fallback analysis removed to prevent misleading users
 * This function has been removed to ensure transparency when AI analysis is unavailable
 */
export function createFallbackAnalysis(): never {
  throw new Error('AI analysis service unavailable - fallback analysis disabled to prevent misleading users');
}

/**
 * Utility function to create API error objects
 */
export function createAnthropicError(message: string, statusCode?: number): StockAPIError {
  return {
    error: 'ANTHROPIC_API_ERROR',
    message,
    status_code: statusCode,
    details: 'Error occurred while analyzing stock data with AI'
  };
}