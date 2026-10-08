import type { InputProps } from "../../atoms/input";

function TelInput({
  type,
  value,
  placeholderText: placeholder,
  onChange,
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, "");
    onChange(numericValue);
  };

  return (
    <input
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      maxLength={11}
    />
  );
}

export default TelInput;
