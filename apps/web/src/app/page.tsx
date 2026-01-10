export default function HomePage() {
  return (
    <>
      {/* Tech Background Layers */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated Blobs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-[600px] h-[600px] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob delay-2000"></div>
        <div className="absolute -bottom-80 left-1/3 w-[800px] h-[800px] bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob delay-4000"></div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 tech-grid opacity-60"></div>

        {/* Tech Crosshairs */}
        <div className="absolute top-24 left-24 w-4 h-4 border-l border-t border-neutral-300"></div>
        <div className="absolute top-24 right-24 w-4 h-4 border-r border-t border-neutral-300"></div>
        <div className="absolute bottom-24 left-24 w-4 h-4 border-l border-b border-neutral-300"></div>
        <div className="absolute bottom-24 right-24 w-4 h-4 border-r border-b border-neutral-300"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-neutral-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center text-white">
            <iconify-icon
              icon="lucide:pencil-ruler"
              className="text-lg"
            ></iconify-icon>
          </div>
          <span className="font-bold tracking-tight text-lg font-sans">
            Nott<span className="text-accent font-sans">to</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 bg-white/50 px-6 py-2 rounded-full border border-neutral-200/50 shadow-sm">
          <a
            href="#"
            className="text-xs font-mono text-neutral-500 hover:text-accent transition-colors uppercase tracking-widest font-sans"
          >
            Features
          </a>
          <a
            href="#"
            className="text-xs font-mono text-neutral-500 hover:text-accent transition-colors uppercase tracking-widest font-sans"
          >
            Pricing
          </a>
          <a
            href="#"
            className="text-xs font-mono text-neutral-500 hover:text-accent transition-colors uppercase tracking-widest font-sans"
          >
            Docs
          </a>
        </div>
        <button className="hidden md:flex items-center gap-2 text-xs font-mono uppercase bg-neutral-900 text-white px-4 py-2 rounded hover:bg-neutral-800 transition-colors">
          <span className="font-sans">Get Extension</span>
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 pt-12 md:pt-20">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 bg-white border border-orange-100 shadow-sm rounded-full px-3 py-1 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest font-sans">
            Now Available for Chrome
          </span>
        </div>

        {/* Hero Text */}
        <div className="text-center max-w-6xl mx-auto mb-20 z-20 relative px-4">
          <h1 className="text-5xl md:text-8xl tracking-tight text-neutral-900 leading-[0.95] mb-6 reveal-text font-instrument-serif font-normal">
            Screenshot <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400 font-instrument-serif font-normal">
              Bug Reports
            </span>
          </h1>
          <p className="md:text-xl text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed font-sans">
            Capture, annotate, and share screenshots with{" "}
            <span className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded text-neutral-900 font-sans">
              one click
            </span>
            . Arrows, shapes, text annotations, and instant sharing for faster
            bug reporting.
          </p>

          {/* Code snippet decoration */}
          <div className="absolute -right-12 top-0 hidden lg:block opacity-20 font-mono text-[10px] text-left leading-tight font-sans">
            capture()
            <br />
            annotate.arrow
            <br />
            annotate.rect
            <br />
            share.link()
          </div>
        </div>

        {/* 3D Visualization Area */}
        <div className="relative w-full max-w-5xl mx-auto h-[600px] flex items-center justify-center perspective-container">
          {/* SVG Data Beams */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1000 600"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,0)"></stop>
                <stop offset="50%" stopColor="rgba(0,0,0,0.1)"></stop>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"></stop>
              </linearGradient>
            </defs>
            {/* Background static lines */}
            <path
              d="M 200 100 L 500 300 L 800 100"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              fill="none"
            ></path>
            <path
              d="M 200 500 L 500 300 L 800 500"
              stroke="url(#lineGrad)"
              strokeWidth="1"
              fill="none"
            ></path>
            {/* Animated Data Beams */}
            <path
              d="M 100 150 C 300 150, 400 250, 450 300"
              className="noodle-beam"
            ></path>
            <path
              d="M 900 450 C 700 450, 600 350, 550 300"
              className="noodle-beam"
              style={{ animationDelay: "-1s" }}
            ></path>
          </svg>

          {/* Orbital Rings Container (Rotated in 3D) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: "rotateX(60deg) rotateZ(-20deg)" }}
          >
            {/* Ring 1 */}
            <div className="orbit-ring orbit-1">
              <div className="orbit-planet"></div>
            </div>
            {/* Ring 2 */}
            <div className="orbit-ring orbit-2"></div>
            {/* Core Glow */}
            <div className="absolute w-64 h-64 bg-orange-500/20 rounded-full blur-[60px]"></div>
          </div>

          {/* Floating Data Card: Latency */}
          <div className="absolute top-10 left-4 md:left-20 flex flex-col gap-2 p-4 glass-panel rounded-xl z-20 w-48 border-l-2 border-accent transform transition-transform hover:scale-105 duration-300">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <iconify-icon icon="lucide:timer"></iconify-icon>
              <span className="font-sans">Capture Time</span>
            </div>
            <div className="text-2xl text-neutral-900 tracking-tight font-instrument-serif font-normal">
              0.3
              <span className="text-sm font-medium text-neutral-500 ml-1 font-sans">
                sec
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-1 mt-1 rounded-full overflow-hidden">
              <div className="bg-accent h-full w-[20%] animate-pulse"></div>
            </div>
          </div>

          {/* Floating Data Card: TVL */}
          <div className="absolute bottom-20 right-4 md:right-20 flex flex-col gap-2 p-4 glass-panel rounded-xl z-20 w-56 border-l-2 border-neutral-800 transform transition-transform hover:scale-105 duration-300">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <iconify-icon icon="lucide:image"></iconify-icon>
              <span className="font-sans">Screenshots Captured</span>
            </div>
            <div className="text-2xl text-neutral-900 tracking-tight font-instrument-serif font-normal">
              24.8
              <span className="text-sm font-medium text-neutral-500 ml-1 font-sans">
                K
              </span>
            </div>
            <div className="flex gap-1 mt-1">
              <div className="h-1 w-1 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-mono text-green-600 font-sans">
                +340 today
              </span>
            </div>
          </div>

          {/* The Phone Mockup */}
          <div className="phone-mockup relative w-[300px] h-[600px] bg-[#1a1a1a] rounded-[48px] border-[6px] border-[#2a2a2a] outline outline-1 outline-white/20 shadow-2xl z-30 flex flex-col overflow-hidden">
            {/* Hardware Details */}
            <div className="absolute -right-[7px] top-24 h-12 w-[6px] bg-[#333] rounded-r-md"></div>
            <div className="absolute -left-[7px] top-24 h-8 w-[6px] bg-[#333] rounded-l-md"></div>
            <div className="absolute -left-[7px] top-36 h-8 w-[6px] bg-[#333] rounded-l-md"></div>

            {/* Dynamic Island Area */}
            <div className="absolute top-0 w-full h-14 bg-black/40 z-50 flex justify-center pt-3 backdrop-blur-md">
              <div className="w-24 h-7 bg-black rounded-full flex items-center justify-between px-2">
                <div className="w-2 h-2 rounded-full bg-orange-600/80 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/80"></div>
              </div>
            </div>

            {/* Screen UI */}
            <div className="w-full h-full bg-neutral-50 flex flex-col relative pt-16 px-5 pb-6">
              {/* Header */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1 font-sans">
                    My Workspace
                  </p>
                  <h2 className="text-3xl text-neutral-900 tracking-tighter font-instrument-serif font-normal">
                    Bug Reports
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center">
                  <iconify-icon
                    icon="lucide:bell"
                    className="text-neutral-600"
                  ></iconify-icon>
                </div>
              </div>

              {/* Chart Mockup */}
              <div className="h-32 w-full mb-6 relative">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 45 C 20 45, 30 20, 50 25 S 70 5, 100 10"
                    fill="none"
                    stroke="#ff5500"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  ></path>
                  <path
                    d="M0 45 C 20 45, 30 20, 50 25 S 70 5, 100 10 V 50 H 0 Z"
                    fill="linear-gradient(to bottom, rgba(255,85,0,0.1), transparent)"
                    stroke="none"
                  ></path>
                </svg>
                {/* Hover Indicator */}
                <div className="absolute top-1/3 left-1/2 w-0.5 h-full bg-neutral-900/10 border-r border-dashed border-neutral-400"></div>
                <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full -translate-x-[5px] -translate-y-1.5 shadow-sm"></div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform">
                    <iconify-icon icon="lucide:camera"></iconify-icon>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-600 font-sans">
                    Capture
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                    <iconify-icon icon="lucide:pencil"></iconify-icon>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-600 font-sans">
                    Annotate
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                    <iconify-icon icon="lucide:share-2"></iconify-icon>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-600 font-sans">
                    Share
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform">
                    <iconify-icon icon="lucide:folder"></iconify-icon>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-600 font-sans">
                    Projects
                  </span>
                </button>
              </div>

              {/* Transaction List */}
              <div className="flex-1 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.02)] p-4 -mx-5 relative">
                <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4"></div>
                <div className="text-xs font-mono text-neutral-400 uppercase mb-3 font-sans">
                  Recent Captures
                </div>
                {/* Item 1 */}
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-accent flex items-center justify-center">
                      <iconify-icon icon="lucide:bug"></iconify-icon>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900 font-sans">
                        Login button broken
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono font-sans">
                        Dashboard • 2 min ago
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-orange-500 font-sans">
                    Open
                  </div>
                </div>
                {/* Item 2 */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <iconify-icon icon="lucide:check-circle"></iconify-icon>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900 font-sans">
                        UI alignment fix
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono font-sans">
                        Settings • Resolved
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-green-600 font-sans">
                    Done
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Tech Footer */}
      <div className="w-full border-t border-neutral-200 bg-white/80 backdrop-blur z-20">
        <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-sans">
                Extension Ready
              </span>
            </div>
            <h3 className="text-2xl mb-4 font-instrument-serif font-normal">
              Ready to capture bugs?
            </h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 font-sans"
              >
                <iconify-icon icon="lucide:chrome"></iconify-icon> Chrome
                Extension
              </a>
              <a
                href="#"
                className="bg-white border border-neutral-200 text-neutral-900 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-2 font-sans"
              >
                <iconify-icon icon="lucide:book-open"></iconify-icon>{" "}
                Documentation
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-neutral-100 bg-neutral-50/50 rounded-xl">
              <iconify-icon
                icon="lucide:mouse-pointer-click"
                className="text-2xl text-accent mb-2"
              ></iconify-icon>
              <div className="text-sm font-bold font-sans">
                One-Click Capture
              </div>
              <div className="text-xs text-neutral-500 mt-1 font-sans">
                Instant screenshots
              </div>
            </div>
            <div className="p-4 border border-neutral-100 bg-neutral-50/50 rounded-xl">
              <iconify-icon
                icon="lucide:shapes"
                className="text-2xl text-accent mb-2"
              ></iconify-icon>
              <div className="text-sm font-bold font-sans">
                Rich Annotations
              </div>
              <div className="text-xs text-neutral-500 mt-1 font-sans">
                Arrows, shapes, text
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
