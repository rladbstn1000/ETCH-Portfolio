import { Link } from "react-router";
import type { NavButtonProps } from "../../atoms/button";

const NavButton = ({ text, icon, to, isActive, onClick }: NavButtonProps) => {
  return (
    <Link to={to} className="block w-full">
      <button
        className={`w-full px-4 py-2 rounded-md text-sm text-left flex items-center space-x-2 transition-colors cursor-pointer ${
          isActive
            ? "bg-blue-600 text-white"
            : "bg-transparent text-black hover:bg-gray-100"
        }`}
        onClick={onClick}
      >
        <span>{icon}</span>
        <span>{text}</span>
      </button>
    </Link>
  );
};

export default NavButton;
