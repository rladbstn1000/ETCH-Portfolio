export interface ModalHeaderProps {
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ChatRoomHeaderProps extends ModalHeaderProps {
  roomName: string;
  onBack: () => void;
}
