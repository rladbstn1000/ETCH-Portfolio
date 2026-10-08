type InputType = "email" | "password" | "text" | "tel" | "radio" | "url";

export interface InputProps {
  value: string; // input안에 들어올 내용
  type: InputType; // 어떤 형식인지(ex.email, password, text 등등)
  inputText?: string;
  placeholderText: string; //   placeholder에 적을 말
  onChange: (value: string) => void;
  onKeyEnter?: (event: React.KeyboardEvent<HTMLInputElement>) => void; // 키보드 이벤트 핸들러
}

export interface RadioInputProps extends InputProps {
  name: string; // 라디오 버튼 그룹 이름
  checked: boolean; // 라디오 버튼이 선택되었는지 여부
}
