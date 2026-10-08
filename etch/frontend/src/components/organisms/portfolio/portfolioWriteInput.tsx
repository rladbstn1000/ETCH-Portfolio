import type { InputProps } from "../../atoms/input";
import PortfolioInput from "../../molecules/portfolio/portfolioInput";

function PortfolioWriteInput({
  inputText,
  placeholderText = "",
  type,
  value,
  onChange,
}: InputProps) {
  return (
    <div>
      <div>{inputText}</div>
      <PortfolioInput
        value={value}
        type={type}
        placeholderText={placeholderText}
        onChange={onChange}
      />
    </div>
  );
}

export default PortfolioWriteInput;
