export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-bg-secondary to-white">
      {/* Background Sketch */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <img 
          src="/assets/hero-sketch.svg" 
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium">AI-Powered Intelligence</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-primary mb-6 text-balance">
            Your Relationships,
            <span className="text-accent"> Amplified</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-neutral-700 mb-10 text-balance leading-relaxed">
            Mancrel transforms how you manage customer relationships with AI-driven insights, 
            intelligent automation, and seamless workflows that adapt to your business.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="btn-primary text-lg px-8 py-4 shadow-lg shadow-accent/20">
              Start Free Trial
              <svg className="inline-block ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button className="btn-secondary text-lg px-8 py-4">
              Watch Demo
              <svg className="inline-block ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary">94%</div>
              <div className="text-sm sm:text-base text-neutral-600 mt-1">Faster Response</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary">3.2x</div>
              <div className="text-sm sm:text-base text-neutral-600 mt-1">More Deals Closed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary">40h</div>
              <div className="text-sm sm:text-base text-neutral-600 mt-1">Saved Per Month</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}