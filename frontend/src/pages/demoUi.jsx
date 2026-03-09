import React from 'react';

const DemoUI = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Medi-Quick Demo</h1>
      
      <section className="search-section">
        <input type="text" placeholder="Search by generic name (e.g. Paracetamol)..." style={{ width: '80%', padding: '10px' }} />
        <button style={{ padding: '10px' }}>Search</button>
      </section>

      <hr />

      <section className="stats-dashboard">
        <h3>Today's Insights</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="card">🔥 Most Bought: <strong>Napa 500mg</strong></div>
          <div className="card">⚠️ Low Stock: <strong>Sergel 20mg</strong></div>
          <div className="card">🏪 Top Shop: <strong>City Pharma</strong></div>
        </div>
      </section>

      <hr />

      <section className="price-check">
        <h3>Price Verification (Crowdsourced)</h3>
        <table border="1" width="100%" style={{ textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Shop</th>
              <th>Price</th>
              <th>Community Vote</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ace 500mg</td>
              <td>Central Pharma</td>
              <td>12.00 BDT</td>
              <td>
                <button>👍 12</button> <button>👎 2</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default DemoUI;