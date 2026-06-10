"use client"

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'

const dummyMessages = [
  {
    id: 1,
    from: "Sarah Jenkins",
    company: "TechFlow Inc",
    subject: "Enterprise License Upgrade",
    preview: "Hi, we're looking to upgrade our current team plan to enterprise. Could you share the pricing tiers?",
    time: "10:24 AM",
    unread: true,
    sentiment: "positive",
    aiSuggestion: {
      confidence: 94,
      text: "Drafting response with Enterprise pricing PDF and proposing a 15-min discovery call."
    }
  },
  {
    id: 2,
    from: "Michael Chang",
    company: "DataSync",
    subject: "API Integration Issue",
    preview: "The v2 endpoints keep timing out when we run our batch sync. Urgent help needed.",
    time: "09:12 AM",
    unread: true,
    sentiment: "concern",
    aiSuggestion: {
      confidence: 88,
      text: "Flagging for high priority escalation. Drafting apology and linking to status page."
    }
  },
  {
    id: 3,
    from: "Emma Woods",
    company: "RetailCo",
    subject: "Q3 Vendor Inquiry",
    preview: "Do you have capacity to handle our Q3 shipment volumes? Looking for a new logistics partner.",
    time: "Yesterday",
    unread: false,
    sentiment: "positive",
    aiSuggestion: {
      confidence: 91,
      text: "Drafting response highlighting Q3 capacity metrics and attaching our logistics case study."
    }
  }
];

export default function AIInbox({ isMarketingPreview = false, isDashboard = false }) {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [useAI, setUseAI] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [semanticMatches, setSemanticMatches] = useState(null)

  useEffect(() => {
    if (isMarketingPreview) {
      setMessages(dummyMessages);
      setSelectedMessage(dummyMessages[0]);
      setLoading(false);
      return;
    }

    async function fetchMessages() {
      try {
        const data = await apiClient.get('/messaging/inbox');
        setMessages(data);
        if (data.length > 0) setSelectedMessage(data[0]);
      } catch (error) {
        console.error("Failed to fetch inbox messages", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [isMarketingPreview]);

  useEffect(() => {
    if (!useAI || !searchQuery.trim()) {
      setSemanticMatches(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setAiLoading(true);
      try {
        const data = await apiClient.get(`/messaging/search/semantic?query=${encodeURIComponent(searchQuery)}&target=inbox`);
        setSemanticMatches(data.matches.map(m => m.id));
      } catch (err) {
        console.error("Semantic search failed", err);
      } finally {
        setAiLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, useAI]);

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    
    if (useAI) {
      if (!semanticMatches) return true;
      return semanticMatches.includes(msg.id);
    }
    
    const q = searchQuery.toLowerCase();
    return (
      msg.from?.toLowerCase().includes(q) ||
      msg.company?.toLowerCase().includes(q) ||
      msg.subject?.toLowerCase().includes(q) ||
      msg.full_text?.toLowerCase().includes(q)
    );
  });

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    setIsSending(true);
    setSendResult(null);
    try {
      await apiClient.post('/messaging/send-manual', {
        to_phone: selectedMessage.sender_phone || selectedMessage.from,
        message: replyText
      });
      setSendResult({ success: true, text: "Message sent!" });
      setReplyText('');
      setTimeout(() => setSendResult(null), 3000);
    } catch (err) {
      setSendResult({ success: false, text: "Failed to send message." });
    } finally {
      setIsSending(false);
    }
  };

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
    <section id="ai" className={`bg-bg-secondary ${isDashboard ? 'h-full flex flex-col' : 'py-24 px-4 sm:px-6 lg:px-8'}`}>
      <div className={`w-full max-w-7xl mx-auto ${isDashboard ? 'h-full flex flex-col' : ''}`}>
        {/* Section Header */}
        {!isDashboard && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4">
              AI-Powered Inbox
            </h2>
            <p className="text-lg text-neutral-600">
              Never miss a signal. AI analyzes sentiment, suggests responses, and flags urgent opportunities in real-time.
            </p>
          </div>
        )}

        {/* Inbox Interface */}
        <div className={`grid lg:grid-cols-5 gap-6 w-full ${isDashboard ? 'h-full flex-1 min-h-0 p-4 md:p-6' : ''}`}>
          {/* Message List */}
          <div className="lg:col-span-2 card flex flex-col overflow-hidden w-full max-h-[calc(100vh-150px)]">
            <div className="p-4 border-b border-neutral-100 shrink-0">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={useAI ? "Describe the message meaning..." : "Search messages..."}
                    className={`input-field pl-10 ${useAI ? 'bg-indigo-50 border-indigo-200' : ''}`}
                    aria-label="Search messages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {aiLoading ? (
                    <div className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
                  ) : (
                    <svg className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${useAI ? 'text-[#4F46E5]' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                
                <button 
                  onClick={() => setUseAI(!useAI)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${useAI ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white text-gray-400 border-neutral-200 hover:bg-neutral-50 hover:text-gray-600'}`}
                  title="Toggle AI Semantic Search"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 min-h-0">
              {filteredMessages.length === 0 ? (
                 <div className="p-4 text-center text-neutral-500">No messages found.</div>
              ) : filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors duration-200 ${
                    selectedMessage?.id === message.id ? 'bg-accent/5 border-l-4 border-accent' : ''
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
          <div className="lg:col-span-3 space-y-6 w-full flex flex-col overflow-y-auto max-h-[calc(100vh-150px)]">
            {!selectedMessage ? (
              <div className="card p-6 flex items-center justify-center h-64 text-neutral-500">
                Select a message to view details
              </div>
            ) : (
            <>
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

              <p className="text-neutral-700 leading-relaxed mb-6 whitespace-pre-wrap">
                {selectedMessage.full_text || selectedMessage.preview}
              </p>

              <div className="flex gap-3">
                <button className="btn-secondary">
                  Forward
                </button>
                <button className="btn-secondary">
                  Archive
                </button>
              </div>

              {/* Manual Reply Box */}
              {isDashboard && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Send Manual Reply (Overrides AI)</h4>
                  <textarea
                    rows="3"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      {sendResult && (
                        <span className={`text-sm ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {sendResult.text}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={handleSendReply}
                      disabled={isSending || !replyText.trim()}
                      className="px-6 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              )}
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
                <button 
                  onClick={() => setReplyText(selectedMessage.aiSuggestion.text)}
                  className="btn-primary"
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Use Draft
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
            </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}