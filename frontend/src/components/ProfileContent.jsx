export function ProfileContent({ user }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <div className="text-gray-900 font-medium">{user?.name || "Not provided"}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
              <div className="text-gray-900 font-medium">{user?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">WhatsApp Connection</label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.whatsapp_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user?.whatsapp_connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Note: Profile editing is currently disabled. Please contact support if you need to update your account details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
