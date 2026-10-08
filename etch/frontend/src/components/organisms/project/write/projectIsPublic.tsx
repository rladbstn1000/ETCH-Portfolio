import ProjectIsPublicButton from "../../../molecules/project/proejctIsPublicButton";
import type { ButtonProps } from "../../../atoms/button";

interface Props {
  isPublicData: ButtonProps[];
  isPublic: boolean;
  onIsPublicChange: (isPublic: boolean) => void;
}

function ProjectIsPublic({ isPublicData, isPublic, onIsPublicChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {isPublicData.map((data, index) => {
        // 첫 번째 버튼(공개)는 isPublic이 true일 때 선택
        // 두 번째 버튼(비공개)는 isPublic이 false일 때 선택
        const isChecked = index === 0 ? isPublic : !isPublic;

        return (
          <div key={index} className="flex-1">
            <ProjectIsPublicButton
              {...data}
              checked={isChecked}
              onSelect={() => onIsPublicChange(index === 0)} // 첫 번째 버튼이면 true, 두 번째면 false
            />
          </div>
        );
      })}
    </div>
  );
}

export default ProjectIsPublic;
