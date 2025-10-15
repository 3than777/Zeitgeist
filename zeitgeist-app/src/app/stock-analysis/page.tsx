import type { Metadata } from "next";
import { TrendingUp, BarChart3, Brain } from "lucide-react";
import StockAnalysisContainer from "@/components/stock-analysis-container";

// SEO Metadata
export const metadata: Metadata = {
  title: "Stock Analysis - AI-Powered Investment Insights | Zeitgeist",
  description: "Get comprehensive AI-powered stock analysis with real-time data, technical indicators, fundamental analysis, and investment recommendations. Free stock analysis tool powered by advanced AI.",
  keywords: [
    "stock analysis",
    "AI stock advisor", 
    "investment analysis",
    "stock market insights",
    "financial analysis",
    "stock research",
    "investment recommendations",
    "technical analysis",
    "fundamental analysis",
    "stock price prediction"
  ],
  authors: [{ name: "Zeitgeist AI" }],
  creator: "Zeitgeist AI",
  publisher: "Zeitgeist AI",
  robots: "index, follow",
  openGraph: {
    title: "AI-Powered Stock Analysis | Zeitgeist",
    description: "Get comprehensive stock analysis with real-time data and AI insights. Analyze any stock with advanced technical and fundamental analysis.",
    url: "https://zeitgeist.ai/stock-analysis",
    siteName: "Zeitgeist",
    images: [
      {
        url: "/og-stock-analysis.png", // You would create this OG image
        width: 1200,
        height: 630,
        alt: "Zeitgeist AI Stock Analysis Tool"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered Stock Analysis | Zeitgeist", 
    description: "Get comprehensive stock analysis with real-time data and AI insights.",
    images: ["/twitter-stock-analysis.png"], // You would create this Twitter card image
    creator: "@zeitgeist_ai"
  },
  alternates: {
    canonical: "https://zeitgeist.ai/stock-analysis"
  }
};

// Feature highlights component
function FeatureHighlights() {
  const features = [
    {
      icon: TrendingUp,
      title: "Real-Time Data",
      description: "Live stock prices and market data"
    },
    {
      icon: BarChart3, 
      title: "Technical Analysis",
      description: "Charts, trends, and indicators"
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Smart analysis and recommendations"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {features.map((feature, index) => {
        const IconComponent = feature.icon;
        return (
          <div key={index} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-foreground">{feature.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StockAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              AI-Powered Stock Analysis
            </h1>
            <p className="text-xl text-foreground max-w-3xl mx-auto">
              Get comprehensive analysis of any publicly traded stock with real-time data, 
              technical indicators, fundamental analysis, and AI-powered investment insights.
            </p>
          </div>

          {/* Feature Highlights */}
          <FeatureHighlights />
          
          {/* Stock Analysis Container */}
          <StockAnalysisContainer 
            autoFocus={true}
            showWelcome={false}
            className="mb-12"
          />
        </div>
      </main>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Zeitgeist Stock Analysis",
            "description": "AI-powered stock analysis platform with real-time data and investment insights",
            "url": "https://zeitgeist.ai/stock-analysis", 
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Real-time stock data",
              "AI-powered analysis", 
              "Technical analysis",
              "Fundamental analysis",
              "Investment recommendations",
              "Price charts",
              "Risk assessment"
            ],
            "publisher": {
              "@type": "Organization",
              "name": "Zeitgeist AI"
            }
          })
        }}
      />
    </div>
  );
}