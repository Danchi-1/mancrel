import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart, Activity, Users, AlertTriangle, MessageSquare, Loader2, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function AnalyticsContent({ setActiveView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      setData(response);
    } catch (err) {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToInbox = (customerPhone) => {
    // You could pass state here if the inbox supports filtering,
    // but for now we just switch the active view.
    if (setActiveView) {
      setActiveView('inbox');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 m-6">
        <AlertTriangle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-[#4F46E5] rounded-lg">
          <BarChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-sm text-gray-500">Track your AI's performance and monitor customer sentiment.</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Inbound Messages</p>
              <h3 className="text-3xl font-bold text-gray-900">{data.total_inbound}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Total inquiries received from customers.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">AI Interactions</p>
              <h3 className="text-3xl font-bold text-gray-900">{data.total_outbound_ai}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Messages handled autonomously by the AI.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">AI Handling Rate</p>
              <h3 className="text-3xl font-bold text-emerald-600">{data.ai_handling_rate.toFixed(1)}%</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 relative z-10">Percentage of workload managed by AI.</p>
          {/* Decorative background circle */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Chart */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Sentiment Breakdown</h3>
          <div className="h-72 w-full">
            {data.sentiment_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sentiment_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.sentiment_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} messages`, 'Volume']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No sentiment data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Attention Required List */}
        <div className="bg-white p-0 rounded-2xl border shadow-sm flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Attention Required
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {data.attention_required.length}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Customers flagged as frustrated or negative.</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[350px] p-2 custom-scrollbar">
            {data.attention_required.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs mt-1">No customers currently require urgent intervention.</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2">
                {data.attention_required.map((customer) => (
                  <li key={customer.id} className="bg-red-50/50 hover:bg-red-50 border border-red-100 p-4 rounded-xl transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                        <p className="text-xs text-gray-500">{customer.phone} • {customer.time}</p>
                      </div>
                      <button 
                        onClick={() => handleJumpToInbox(customer.phone)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        View Chat <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-red-50 mt-2 line-clamp-2">
                      "{customer.last_message}"
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
