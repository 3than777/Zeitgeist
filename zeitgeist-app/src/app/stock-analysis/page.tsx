import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, TrendingUp, BarChart3, Brain, Home } from "lucide-react";
import Navigation from "@/components/navigation";
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

// Breadcrumb Component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
      <Link 
        href="/" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">Stock Analysis</span>
    </nav>
  );
}

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
          <div key={index} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
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
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              AI-Powered Stock Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">Zeitgeist</span>
                </div>
                <p className="text-muted-foreground text-sm max-w-md">
                  AI-powered stock analysis platform providing comprehensive investment insights 
                  with real-time data and advanced analytics.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Real-time Stock Data</li>
                  <li>AI Analysis</li>
                  <li>Technical Indicators</li>
                  <li>Price Predictions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/stock-analysis" className="hover:text-foreground transition-colors">
                      Stock Analysis
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">
                © 2024 Zeitgeist AI. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <p className="text-xs text-muted-foreground">
                  Data provided by Polygon.io • Analysis by OpenAI • Not financial advice
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

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