import React from 'react';
import { Smartphone, Link as LinkIcon, MessageSquare, ArrowRight, Zap, Target } from 'lucide-react';

export function StatusLinksGuide({ user }) {
  const twilioNum = user?.twilio_phone_number || '[Your Twilio Number]';

  return (
    <div className="max-w-4xl mx-auto p-6 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-[#4F46E5]" />
          WhatsApp Status Marketing
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Turn your personal WhatsApp Status views into automated sales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mb-4">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">1. Copy Link</h3>
          <p className="text-gray-500 text-sm">
            Go to your Catalogue and click the link icon on any product to copy its unique "Click-to-Buy" link.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center text-center relative">
          <div className="hidden md:block absolute top-1/2 -left-3 -translate-y-1/2 text-gray-300">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">2. Post Status</h3>
          <p className="text-gray-500 text-sm">
            Post an image on your personal WhatsApp Status and paste the link in the caption.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center text-center relative">
          <div className="hidden md:block absolute top-1/2 -left-3 -translate-y-1/2 text-gray-300">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">3. AI Takes Over</h3>
          <p className="text-gray-500 text-sm">
            When a customer taps the link, it opens a chat with your AI assistant, ready to process the order instantly.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg p-8 text-white mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-400" />
          Why do we need this?
        </h2>
        <div className="space-y-4 text-indigo-100">
          <p>
            Because official WhatsApp Business AI numbers exist in the cloud, they cannot be used to post statuses directly. If you post a status on your <strong>personal phone number</strong>, the AI cannot "see" the replies sent to your personal inbox.
          </p>
          <p>
            By adding a <strong>Click-to-Buy link</strong> to your status captions, you build a bridge. It moves the customer from your personal inbox to your AI's inbox effortlessly.
          </p>
          <div className="bg-black/20 p-4 rounded-lg mt-4 border border-indigo-700/50">
            <p className="text-sm font-mono text-indigo-200 break-all">
              Example Link Format:<br/>
              https://wa.me/{twilioNum.replace('whatsapp:', '').replace('+', '')}?text=I%20want%20to%20order...
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Best Practices for Status Leads</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">1</div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Clear Call to Action</h4>
              <p className="text-gray-600 text-sm">Don't just paste the link. Add a clear instruction in your caption like: <em>"Tap the link below to let our AI assistant take your order instantly ⚡"</em></p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">2</div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Train Your Customers</h4>
              <p className="text-gray-600 text-sm">If a customer still replies directly to your personal status instead of clicking the link, simply reply back with: <em>"Hey! Please tap the link on the status or message our business line at {twilioNum} so our assistant can process your order faster!"</em></p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">3</div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Use Catchy Text Overlays</h4>
              <p className="text-gray-600 text-sm">Use WhatsApp's text tool to write "LINK IN CAPTION TO BUY" directly on the image you are posting. This draws the eye to the caption where your generated link lives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
