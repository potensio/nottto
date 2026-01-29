"use client";
import { FlipWords } from "@/components/ui/flip-words";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const words = ["Linear", "Jira", "Asana", "ClickUp", "Anywhere"];
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      {/* Tech Background Layers */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-[600px] h-[600px] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob delay-2000"></div>
        <div className="absolute -bottom-80 left-1/3 w-[800px] h-[800px] bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob delay-4000"></div>
        <div className="absolute inset-0 tech-grid opacity-60"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-10 py-6 flex items-center justify-between border-b border-neutral-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 h-6 ">
          <img src="/notto-logo.png" alt="Description" className="h-full" />
        </div>
        {!isLoading && (
          <div className="hidden md:flex items-center gap-8 bg-white/50 px-6 py-2 rounded-full border border-neutral-200/50 shadow-sm">
            <a
              href={isAuthenticated ? "/dashboard" : "/auth"}
              className="text-xs font-mono text-neutral-500 hover:text-accent transition-colors uppercase tracking-widest"
            >
              {isAuthenticated ? "Dashboard" : "Login"}
            </a>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 pt-12 md:pt-16">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-white border border-red-100 shadow-sm rounded-full px-3 py-1 animate-pulse">
          <iconify-icon
            icon="lucide:bug"
            className="text-accent text-xs"
          ></iconify-icon>
          <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">
            Faster QA Reporting
          </span>
        </div>

        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-10 z-20 relative px-4">
          <h1 className="text-5xl md:text-7xl tracking-tight text-neutral-900 leading-[0.95] mb-6 font-instrument-serif font-normal">
            Spot bugs. Annotate. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 font-instrument-serif font-normal">
              Push to{" "}
              <FlipWords
                words={words}
                duration={2500}
                className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 font-instrument-serif"
              />{" "}
              instantly.
            </span>
          </h1>
          <p className="md:text-lg text-neutral-500 max-w-2xl mx-auto mb-6 leading-relaxed font-manrope">
            The fastest way to report visual bugs. Use the{" "}
            <strong className="text-neutral-800 font-medium">
              annotation toolbar
            </strong>{" "}
            to draw rectangles, arrows, and text directly on your build, then
            sync with one click.
          </p>
          <button className="hidden md:flex items-center mx-auto gap-2 text-xs font-mono uppercase bg-neutral-900 text-white px-4 py-4 rounded hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/10">
            <span>Install Extension</span>
            <iconify-icon icon="lucide:download" width="14"></iconify-icon>
          </button>
        </div>

        {/* 3D Visualization Area */}
        <div className="relative w-full max-w-6xl mx-auto h-[600px] flex items-center justify-center perspective-container">
          {/* The Browser Mockup */}
          <div className="browser-mockup relative w-[95%] md:w-[800px] h-[500px] bg-white rounded-xl border border-neutral-200 shadow-2xl z-30 flex flex-col overflow-hidden ring-1 ring-black/5">
            {/* Browser Header */}
            <div className="h-10 bg-neutral-50 border-b border-neutral-200 flex items-center px-4 justify-between shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10"></div>
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10"></div>
              </div>
              <div className="bg-white border border-neutral-200 rounded px-3 py-1 flex items-center gap-2 w-2/3 shadow-sm mx-4">
                <iconify-icon
                  icon="lucide:lock"
                  className="text-neutral-400 text-[10px]"
                ></iconify-icon>
                <span className="text-[10px] text-neutral-400 font-mono">
                  staging.dashboard.com/billing
                </span>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-200"></div>
              </div>
            </div>

            {/* Webpage Content + Annotation Overlay */}
            <div className="flex-1 bg-white relative flex">
              {/* Page Body */}
              <div className="flex-1 relative bg-neutral-50/50 p-8 overflow-hidden">
                {/* Drawing Surface (SVG) */}
                <svg
                  className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                  style={{
                    filter: "drop-shadow(0px 4px 6px rgba(235, 59, 59, 0.2))",
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="6"
                      refX="7"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="#eb3b3b"></polygon>
                    </marker>
                  </defs>
                  {/* The Box Annotation */}
                  <rect
                    x="70"
                    y="55"
                    width="200"
                    height="70"
                    fill="rgba(235, 59, 59, 0.05)"
                    stroke="#eb3b3b"
                    strokeWidth="2"
                    className="draw-box"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></rect>
                  {/* Resize Handles */}
                  <g className="resize-handles">
                    <rect
                      x="66"
                      y="51"
                      width="8"
                      height="8"
                      fill="white"
                      stroke="#eb3b3b"
                      strokeWidth="1.5"
                    ></rect>
                    <rect
                      x="266"
                      y="51"
                      width="8"
                      height="8"
                      fill="white"
                      stroke="#eb3b3b"
                      strokeWidth="1.5"
                    ></rect>
                    <rect
                      x="266"
                      y="121"
                      width="8"
                      height="8"
                      fill="white"
                      stroke="#eb3b3b"
                      strokeWidth="1.5"
                    ></rect>
                    <rect
                      x="66"
                      y="121"
                      width="8"
                      height="8"
                      fill="white"
                      stroke="#eb3b3b"
                      strokeWidth="1.5"
                    ></rect>
                  </g>
                  {/* The Arrow Annotation */}
                  <path
                    d="M 285 90 L 345 90"
                    stroke="#eb3b3b"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="draw-arrow"
                    strokeLinecap="round"
                  ></path>
                  {/* Text Label */}
                  <foreignObject x="355" y="75" width="200" height="100">
                    <div className="annotation-text">
                      <div className="text-accent text-lg font-hand font-bold leading-none">
                        Check padding!
                      </div>
                    </div>
                  </foreignObject>
                </svg>

                {/* Mocked "Buggy" Content */}
                <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-neutral-200 shadow-sm opacity-90">
                  <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                    Upgrade Plan
                  </h2>
                  <p className="text-sm text-neutral-500 mb-6">
                    Choose the best plan for your team.
                  </p>
                  {/* The Bug: Misaligned Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1 (Normal) */}
                    <div className="border border-neutral-200 p-4 rounded-lg bg-neutral-50">
                      <div className="text-xs font-semibold text-neutral-500 uppercase">
                        Basic
                      </div>
                      <div className="text-2xl font-bold mt-2">$0</div>
                    </div>
                    {/* Card 2 (The Bug Target) */}
                    <div className="border border-indigo-100 p-4 rounded-lg bg-indigo-50/50 relative">
                      <div className="text-xs font-semibold text-indigo-500 uppercase">
                        Pro
                      </div>
                      <div className="text-2xl font-bold mt-2">$29</div>
                    </div>
                  </div>
                  <div className="mt-6 w-full h-10 bg-neutral-900 rounded flex items-center justify-center text-white text-sm font-medium">
                    Continue
                  </div>
                </div>

                {/* Mouse Cursor Simulation */}
                <div className="absolute top-0 left-0 z-50 cursor-sequence pointer-events-none drop-shadow-2xl">
                  <iconify-icon
                    icon="lucide:mouse-pointer-2"
                    className="text-black text-2xl"
                    style={{
                      transform: "rotate(-10deg)",
                      filter: "drop-shadow(2px 2px 0px rgba(255,255,255,1))",
                    }}
                  ></iconify-icon>
                </div>

                {/* Floating Annotation Tools Palette */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-neutral-400 rounded-full shadow-2xl px-2 py-2 flex items-center gap-1 z-40 border border-neutral-700/50">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                    <iconify-icon
                      icon="lucide:mouse-pointer-2"
                      width="18"
                    ></iconify-icon>
                  </button>
                  <div className="w-px h-4 bg-white/20 mx-1"></div>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all tool-active">
                    <iconify-icon
                      icon="lucide:square"
                      width="18"
                    ></iconify-icon>
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center transition-all tool-arrow-active">
                    <iconify-icon
                      icon="lucide:move-up-right"
                      width="18"
                    ></iconify-icon>
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                    <iconify-icon icon="lucide:type" width="18"></iconify-icon>
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-all">
                    <iconify-icon
                      icon="lucide:palette"
                      width="18"
                    ></iconify-icon>
                  </button>
                </div>
              </div>

              {/* Right Panel: Issue Creation Form */}
              <div className="w-64 bg-white border-l border-neutral-200 p-4 flex flex-col z-30 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    New Issue
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                      Title
                    </label>
                    <div className="text-xs font-medium text-neutral-800 bg-neutral-50 p-2 rounded border border-neutral-200 truncate">
                      Card padding broken
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                      Severity
                    </label>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded font-medium border border-red-200">
                        High
                      </span>
                      <span className="text-[10px] px-2 py-1 bg-neutral-100 text-neutral-500 rounded font-medium border border-neutral-200">
                        Visual
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                      Assignee
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">
                        AS
                      </div>
                      <span className="text-xs text-neutral-600">
                        Alex Smith
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <button className="w-full bg-[#5E6AD2] hover:bg-[#4b55be] text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                    <iconify-icon icon="simple-icons:linear"></iconify-icon>
                    Create Linear Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Context Footer */}
      <div className="w-full border-t border-neutral-200 bg-white/80 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 items-center gap-8">
          <div className="flex gap-6 items-center">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-900">
                Seamless Integration
              </span>
              <span className="text-xs text-neutral-500">
                Works with your existing stack
              </span>
            </div>
            <div className="h-8 w-px bg-neutral-200"></div>
            <div className="flex gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <iconify-icon
                icon="simple-icons:linear"
                className="text-xl"
              ></iconify-icon>
              <iconify-icon
                icon="simple-icons:jira"
                className="text-xl"
              ></iconify-icon>
              <iconify-icon
                icon="simple-icons:asana"
                className="text-xl"
              ></iconify-icon>
              <iconify-icon
                icon="simple-icons:slack"
                className="text-xl"
              ></iconify-icon>
              <iconify-icon
                icon="simple-icons:github"
                className="text-xl"
              ></iconify-icon>
            </div>
          </div>
          <div className="flex justify-end gap-6">
            <a
              href="/privacy"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
