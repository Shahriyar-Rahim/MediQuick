import React from 'react';

const Dashboard = () => {
  return (
    <div className="bg-gray-50 p-6">
      {/* Top Row: Trending, Stock Alerts, and Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Trending Medicines */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Trending Medicines (Today)</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between"><span>Napa 500mg</span></li>
            <li className="flex justify-between"><span>Sergel 20mg</span></li>
            <li className="flex justify-between"><span>Ace</span></li>
            <li className="flex justify-between"><span>Fexo 120</span></li>
          </ul>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Stock Alerts (Running Low)</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-red-500">💊</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Napa 500mg</p>
                <p className="text-xs text-red-500">2 shops low</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-500">💊</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Sergel (Al-Madina)</p>
                <p className="text-xs text-amber-500">Al-Madina low</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Contributing Shops */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Top Shops (Leaderboard)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">🏪 City Pharma, Saidpur</span>
              <span className="text-blue-500">✔</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">🏪 Apollo Pharma</span>
              <span className="text-blue-500">✔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Price Comparison Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Verification Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-bold text-gray-800 text-sm">Price Verification (Crowdsourced)</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-center">Community Vote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium">Ace 500mg</td>
                <td className="px-4 py-3 text-gray-600">Central Pharma</td>
                <td className="px-4 py-3 font-bold text-blue-600">12.00 BDT</td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button className="bg-green-50 text-green-700 px-2 py-1 rounded">👍 12</button>
                  <button className="bg-red-50 text-red-700 px-2 py-1 rounded">👎 2</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Similar table for Price Comparison can go here */}
      </div>
    </div>
  );
};

export default Dashboard;