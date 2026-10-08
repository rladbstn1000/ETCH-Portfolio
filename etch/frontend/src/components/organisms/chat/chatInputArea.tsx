import { useState } from "react";
import ChatInput from "../../molecules/chat/chatInput";
import ChatSendButton from "../../molecules/chat/chatSendButton";
import ChatFileButton from "../../molecules/chat/chatFileButton";

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  onFileUpload?: () => void;
}

export default function ChatInputArea({
  onSendMessage,
  onFileUpload,
}: ChatInputAreaProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50">
      <ChatFileButton onClick={onFileUpload} />
      <div className="flex-1">
        <ChatInput
          value={inputValue}
          type="text"
          placeholderText="메시지를 입력하세요..."
          onChange={setInputValue}
          onKeyEnter={handleKeyEnter}
        />
      </div>
      <ChatSendButton onClick={handleSend} />
    </div>
  );
}
