import type { ProjectTechData } from "../../../../types/project/projectTechData";
import ProjectStackButton from "../../../molecules/project/projectStackButton";

interface ProjectStackProps {
  isStackData: ProjectTechData[];
  isSelect: number[]; // ID 배열로 변경
  onStackChange: (id: number) => void; // ID를 전달하도록 변경
}

function ProjectStack({
  isStackData,
  isSelect,
  onStackChange,
}: ProjectStackProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {isStackData.map((data) => (
        <ProjectStackButton
          key={data.id}
          id={data.id} // ID 전달
          stack={data.stack}
          text={data.text}
          isSelected={isSelect.includes(data.id)} // ID로 선택 체크
          onSelect={onStackChange} // ID 기반 핸들러
        />
      ))}
    </div>
  );
}

export default ProjectStack;
