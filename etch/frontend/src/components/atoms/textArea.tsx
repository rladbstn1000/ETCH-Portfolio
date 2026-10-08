export interface TextAreaProps {
  value: string; // input안에 들어올 내용
  inputText?: string;
  onChange: (value: string) => void;
  onKeyEnter?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void; // 키보드 이벤트 핸들러
}
