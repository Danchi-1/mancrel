import React, { useState } from 'react';
import { Send, Users, Megaphone, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export function CampaignsContent({ user }) {
  const [template, setTemplate] = useState('');
  const [phones, setPhones] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Parse phones (comma separated or newlines)
    const phoneList = phones.split(/[\n,]+/).map(p => p.trim()).filter(p => p);

    if (phoneList.length === 0) {
      setResult({ error: "Please enter at least one phone number." });
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/messaging/broadcast', {
        phones: phoneList,
        template_message: template
      });
      setResult(response);
    } catch (err) {
      setResult({ error: err.message || "Failed to send broadcast." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-[#4F46E5]" />
          Campaigns & Broadcasts
        </h1>
        <p className="text-gray-500 mt-2">
          Send outbound messages to your CRM contacts. Remember: Meta requires you to use pre-approved Message Templates to initiate conversations.
        </p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 flex-1">
        <form onSubmit={handleBroadcast} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Recipient Phone Numbers
            </label>
            <textarea
              rows="3"
              required
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              placeholder="+1234567890, +0987654321..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
            />
            <p className="text-xs text-gray-500 mt-1">Enter numbers separated by commas or new lines. Include country code.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
            <textarea
              rows="5"
              required
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Hi {{Name}}, our new summer catalogue is out! Reply 'YES' to see our deals."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
            />
            <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2">
              <span className="font-bold">Tip:</span>
              <span>If you are in the Twilio Sandbox, recipients MUST have already texted your 'join code' before you can broadcast to them.</span>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
              {result.error ? (
                <p>{result.error}</p>
              ) : (
                <div>
                  <p className="font-bold mb-1">Broadcast Completed!</p>
                  <p>Successfully sent: {result.success_count}</p>
                  <p>Failed: {result.failed_count}</p>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err.phone}: {err.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send Broadcast
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
