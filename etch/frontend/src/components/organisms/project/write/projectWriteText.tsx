import type { TextAreaProps } from "../../../atoms/textArea";
import ProjectTextArea from "../../../molecules/project/projectTextArea";

function ProjectWriteText({ inputText, value, onChange }: TextAreaProps) {
  return (
    <div>
      <div>{inputText}</div>
      <ProjectTextArea value={value} onChange={onChange} />
    </div>
  );
}

export default ProjectWriteText;
