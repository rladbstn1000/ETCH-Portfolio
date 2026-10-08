import { getMemberInfo } from "../../../api/authApi";
import useUserStore from "../../../store/userStore";
import { useState } from "react";
import { useNavigate } from "react-router";
import { authInstance } from "../../../api/instances";
import { requireUploads } from "../../../config/features";
import NicknameInput from "../../molecules/join/nicknameInput";
import TelInput from "../../molecules/join/telInput";
import BirthDateSelector from "../../organisms/join/BirthDateSelector";
import GenderRadioGroup from "../../organisms/join/genderRadioGroup";
import ProfileImageUploader from "../../organisms/join/profileImageUploader";
import CompletionButton from "../../molecules/join/completionButton";
import TokenManager from "../../../utils/tokenManager";

function AdditionalInfoPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [tel, setTel] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [profile, setProfile] = useState<File | null>(null);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
  };

  const handleTelChange = (value: string) => {
    setTel(value);
  };

  const handleBirthChange = (value: string) => {
    setBirth(value);
  };

  const handleGenderChange = (value: string) => {
    setGender(value);
  };

  const handleProfileChange = (file: File | null) => {
    setProfile(file);
  };

  const handleSubmit = async () => {

    try {
      requireUploads(Boolean(profile));
      const accessToken = TokenManager.getToken();

      if (!accessToken) {
        alert("비정상적인 접근입니다.");
        navigate("/join", { replace: true });
        return;
      }

      // FormData 생성 (multipart/form-data)
      const formData = new FormData();

      // JSON 데이터를 'data' 파트에 추가
      const memberData = {
        nickname,
        phoneNumber: tel,
        gender,
        birth,
      };
      formData.append("data", JSON.stringify(memberData));

      // 프로필 이미지가 있으면 'profile' 파트에 추가
      if (profile) {
        formData.append("profile", profile);
      }


      const response = await authInstance.post(
        "/members",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const newAccessToken = response.headers["authorization"];
        if (!newAccessToken) throw new Error("가입 후 액세스 토큰이 없습니다.");
        TokenManager.setToken(newAccessToken);
        useUserStore.getState().setMemberInfo(await getMemberInfo());
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">프로필 설정</h1>
          <p className="text-gray-600">
            추가 정보를 입력하여 회원가입을 완료하세요
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">
              *닉네임
            </p>
          </div>
          <NicknameInput
            value={nickname}
            type="text"
            placeholderText="사용할 닉네임을 입력하세요"
            onChange={handleNicknameChange}
          />
          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">
              *생년월일
            </p>
            <BirthDateSelector onChange={handleBirthChange} />
          </div>

          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">
              *성별
            </p>
            <GenderRadioGroup value={gender} onChange={handleGenderChange} />
          </div>

          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">
              *전화번호
            </p>
            <TelInput
              value={tel}
              type="tel"
              placeholderText="01000000000"
              onChange={handleTelChange}
            />
          </div>

          <div>
            <p className="block mb-2 text-sm font-medium text-gray-700">
              프로필 사진
            </p>
            <ProfileImageUploader onChange={handleProfileChange} />
          </div>

          <div className="pt-4">
            <CompletionButton text="완료" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdditionalInfoPage;
