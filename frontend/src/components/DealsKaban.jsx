"use client"

import { useState } from 'react'

export default function DealsKanban() {
  // TODO: Replace with real state management (Redux, Zustand, or Context API)
  // TODO: Integrate with PATCH /api/deals/:id for drag-and-drop updates
  const [columns] = useState([
    {
      id: 'prospect',
      title: 'Prospecting',
      color: 'neutral',
      deals: [
        { id: 1, company: 'Acme Corp', value: '$45K', contact: 'John Smith', probability: 30 },
        { id: 2, company: 'Widget Inc', value: '$22K', contact: 'Jane Doe', probability: 25 }
      ]
    },
    {
      id: 'qualified',
      title: 'Qualified',
      color: 'accent',
      deals: [
        { id: 3, company: 'TechFlow', value: '$120K', contact: 'Sarah Chen', probability: 60 },
        { id: 4, company: 'Innovate Labs', value: '$85K', contact: 'Marcus Johnson', probability: 55 }
      ]
    },
    {
      id: 'proposal',
      title: 'Proposal',
      color: 'success',
      deals: [
        { id: 5, company: 'Global Solutions', value: '$200K', contact: 'Elena Rodriguez', probability: 80 }
      ]
    },
    {
      id: 'negotiation',
      title: 'Negotiation',
      color: 'accent',
      deals: [
        { id: 6, company: 'Enterprise Co', value: '$350K', contact: 'David Park', probability: 85 }
      ]
    }
  ]);

  return (
    <section id="deals" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4">
            Visual Deal Pipeline
          </h2>
          <p className="text-lg text-neutral-600">
            Drag, drop, and close. AI suggests next actions and predicts close probability for every deal.
          </p>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-6 min-w-full">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex-1 min-w-[280px] bg-bg-secondary rounded-xl p-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${column.color}`}></div>
                    <h3 className="font-display font-bold text-primary">
                      {column.title}
                    </h3>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-neutral-600 font-medium">
                      {column.deals.length}
                    </span>
                  </div>
                  <button
                    className="p-1 hover:bg-white rounded transition-colors duration-200"
                    aria-label={`Add deal to ${column.title}`}
                  >
                    <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Deals List */}
                <div className="space-y-3">
                  {column.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="card p-4 cursor-move hover:shadow-lg transition-shadow duration-200 group"
                      draggable="true"
                      role="article"
                      aria-label={`Deal with ${deal.company}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        // Keyboard accessibility for drag operations
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // TODO: Implement keyboard-based move dialog
                          console.log('Open move dialog for deal', deal.id);
                        }
                      }}
                    >
                      {/* Drag Handle */}
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-neutral-300 group-hover:text-accent transition-colors duration-200">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          {/* Company */}
                          <h4 className="font-display font-bold text-primary mb-1">
                            {deal.company}
                          </h4>
                          {/* Contact */}
                          <p className="text-sm text-neutral-600 mb-2">{deal.contact}</p>
                          {/* Value & Probability */}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-success">
                              {deal.value}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-neutral-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              {deal.probability}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Note */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>
            <kbd className="px-2 py-1 bg-neutral-100 rounded text-xs">Enter</kbd> or{' '}
            <kbd className="px-2 py-1 bg-neutral-100 rounded text-xs">Space</kbd> to move deals via keyboard
          </p>
        </div>
      </div>
    </section>
  );
}