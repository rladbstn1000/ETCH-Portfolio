import type { funcComponentData } from "../../../types/funcComponentData";
import FuncComponent from "../../molecules/home/funcComponent";

interface Props {
  funcData: funcComponentData[];
}

function HomeFuncComponent({ funcData }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      {funcData.slice(0, 4).map((item, index) => (
        <FuncComponent key={index} {...item} />
      ))}
    </div>
  );
}

export default HomeFuncComponent;
