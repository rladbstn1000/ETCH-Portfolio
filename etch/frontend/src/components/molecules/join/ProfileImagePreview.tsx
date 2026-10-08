import defaultProfile from "../../../assets/default-profile.png";

function ProfileImagePreview({ imageUrl }: { imageUrl?: string }) {
  return (
    <div>
      <img src={imageUrl || defaultProfile} alt="프로필" />
    </div>
  );
}

export default ProfileImagePreview;
