"use client"

import { useState } from 'react'

export default function AIInbox() {
  // TODO: Replace with GET /api/inbox and real-time updates via WebSocket
  const [messages] = useState([
    {
      id: 1,
      from: 'Sarah Chen',
      company: 'TechFlow Inc.',
      subject: 'Re: Enterprise Plan Pricing',
      preview: 'Thanks for the detailed breakdown. We\'re interested in moving forward with the annual plan...',
      time: '10:45 AM',
      unread: true,
      sentiment: 'positive',
      aiSuggestion: {
        confidence: 92,
        text: 'Great news! I\'ll prepare the contract for the Enterprise Annual plan and send it over by EOD. Would Thursday work for a quick onboarding call?'
      }
    },
    {
      id: 2,
      from: 'Marcus Johnson',
      company: 'Innovate Labs',
      subject: 'Demo Follow-up Questions',
      preview: 'Hi, the demo was helpful but I have a few technical questions about the API integration...',
      time: '9:30 AM',
      unread: true,
      sentiment: 'neutral',
      aiSuggestion: {
        confidence: 85,
        text: 'Thanks for your questions! Our API supports RESTful endpoints with OAuth 2.0 authentication. I\'ll connect you with our solutions engineer who can provide detailed integration guidance.'
      }
    },
    {
      id: 3,
      from: 'Elena Rodriguez',
      company: 'Global Solutions',
      subject: 'Contract Review Concerns',
      preview: 'We\'ve reviewed the proposal and have some concerns about the data residency clauses...',
      time: 'Yesterday',
      unread: false,
      sentiment: 'concern',
      aiSuggestion: {
        confidence: 78,
        text: 'I understand your concerns about data residency. We offer region-specific hosting options. Let me schedule a call with our compliance team to address this properly.'
      }
    }
  ])

  const [selectedMessage, setSelectedMessage] = useState(messages[0])

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-success bg-success/10'
      case 'concern': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-neutral-500 bg-neutral-100'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      case 'concern':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    }
  }

  return (
    <section id="ai" className="py-24 px-4 sm:px-6 lg:px-8 bg-bg-secondary">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4">
            AI-Powered Inbox
          </h2>
          <p className="text-lg text-neutral-600">
            Never miss a signal. AI analyzes sentiment, suggests responses, and flags urgent opportunities in real-time.
          </p>
        </div>

        {/* Inbox Interface */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Message List */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="p-4 border-b border-neutral-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="input-field pl-10"
                  aria-label="Search messages"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors duration-200 ${
                    selectedMessage.id === message.id ? 'bg-accent/5 border-l-4 border-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${message.unread ? 'bg-accent' : 'bg-transparent'}`}></div>
                      <span className="font-display font-bold text-primary text-sm">
                        {message.from}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">{message.time}</span>
                  </div>
                  <p className="text-xs text-neutral-600 mb-2">{message.company}</p>
                  <p className="text-sm font-medium text-primary mb-1 truncate">
                    {message.subject}
                  </p>
                  <p className="text-sm text-neutral-600 line-clamp-2">
                    {message.preview}
                  </p>

                  {/* Sentiment Badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(message.sentiment)}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {getSentimentIcon(message.sentiment)}
                      </svg>
                      {message.sentiment}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Detail & AI Suggestion */}
          <div className="lg:col-span-3 space-y-6">
            {/* Message Content */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-primary mb-1">
                    {selectedMessage.from}
                  </h3>
                  <p className="text-sm text-neutral-600">{selectedMessage.company}</p>
                </div>
                <span className="text-sm text-neutral-500">{selectedMessage.time}</span>
              </div>

              <h4 className="text-lg font-medium text-primary mb-4">
                {selectedMessage.subject}
              </h4>

              <p className="text-neutral-700 leading-relaxed mb-6">
                {selectedMessage.preview} Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>

              <div className="flex gap-3">
                <button className="btn-secondary">
                  Reply
                </button>
                <button className="btn-secondary">
                  Forward
                </button>
                <button className="btn-secondary">
                  Archive
                </button>
              </div>
            </div>

            {/* AI Suggestion Panel */}
            <div className="card p-6 border-2 border-accent/20 bg-accent/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary">AI Suggested Response</h4>
                    <p className="text-sm text-neutral-600">Based on context and sentiment analysis</p>
                  </div>
                </div>

                {/* Confidence Badge */}
                <div className="flex items-center gap-1 px-3 py-1 bg-success/10 text-success rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-bold">{selectedMessage.aiSuggestion.confidence}%</span>
                </div>
              </div>

              {/* Suggested Text */}
              <div className="p-4 bg-white rounded-lg mb-4 border border-neutral-100">
                <p className="text-neutral-700 leading-relaxed">
                  {selectedMessage.aiSuggestion.text}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve & Send
                </button>
                <button className="btn-secondary">
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button className="btn-secondary text-neutral-600">
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Escalate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}