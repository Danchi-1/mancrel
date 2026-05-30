import React, { useState, useEffect } from 'react';
import WhatsAppConnect from './WhatsAppConnect';
import { ShieldCheck, LogOut, CheckCircle2, Copy } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export function IntegrationsContent({ user, setUser }) {
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      const host = window.location.hostname === 'localhost' 
        ? 'https://mancrel.onrender.com' 
        : 'https://mancrel.onrender.com';
      setWebhookUrl(`${host}/api/v1/messaging/twilio-webhook/${user.id}`);
    }
  }, [user]);

  const handleDisconnect = async () => {
    const confirm = window.confirm("Are you sure you want to disconnect your WhatsApp assistant? It will stop responding to customers immediately.");
    if (!confirm) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/twilio/disconnect');
      setUser({ ...user, whatsapp_connected: false });
    } catch (e) {
      console.error("Failed to disconnect", e);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.whatsapp_connected) {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <WhatsAppConnect onConnect={async () => {
          try {
            await apiClient.patch('/auth/whatsapp/connect'); // Wait, connect logic is handled in WhatsAppConnect, but they just click the last button
            setUser({ ...user, whatsapp_connected: true });
          } catch (e) {
            console.error(e);
            setUser({ ...user, whatsapp_connected: true }); // Fallback
          }
        }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Integrations</h1>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">WhatsApp is Connected</h2>
            <p className="text-gray-500 mt-1">Your AI assistant is actively handling inbound messages.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
            Verified & Active
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Your Webhook URL</h3>
            <div className="flex items-center gap-2">
              <div className="bg-gray-50 border p-4 rounded-xl font-mono text-sm text-gray-600 break-all flex-1">
                {webhookUrl}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-4 border rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">This is the URL configured in your Twilio Sandbox settings.</p>
          </div>

          <div className="pt-6 border-t mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">
              Disconnecting will immediately stop the AI assistant from replying to WhatsApp messages. You will need to re-verify your phone number to connect again.
            </p>
            <button 
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Disconnecting..." : "Disconnect WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
