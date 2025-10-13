import { OpenAI } from 'openai';
import { 
  StockData, 
  CompanyDetails, 
  StockPriceData, 
  StockAnalysis,
  StockAPIError 
} from '@/types/stock';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get the model from environment or default to GPT-4
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

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
Please respond with a JSON object that matches this exact structure:
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
    "support_levels": [price1, price2],
    "resistance_levels": [price1, price2],
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
    "market_cap": ${companyDetails?.market_cap || null},
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
 * Analyzes stock data using OpenAI GPT-5
 */
export async function analyzeStockData(
  stockData: StockData,
  companyDetails?: CompanyDetails,
  priceHistory?: StockPriceData[]
): Promise<StockAnalysis> {
  try {
    const prompt = createStockAnalysisPrompt(stockData, companyDetails, priceHistory);
    
    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial analyst. Provide accurate, objective stock analysis based on the data provided. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent, factual analysis
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content received from OpenAI');
    }

    // Parse the JSON response
    let analysisData: any;
    try {
      analysisData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', responseContent);
      throw new Error('Invalid JSON response from OpenAI API');
    }

    // Validate and structure the response
    const analysis: StockAnalysis = {
      ticker: analysisData.ticker || stockData.ticker,
      company_name: analysisData.company_name || stockData.name,
      analysis_timestamp: analysisData.analysis_timestamp || new Date().toISOString(),
      model_used: analysisData.model_used || MODEL,
      
      summary: analysisData.summary || 'Analysis summary not available',
      recommendation: analysisData.recommendation || 'HOLD',
      confidence_score: Math.min(100, Math.max(0, analysisData.confidence_score || 50)),
      
      technical_analysis: {
        trend: analysisData.technical_analysis?.trend || 'NEUTRAL',
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
        valuation: analysisData.fundamental_analysis?.valuation || 'FAIRLY_VALUED',
        financial_health: analysisData.fundamental_analysis?.financial_health || 'Assessment not available',
        growth_prospects: analysisData.fundamental_analysis?.growth_prospects || 'Growth prospects unclear',
        competitive_position: analysisData.fundamental_analysis?.competitive_position || 'Position assessment not available'
      },
      
      sentiment_analysis: {
        market_sentiment: analysisData.sentiment_analysis?.market_sentiment || 'NEUTRAL',
        news_sentiment: analysisData.sentiment_analysis?.news_sentiment || 'Sentiment analysis not available'
      },
      
      risk_factors: Array.isArray(analysisData.risk_factors) 
        ? analysisData.risk_factors.slice(0, 5)
        : ['Market volatility', 'Economic uncertainty'],
      risk_level: analysisData.risk_level || 'MEDIUM',
      
      price_targets: {
        short_term: analysisData.price_targets?.short_term || stockData.price * 1.05,
        medium_term: analysisData.price_targets?.medium_term || stockData.price * 1.10,
        long_term: analysisData.price_targets?.long_term || stockData.price * 1.15
      },
      
      key_metrics: {
        pe_ratio: analysisData.key_metrics?.pe_ratio || null,
        market_cap: analysisData.key_metrics?.market_cap || companyDetails?.market_cap || null,
        revenue_growth: analysisData.key_metrics?.revenue_growth || null,
        profit_margin: analysisData.key_metrics?.profit_margin || null
      },
      
      catalysts: Array.isArray(analysisData.catalysts) 
        ? analysisData.catalysts.slice(0, 5)
        : [],
      concerns: Array.isArray(analysisData.concerns)
        ? analysisData.concerns.slice(0, 5)
        : [],
      comparable_companies: Array.isArray(analysisData.comparable_companies)
        ? analysisData.comparable_companies.slice(0, 5)
        : [],
      
      raw_analysis: analysisData.raw_analysis || analysisData.summary || 'Detailed analysis not available'
    };

    return analysis;
    
  } catch (error) {
    console.error('Error in OpenAI stock analysis:', error);
    
    // Handle specific OpenAI API errors with detailed logging
    let errorMessage = 'Unknown error occurred during analysis';
    
    if (error instanceof Error) {
      console.log(`OpenAI API Error Details: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        errorMessage = 'Invalid OpenAI API key - please check your API key configuration';
      } else if (error.message.includes('403')) {
        errorMessage = 'OpenAI API access forbidden - check your subscription and permissions';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit exceeded - please try again in a few moments';
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'OpenAI API quota exceeded - check your billing and usage limits';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'OpenAI API request timed out - please try again';
      } else if (error.message.includes('model') || error.message.includes('does not exist')) {
        errorMessage = `OpenAI model "${MODEL}" not available - please update model configuration`;
      } else if (error.message.includes('Invalid JSON')) {
        errorMessage = 'OpenAI returned invalid response format - retrying may help';
      } else {
        errorMessage = `OpenAI API error: ${error.message}`;
      }
    }
    
    console.warn(`Falling back to basic analysis due to: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Validates OpenAI API configuration
 */
export async function validateOpenAIConfig(): Promise<boolean> {
  try {
    // Make a minimal API call to test configuration
    const response = await openai.models.list();
    return response.data.length > 0;
  } catch (error) {
    console.error('OpenAI configuration validation failed:', error);
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
export function createFallbackAnalysis(stockData: StockData): never {
  throw new Error('AI analysis service unavailable - fallback analysis disabled to prevent misleading users');
}

/**
 * Utility function to create API error objects
 */
export function createOpenAIError(message: string, statusCode?: number): StockAPIError {
  return {
    error: 'OPENAI_API_ERROR',
    message,
    status_code: statusCode,
    details: 'Error occurred while analyzing stock data with AI'
  };
}