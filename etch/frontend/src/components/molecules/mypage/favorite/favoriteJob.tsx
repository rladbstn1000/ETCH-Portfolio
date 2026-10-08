import type { FavoriteJobProps } from "../../../atoms/list";

function FavoriteJob({ companyName }: FavoriteJobProps) {
  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="flex-shrink-0 mr-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center"></div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {companyName}
        </h3>
      </div>
    </div>
  );
}

export default FavoriteJob;
