export default function Features() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      sketch: '/assets/feature-1-sketch.svg',
      title: 'Intelligent Insights',
      description: 'AI analyzes customer patterns, predicts needs, and surfaces actionable opportunities before you ask.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      sketch: '/assets/feature-2-sketch.svg',
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks, route leads intelligently, and let AI handle follow-ups while you focus on closing.'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      sketch: '/assets/feature-1-sketch.svg',
      title: 'Smart Communication',
      description: 'Generate context-aware responses, sentiment analysis, and personalized outreach at scale with AI assistance.'
    }
  ]

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4">
            Built for the AI Era
          </h2>
          <p className="text-lg text-neutral-600">
            Every feature designed to multiply your team's effectiveness through intelligent automation and predictive insights.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card p-8 group hover:border-accent/50 transition-all duration-300 relative overflow-hidden"
            >
              {/* Background sketch */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-300" aria-hidden="true">
                <img src={feature.sketch} alt="" className="w-full h-full object-contain" />
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition-all duration-300 relative z-10">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-display font-bold text-primary mb-3 relative z-10">
                {feature.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed relative z-10">
                {feature.description}
              </p>

              {/* Arrow link */}
              <div className="mt-6 relative z-10">
                <a 
                  href="#" 
                  className="inline-flex items-center text-accent font-medium group-hover:gap-2 transition-all duration-200"
                  aria-label={`Learn more about ${feature.title}`}
                >
                  Learn more
                  <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}