import { useState, useEffect } from 'react';
import { Package, Truck, AlertCircle, Loader2, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function OrdersKanban() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tracking Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [pendingShipmentOrder, setPendingShipmentOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiClient.get('/orders');
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    if (newStatus === 'Shipped') {
      // Open modal to get tracking number
      setPendingShipmentOrder(order);
      setTrackingNumber('');
      setIsTrackingModalOpen(true);
    } else {
      // Update directly
      updateOrderStatus(orderId, newStatus);
    }
  };

  const updateOrderStatus = async (orderId, status, tracking = null) => {
    // Optimistic update
    const previousOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status, tracking_number: tracking } : o));
    
    try {
      await apiClient.patch(`/orders/${orderId}`, { 
        status, 
        tracking_number: tracking 
      });
    } catch (err) {
      setOrders(previousOrders);
      setError('Failed to update order status.');
    }
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    if (!pendingShipmentOrder) return;
    
    setIsSubmitting(true);
    await updateOrderStatus(pendingShipmentOrder.id, 'Shipped', trackingNumber);
    setIsSubmitting(false);
    setIsTrackingModalOpen(false);
    setPendingShipmentOrder(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  const columns = [
    { id: 'Pending Verification', title: 'Pending Verification', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'Processing', title: 'Processing', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Shipped', title: 'Shipped', icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Complications', title: 'Complications', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#4F46E5]" />
          Automated Fulfillment
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Drag an order to Shipped to automatically notify the customer via WhatsApp.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.id);
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              className="flex-1 min-w-[300px] bg-neutral-50 rounded-xl p-4 border border-neutral-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${col.bg} ${col.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-neutral-800">{col.title}</h3>
                </div>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded-full text-neutral-500 border border-neutral-200 shadow-sm">
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-neutral-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-neutral-900 text-sm">{order.customer_name}</h4>
                      <span className="text-[#4F46E5] font-bold text-sm">{formatCurrency(order.total_amount)}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">{order.customer_phone}</p>
                    <div className="text-sm bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="font-medium text-neutral-700 text-xs uppercase tracking-wider block mb-1">Items</span>
                      <p className="text-neutral-600 line-clamp-2 leading-snug">{order.items_summary}</p>
                    </div>
                    {order.tracking_number && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-100">
                        <Truck className="w-3.5 h-3.5" />
                        Tracking: {order.tracking_number}
                      </div>
                    )}
                  </div>
                ))}
                
                {colOrders.length === 0 && (
                  <div className="p-4 border-2 border-dashed border-neutral-200 rounded-lg text-center text-neutral-400 text-sm font-medium">
                    Drop orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracking Number Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-neutral-50 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-neutral-900">Ship Order</h3>
            </div>
            
            <form onSubmit={handleTrackingSubmit} className="p-6">
              <p className="text-sm text-neutral-600 mb-4">
                You are marking the order for <strong>{pendingShipmentOrder?.customer_name}</strong> as Shipped. 
                Enter the tracking link or number. We will send this directly to the customer via WhatsApp.
              </p>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tracking Number / Link</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DHL-987654321 or https://track.com/..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Confirm & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
