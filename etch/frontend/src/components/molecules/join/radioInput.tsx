import type { RadioInputProps } from "../../atoms/input";

function RadioInput({
  value,
  type,
  placeholderText: placeholder,
  onChange,
  name,
  checked,
}: RadioInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <label className="flex items-center space-x-2">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
      />
      {placeholder && <span className="text-sm">{placeholder}</span>}
    </label>
  );
}
export default RadioInput;
