import type { InputProps } from "../../atoms/input";

function HeaderInput({
  value,
  type,
  placeholderText: placeholder,
  onChange,
  onKeyEnter,
}: InputProps) {
  return (
    <input
      aria-label="헤더 검색어"
      className="w-full px-3 py-2 bg-transparent border-none rounded-lg focus:outline-none caret-blue-600 text-sm sm:text-base placeholder:text-gray-500"
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyEnter}
    />
  );
}
export default HeaderInput;
