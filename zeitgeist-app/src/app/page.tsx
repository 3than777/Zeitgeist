import { ShootingStarsAndStarsBackgroundDemo } from "@/components/shooting-stars-background-demo";
import { DottedGlowBackgroundDemoSecond } from "@/components/dotted-glow-background-demo";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, BarChart3, Brain, Target, Shield, Zap } from "lucide-react";

export default function Home() {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="bg-black">
      <ShootingStarsAndStarsBackgroundDemo />
      
      {/* Apple Carousel Section */}
      <div className="w-full h-full py-20 px-8 md:px-16">
        <h2 className="text-xl md:text-5xl font-bold text-neutral-200 dark:text-neutral-200 font-sans">
          Discover the power of Zeitgeist.
        </h2>
        <Carousel items={cards} />
      </div>

      {/* Featured Stock Analysis Section */}
      <div className="w-full py-20 px-8 md:px-16 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="text-sm text-blue-400 font-semibold uppercase tracking-wide">
              Featured Tool
            </span>
            <h2 className="text-3xl md:text-6xl font-bold text-neutral-100 mt-4 mb-6">
              Smart Stock Analysis
            </h2>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Make informed investment decisions with our AI-powered stock analysis platform. 
              Get real-time data, technical insights, and intelligent recommendations instantly.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <CardSpotlight className="bg-black border border-neutral-700 rounded-2xl p-8">
              <div className="flex justify-center mb-4 relative z-30">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full relative z-30">
                  <TrendingUp className="h-8 w-8 text-white relative z-30" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-3 relative z-20">
                Real-Time Analysis
              </h3>
              <p className="text-neutral-400 relative z-20">
                Live market data with instant AI analysis of price movements, trends, and patterns
              </p>
            </CardSpotlight>

            <CardSpotlight className="bg-black border border-neutral-700 rounded-2xl p-8">
              <div className="flex justify-center mb-4 relative z-30">
                <div className="p-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full relative z-30">
                  <Brain className="h-8 w-8 text-white relative z-30" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-3 relative z-20">
                AI-Powered Insights
              </h3>
              <p className="text-neutral-400 relative z-20">
                Advanced machine learning models provide comprehensive fundamental and technical analysis
              </p>
            </CardSpotlight>

            <CardSpotlight className="bg-black border border-neutral-700 rounded-2xl p-8">
              <div className="flex justify-center mb-4 relative z-30">
                <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full relative z-30">
                  <Target className="h-8 w-8 text-white relative z-30" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-neutral-100 mb-3 relative z-20">
                Smart Recommendations
              </h3>
              <p className="text-neutral-400 relative z-20">
                Actionable investment recommendations with risk assessment and price targets
              </p>
            </CardSpotlight>
          </div>

          {/* CTA Button */}
          <Link 
            href="/stock-analysis"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white font-bold px-12 py-4 rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <TrendingUp className="h-6 w-6" />
            Start Analyzing Stocks
          </Link>
          
          <div className="mt-6">
            <p className="text-neutral-500 text-sm">
              Try popular stocks: 
              <span className="ml-2">
                {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'].map((ticker, index) => (
                  <Link 
                    key={ticker}
                    href="/stock-analysis"
                    className="text-blue-400 hover:text-blue-300 transition-colors mx-1"
                  >
                    {ticker}{index < 4 ? ',' : ''}
                  </Link>
                ))}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Dotted Glow Background Section */}
      <div className="relative h-screen w-screen bg-black">
        <DottedGlowBackgroundDemoSecond />
      </div>
    </div>
  );
}

const DummyContent = () => {
  return (
    <>
      {[...new Array(3).fill(1)].map((_, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                The first rule of ultrathink is you do not talk about ultrathink.
              </span>{" "}
              Keep a journal, quickly jot down a grocery list, and take amazing
              class notes. Want to convert those notes to text? No problem.
              Ultrathink&apos;s handwriting recognition is incredible.
            </p>
            <Image
              src="https://assets.aceternity.com/macbook.png"
              alt="Macbook mockup"
              height={500}
              width={500}
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
            />
          </div>
        );
      })}
    </>
  );
};

const AIContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto mb-8">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Artificial Intelligence at your fingertips.
        </span>{" "}
        Experience the power of next-generation AI with Ultrathink. Our advanced
        machine learning models help you work smarter, not harder. From predictive
        text to intelligent automation, every feature is designed to adapt to your
        unique workflow.
      </p>
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
            Smart Suggestions
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Get context-aware recommendations powered by our proprietary AI engine.
            Whether you&apos;re writing code, composing emails, or brainstorming ideas,
            Ultrathink understands your intent.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
            Natural Language Processing
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Communicate naturally with your device. Ask questions, give commands,
            or dictate content in plain language. Our NLP technology makes
            interaction seamless and intuitive.
          </p>
        </div>
      </div>
      <Image
        src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="AI visualization"
        height={500}
        width={500}
        className="md:w-3/4 md:h-3/4 h-full w-full mx-auto object-contain mt-8 rounded-2xl"
      />
    </div>
  );
};

const ProductivityContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Transform the way you work.
        </span>{" "}
        Built for professionals who demand excellence. Ultrathink combines powerful
        task management, intelligent scheduling, and deep focus modes to help you
        achieve more in less time. Your productivity, amplified.
      </p>
      <div className="mt-12 grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-neutral-700 dark:text-neutral-200 mb-2">
            87%
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Average increase in task completion
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-neutral-700 dark:text-neutral-200 mb-2">
            3.5h
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Saved per week on average
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-neutral-700 dark:text-neutral-200 mb-2">
            99.9%
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Uptime guarantee
          </p>
        </div>
      </div>
      <div className="mt-12 bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
          Key Features
        </h3>
        <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
          <li>• Smart calendar integration with AI scheduling</li>
          <li>• Pomodoro timer with adaptive break suggestions</li>
          <li>• Cross-platform synchronization in real-time</li>
          <li>• Advanced analytics and productivity insights</li>
        </ul>
      </div>
    </div>
  );
};

const LaunchContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-bold text-neutral-700 dark:text-neutral-200 mb-4">
          Ultrathink Pro
        </h2>
        <p className="text-xl text-neutral-600 dark:text-neutral-400">
          Coming Spring 2024
        </p>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Reimagined from the ground up.
        </span>{" "}
        The new Ultrathink Pro features our most advanced processor yet, all-day
        battery life, and a stunning Retina display. Experience performance that
        pushes the boundaries of what&apos;s possible.
      </p>
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
          <h4 className="font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
            Basic
          </h4>
          <p className="text-3xl font-bold text-neutral-700 dark:text-neutral-200 mb-4">
            $999
          </p>
          <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <li>• 256GB Storage</li>
            <li>• 8GB Memory</li>
            <li>• M3 Chip</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl text-white">
          <h4 className="font-semibold mb-2">Pro</h4>
          <p className="text-3xl font-bold mb-4">$1,499</p>
          <ul className="space-y-1 text-sm">
            <li>• 512GB Storage</li>
            <li>• 16GB Memory</li>
            <li>• M3 Pro Chip</li>
          </ul>
        </div>
        <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
          <h4 className="font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
            Max
          </h4>
          <p className="text-3xl font-bold text-neutral-700 dark:text-neutral-200 mb-4">
            $2,499
          </p>
          <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <li>• 1TB Storage</li>
            <li>• 32GB Memory</li>
            <li>• M3 Max Chip</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const MindMapsContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Visualize your thoughts like never before.
        </span>{" "}
        Transform complex ideas into beautiful, interactive mind maps. Ultrathink&apos;s
        visual thinking tools help you brainstorm, plan, and organize with
        unprecedented clarity. Connect concepts, see patterns, and unlock creativity.
      </p>
      <div className="mt-12 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
              Infinite Canvas
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              No limits to your creativity. Our infinite canvas lets you expand
              your ideas in any direction. Zoom in for details, zoom out for the
              big picture. Your thoughts, unrestricted.
            </p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900 h-48 rounded-2xl flex items-center justify-center">
            <span className="text-6xl">🧠</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
              Smart Connections
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              AI-powered relationship mapping automatically suggests connections
              between your ideas. Watch as patterns emerge and insights unfold
              with intelligent linking algorithms.
            </p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-green-200 to-teal-200 dark:from-green-900 dark:to-teal-900 h-48 rounded-2xl flex items-center justify-center">
            <span className="text-6xl">🔗</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotographyContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Pro camera system. Pro results.
        </span>{" "}
        Capture life in stunning detail with our most advanced camera system yet.
        From computational photography to ProRAW capabilities, every shot is a
        masterpiece waiting to happen. Your vision, perfectly realized.
      </p>
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
              48MP Main Camera
            </h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Incredible detail in every shot with our high-resolution sensor and
              advanced image processing pipeline.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
              Night Mode Pro
            </h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Capture the night like never before. Advanced algorithms bring out
              details in the darkest scenes.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
              Cinematic Video
            </h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Record in 4K ProRes with depth-of-field transitions that rival
              professional cinema cameras.
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-200 to-orange-200 dark:from-yellow-900 dark:to-orange-900 rounded-2xl p-8 flex items-center justify-center">
          <div className="text-center">
            <span className="text-8xl mb-4 block">📸</span>
            <p className="text-neutral-700 dark:text-neutral-200 font-semibold">
              AI-Enhanced Photography
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12 bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
          Smart Features
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-neutral-600 dark:text-neutral-400">
          <div>• Object recognition & tracking</div>
          <div>• Real-time HDR processing</div>
          <div>• Advanced portrait lighting</div>
          <div>• Magic eraser tool</div>
        </div>
      </div>
    </div>
  );
};

const StockAnalysisContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto mb-8">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          AI-powered investment insights at your fingertips.
        </span>{" "}
        Get comprehensive stock analysis with real-time market data, technical indicators, 
        fundamental analysis, and intelligent investment recommendations. Make informed 
        decisions with advanced AI that processes market patterns and financial data instantly.
      </p>
      
      {/* Feature Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="text-center bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
            Real-Time Data
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Live market prices, volume, and trading data from reliable sources
          </p>
        </div>
        
        <div className="text-center bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
            AI Analysis
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Advanced machine learning models analyze patterns and market sentiment
          </p>
        </div>
        
        <div className="text-center bg-neutral-200 dark:bg-neutral-700 p-6 rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
            Smart Insights
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Actionable recommendations with confidence scores and risk assessment
          </p>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="space-y-6 mb-12">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
              Technical Analysis
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Interactive charts with support/resistance levels, trend analysis, and key technical indicators
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
              Risk Assessment
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Comprehensive risk analysis with detailed factor breakdowns and volatility metrics
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-700 dark:text-neutral-200 mb-1">
              Price Targets
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Short, medium, and long-term price projections based on comprehensive analysis
            </p>
          </div>
        </div>
      </div>

      {/* Call-to-Action */}
      <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-4">
          Start Analyzing Stocks Today
        </h3>
        <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
          Enter any stock ticker to get instant AI-powered analysis with real-time data, 
          charts, and investment insights. Completely free to use.
        </p>
        <Link 
          href="/stock-analysis"
          className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <TrendingUp className="h-5 w-5" />
          Try Stock Analysis
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          * Not financial advice. Data provided by Polygon.io. Analysis powered by Claude.
        </p>
      </div>
    </div>
  );
};

const HiringContent = () => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
      <div className="mb-8">
        <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">
          Now Hiring
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-700 dark:text-neutral-200 mt-2">
          Staff Software Engineer
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">
          San Francisco, CA • Full-time • $200k - $350k + equity
        </p>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-xl font-sans max-w-3xl mx-auto mb-8">
        <span className="font-bold text-neutral-700 dark:text-neutral-200">
          Join the team building the future.
        </span>{" "}
        We&apos;re looking for exceptional engineers who are passionate about creating
        products that millions love. If you thrive in ambiguity, love solving hard
        problems, and want to shape the future of productivity, we want to hear from you.
      </p>
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
            What you&apos;ll do
          </h3>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Lead architecture decisions for critical product features</li>
            <li>• Mentor junior engineers and foster a culture of excellence</li>
            <li>• Collaborate with product and design to ship delightful experiences</li>
            <li>• Own end-to-end delivery of complex technical projects</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
            What we&apos;re looking for
          </h3>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• 8+ years of software engineering experience</li>
            <li>• Deep expertise in React, TypeScript, and modern web technologies</li>
            <li>• Track record of shipping products at scale</li>
            <li>• Strong communication skills and technical leadership experience</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
            Why Ultrathink?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl">
              <span className="text-2xl mb-2 block">💰</span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Competitive compensation + meaningful equity
              </p>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl">
              <span className="text-2xl mb-2 block">🏥</span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Premium health, dental, and vision coverage
              </p>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl">
              <span className="text-2xl mb-2 block">🏖️</span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Unlimited PTO + sabbatical program
              </p>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl">
              <span className="text-2xl mb-2 block">🚀</span>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Work on cutting-edge technology
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

const data = [
  {
    category: "Stock Analysis",
    title: "AI-powered investment insights.",
    src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <StockAnalysisContent />,
  },
  {
    category: "Artificial Intelligence",
    title: "You can do more with ultrathink.",
    src: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=3556&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <AIContent />,
  },
  {
    category: "Productivity",
    title: "Enhance your productivity.",
    src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <ProductivityContent />,
  },
  {
    category: "Product",
    title: "Launching the new ultrathink.",
    src: "https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <LaunchContent />,
  },

  {
    category: "Product",
    title: "Maps for your mind.",
    src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <MindMapsContent />,
  },
  {
    category: "iOS",
    title: "Photography just got better.",
    src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <PhotographyContent />,
  },
  {
    category: "Hiring",
    title: "Hiring for a Staff Software Engineer",
    src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: <HiringContent />,
  },
];
