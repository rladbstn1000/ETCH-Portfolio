import type { FuncComponentProps } from "../../atoms/funcComponent";

function FuncComponent({ title, content, img }: FuncComponentProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-blue-200">
      {/* 아이콘 섹션 */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
          <img src={img} alt={`${title} 아이콘`} className="h-12 w-12 object-contain" />
        </div>
      </div>
      
      {/* 제목 섹션 */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
          {title}
        </h3>
      </div>
      
      {/* 설명 섹션 */}
      <div className="text-center">
        <p className="text-gray-600 leading-relaxed text-sm">
          {content}
        </p>
      </div>
      
      {/* 호버 시 나타나는 장식 요소 */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}

export default FuncComponent;
