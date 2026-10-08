import ProjectInput from "../../../molecules/project/projectInput";
import type { InputProps } from "../../../atoms/input";

function ProjectWriteInput({
  inputText,
  placeholderText = "",
  type,
  value,
  onChange,
}: InputProps) {
  return (
    <div>
      <div>{inputText}</div>
      <ProjectInput
        value={value}
        type={type}
        placeholderText={placeholderText}
        onChange={onChange}
      />
    </div>
  );
}

export default ProjectWriteInput;
