import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState({
    overview: {
      total_equipment: 0,
      active_technicians: 0,
      low_stock_alerts: 0,
      mttr_hours: 0,
      mtbf_hours: 0,
      total_breakdowns: 0
    },
    equipment_costs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await api.get('reports/kpis/');
        setData(response.data);
      } catch (err) {
        console.error("Failed to load KPIs", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKPIs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Facility Analytics</h2>
        <p className="text-gray-500 mt-2">Live Key Performance Indicators (KPIs) and Cost Analysis.</p>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="MTBF (Reliability)" 
              value={`${data.overview.mtbf_hours} hrs`}
              change="Mean Time Between Failures"
              trend="up"
              icon={
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              }
            />
            <StatCard 
              title="MTTR (Efficiency)" 
              value={`${data.overview.mttr_hours} hrs`}
              change="Mean Time To Repair"
              trend="down"
              icon={
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
            />
            <StatCard 
              title="Total Breakdowns" 
              value={data.overview.total_breakdowns}
              change="Historical unplanned events"
              trend="down"
              icon={
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              }
            />
            <StatCard 
              title="Low Stock Alerts" 
              value={data.overview.low_stock_alerts}
              change="Parts below reorder level"
              trend="down"
              icon={
                <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
            />
          </div>

          {/* TCO Cost Analysis Table */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 overflow-hidden">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Total Cost of Ownership (TCO)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Equipment</th>
                    <th className="px-6 py-4 font-semibold">Breakdowns</th>
                    <th className="px-6 py-4 font-semibold">Labor Cost</th>
                    <th className="px-6 py-4 font-semibold">Parts Cost</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.equipment_costs.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{eq.name}</div>
                        <div className="text-xs text-gray-500">SN: {eq.serial}</div>
                      </td>
                      <td className="px-6 py-4">{eq.breakdowns}</td>
                      <td className="px-6 py-4">Ksh {eq.labor_cost.toFixed(2)}</td>
                      <td className="px-6 py-4">Ksh {eq.part_cost.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-rose-400">Ksh {eq.total_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                  {data.equipment_costs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No cost data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
