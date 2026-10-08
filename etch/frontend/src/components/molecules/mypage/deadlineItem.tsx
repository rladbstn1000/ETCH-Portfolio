import type { DeadlineItemProps } from "../../atoms/listItem";

const DeadlineItem = ({
  id,
  company,
  position,
  dueDate,
  daysLeft,
  urgency,
  onClick
}: DeadlineItemProps) => {
  const getUrgencyStyle = (urgency: string) => {
    if (urgency === 'urgent') {
      return {
        container: 'border-l-red-600 bg-red-50',
        icon: 'bg-red-100 text-red-600',
        badge: 'bg-red-100 text-red-600'
      };
    } else {
      return {
        container: 'border-l-yellow-600 bg-yellow-50',
        icon: 'bg-yellow-100 text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-600'
      };
    }
  };

  const styles = getUrgencyStyle(urgency);

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm ${styles.container}`}
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${styles.icon}`}>
          ⚠️
        </div>
        <div>
          <h4 className="font-medium">{company} - {position}</h4>
          <p className="text-sm text-gray-600">{daysLeft}일 후 마감 ({dueDate})</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${styles.badge}`}>
        {urgency === 'urgent' ? '긴급' : '주의'}
      </span>
    </div>
  );
};

export default DeadlineItem;