PREDICTION_PROMPT = """
Analyze the following options data for {ticker} and provide a prediction:

CURRENT PRICE: ${current_price}
DATE: {date}

OPTIONS METRICS:
- Put/Call Ratio: {put_call_ratio}
- IV Rank: {iv_rank}%
- IV Percentile: {iv_percentile}%
- Total Volume: {total_volume}
- Open Interest: {open_interest}

TOP UNUSUAL OPTIONS ACTIVITY:
{unusual_activity}

GREEKS SUMMARY:
- Net Delta: {net_delta}
- Net Gamma: {net_gamma}
- Gamma Exposure: ${gamma_exposure}

VOLATILITY ANALYSIS:
- 30-day IV: {iv_30}%
- IV Skew: {iv_skew}
- Term Structure: {term_structure}

Based on this data, provide:
1. Direction prediction (bullish/bearish/neutral)
2. Price target for {timeframe}
3. Confidence level (1-10)
4. Key reasoning points
5. Risk factors

Format as JSON with the following structure:
{{
    "direction": "bullish|bearish|neutral",
    "price_target": float,
    "confidence": integer (1-10),
    "reasoning": ["reason1", "reason2", ...],
    "risk_factors": ["risk1", "risk2", ...]
}}
"""

ANALYSIS_PROMPT = """
Analyze the {analysis_type} data for {ticker}:

{data_section}

Provide a comprehensive analysis including:
1. Key observations
2. Market implications
3. Trading recommendations
4. Risk considerations

Format the response as JSON with clear structure.
"""

BATCH_ANALYSIS_PROMPT = """
Compare and analyze the following stocks based on their options data:

{stocks_data}

Provide:
1. Relative strength ranking
2. Best risk/reward opportunities
3. Sector trends if applicable
4. Recommended portfolio allocation

Format as structured JSON.
"""