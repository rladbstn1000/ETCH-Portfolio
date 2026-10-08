import type { ButtonProps } from "../../components/atoms/button";
import LockSVG from "../../components/svg/lockSVG";
import UnlockSVG from "../../components/svg/unlockSVG";

export const ProjectIsPublicData: ButtonProps[] = [
  {
    text: "공개",
    icon: <UnlockSVG />,
    checked: false,
  },
  {
    text: "비공개",
    icon: <LockSVG />,
    checked: false,
  },
];
