import type { UIChatMessage } from "../../../types/chat";
import ChatMessageItem from "../../molecules/chat/chatMessageItem";

interface ChatMessageListProps {
  messages: UIChatMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div>
      {messages.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          메시지가 없습니다
        </div>
      ) : (
        messages.map(message => (
          <ChatMessageItem
            key={message.id}
            {...message}
          />
        ))
      )}
    </div>
  );
}