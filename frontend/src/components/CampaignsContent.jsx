import React, { useState, useEffect } from 'react';
import { Send, Users, Megaphone, Loader2, CheckSquare } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export function CampaignsContent({ user }) {
  const [template, setTemplate] = useState('');
  const [phones, setPhones] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = await apiClient.get('/customers');
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers for campaigns", err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, []);

  const toggleCustomer = (phone) => {
    if (!phone) return;
    const newSet = new Set(selectedCustomers);
    if (newSet.has(phone)) {
      newSet.delete(phone);
    } else {
      newSet.add(phone);
    }
    setSelectedCustomers(newSet);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Parse manual phones
    const manualList = phones.split(/[\n,]+/).map(p => p.trim()).filter(p => p);
    
    // Combine manual list with selected customers
    const phoneList = [...new Set([...manualList, ...Array.from(selectedCustomers)])];

    if (phoneList.length === 0) {
      setResult({ error: "Please select at least one customer or enter a manual phone number." });
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
              Select Known Customers
            </label>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-y-auto mb-4">
              {loadingCustomers ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No customers found in database.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customers.map((c) => {
                    const phone = c.phone;
                    if (!phone) return null;
                    const isSelected = selectedCustomers.has(phone);
                    return (
                      <label key={c.id} className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-gray-100'}`}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={() => toggleCustomer(phone)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          <span className="text-xs text-gray-500">{phone}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-gray-400" />
              Manual Custom Numbers (Optional)
            </label>
            <textarea
              rows="2"
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              placeholder="+1234567890, +0987654321..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
            />
            <p className="text-xs text-gray-500 mt-1">Enter any numbers not in your database, separated by commas.</p>
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
              <span className="font-bold">Twilio Sandbox Tip:</span>
              <span>Because you are using the Twilio trial sandbox, you cannot broadcast to random numbers. Your recipients MUST first text the word <strong>"join &lt;your-sandbox-word&gt;"</strong> to your Twilio number <strong>{user?.twilio_phone_number || "[Your Twilio Number]"}</strong> to opt-in before they will receive these broadcasts!</span>
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
