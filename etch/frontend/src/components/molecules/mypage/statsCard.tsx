import type { StatsCardData } from "../../atoms/card";

const StatsCard = ({ title, value, icon, color }: StatsCardData) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`w-8 h-8 ${color}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;