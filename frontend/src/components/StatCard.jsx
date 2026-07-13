export default function StatCard({ title, value, change, trend, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 hover:border-teal-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
        {change && (
          <p className={`text-sm mt-2 font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
          </p>
        )}
      </div>
    </div>
  );
}
