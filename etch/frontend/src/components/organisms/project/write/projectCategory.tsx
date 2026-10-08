import type {
  ProjectCategoryData,
  ProjectCategoryEnum,
} from "../../../../types/project/projectCategroyData";
import ProjectCategoryButton from "../../../molecules/project/projectCategoryButton";

interface ProjectCategoryProps {
  isCategoryData: ProjectCategoryData[];
  isSelect: ProjectCategoryEnum | "";
  onCategoryChange: (category: ProjectCategoryEnum) => void;
}

function ProjectCategory({
  isCategoryData,
  isSelect,
  onCategoryChange,
}: ProjectCategoryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {isCategoryData.map((data) => (
        <ProjectCategoryButton
          key={data.category}
          {...data}
          isSelected={isSelect === data.category}
          onSelect={() => onCategoryChange(data.category)}
        />
      ))}
    </div>
  );
}

export default ProjectCategory;
