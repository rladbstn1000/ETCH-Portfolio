import type { InputProps } from "../../atoms/input";

function PortfolioInput({
  type,
  value,
  placeholderText: placeholder,
  onChange,
  onKeyEnter,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyEnter}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
    />
  );
}

export default PortfolioInput;
