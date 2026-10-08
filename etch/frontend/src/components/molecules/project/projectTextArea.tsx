// ProjectTextarea.tsx
import type { TextAreaProps } from "../../atoms/textArea";

function ProjectTextArea({ value, onChange, onKeyEnter }: TextAreaProps) {
  return (
    <textarea
      value={value}
      placeholder="프로젝트에 대한 상세한 설명을 작성해주세요.&#10;&#10;&#10;💡 포함하면 좋은 내용:&#10;• 프로젝트 개발 기간  &#10;• 프로젝트 개발 배경과 목적&#10;• 사용한 기술스택과 선택 이유&#10;• 주요 기능과 구현 과정&#10;• 어려웠던 점과 해결 방법&#10;• 프로젝트를 통해 얻은 경험과 성과"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyEnter}
      rows={8} // 4에서 8로 증가
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700 resize-vertical min-h-[300px]" // min-h-[100px]에서 min-h-[200px]로 증가
    />
  );
}

export default ProjectTextArea;
