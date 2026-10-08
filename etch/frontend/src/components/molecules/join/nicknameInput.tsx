import type { InputProps } from "../../atoms/input";

function NicknameInput({
  value,
  type,
  placeholderText: placeholder,
  onChange,
}: InputProps) {
  return (
    <input
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

export default NicknameInput;
