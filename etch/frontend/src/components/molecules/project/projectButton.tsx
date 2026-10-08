import type { ButtonProps } from "../../atoms/button";

function ProjectButton({
  text,
  textColor,
  css,
  bgColor: bgColor,
  onClick,
}: ButtonProps) {
  return (
    <button className={`${bgColor} ${textColor} ${css}`} onClick={onClick}>
      {text}
    </button>
  );
}

export default ProjectButton;
