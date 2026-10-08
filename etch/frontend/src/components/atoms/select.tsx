export interface SelectProps {
  options: Array<{ value: string; label: string }>;
  selectedValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}
