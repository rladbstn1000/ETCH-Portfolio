import StatsCard from "../../molecules/mypage/statsCard";
import type { StatsCardData } from "../../atoms/card";

interface StatsCardsProps {
  stats: StatsCardData[];
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((statsItem, index) => (
        <StatsCard
          key={index}
          title={statsItem.title}
          type={statsItem.type}
          value={statsItem.value}
          icon={statsItem.icon}
          color={statsItem.color}
        />
      ))}
    </div>
  );
};

export default StatsCards;