import type { DocumentItemProps } from "../../atoms/listItem";

const DocumentItem = ({
  id,
  introduce,
  updatedAt,
  onClick,
  onDelete,
  onEdit,
}: DocumentItemProps) => {
  // Add onEdit
  return (
    <div
      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex-1">
        <h4 className="font-medium">{introduce}</h4>
        {updatedAt && <p className="text-sm text-gray-500 mt-1">{updatedAt}</p>}
      </div>
      <div className="flex space-x-2">
        {onEdit && ( // Conditionally render edit button if onEdit prop is provided
          <button
            className="border border-gray-300 bg-white text-black px-3 py-1 rounded-md text-sm hover:bg-gray-50 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onClick
              onEdit(id); // Call the onEdit prop
            }}
          >
            ✏️
          </button>
        )}
        {onDelete && ( // Conditionally render delete button if onDelete prop is provided
          <button
            className="border border-gray-300 bg-white text-black px-3 py-1 rounded-md text-sm hover:bg-gray-50 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onClick
              onDelete(id); // Call the onDelete prop
            }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentItem;
