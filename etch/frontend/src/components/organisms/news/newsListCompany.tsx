import { useState, useEffect } from "react";
import type { TopCompany } from "../../../types/topCompanies";
import CompanyCard from "../../molecules/news/companyCard";

interface Props {
  companyData: TopCompany[];
}

function CompanyNews({ companyData }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (companyData.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 4) % companyData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [companyData.length]);

  const getDisplayedCompanies = () => {
    if (companyData.length === 0) return [];
    
    const displayed = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentIndex + i) % companyData.length;
      displayed.push(companyData[index]);
    }
    return displayed;
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index * 4);
  };

  const totalPages = Math.ceil(companyData.length / 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {getDisplayedCompanies().map((company, index) => (
          <CompanyCard
            key={`${company.companyId}-${currentIndex}-${index}`}
            companyName={company.companyName}
            like={company.likeCount}
            type="company"
          />
        ))}
      </div>
      
      {companyData.length > 4 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                Math.floor(currentIndex / 4) === i
                  ? "bg-purple-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CompanyNews;
