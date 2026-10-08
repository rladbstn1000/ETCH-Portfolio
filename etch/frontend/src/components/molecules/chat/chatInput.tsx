import type { InputProps } from "../../atoms/input";

export default function ChatInput({
  value,
  type = "text",
  placeholderText: placeholder = "메시지를 입력하세요...",
  onChange,
  onKeyEnter,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyEnter}
      className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-gray-500"
    />
  );
}
