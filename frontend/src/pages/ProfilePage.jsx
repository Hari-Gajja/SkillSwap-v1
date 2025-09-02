import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, Phone, User, Award, Book, Upload, BookOpen, FileCheck } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [newSkill, setNewSkill] = useState({ skillName: "", proficiencyLevel: "beginner" });
  const [newSkillToLearn, setNewSkillToLearn] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [certificateTitle, setCertificateTitle] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName) {
      return toast.error("Skill name is required");
    }

    try {
      await axiosInstance.put("/api/auth/update-profile", {
        skills: [...(authUser.skills || []), newSkill]
      });
      toast.success("Skill added successfully");
      setNewSkill({ skillName: "", proficiencyLevel: "beginner" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding skill");
    }
  };

  const handleAddSkillToLearn = async () => {
    if (!newSkillToLearn) {
      return toast.error("Skill name is required");
    }

    try {
      await axiosInstance.put("/api/auth/update-profile", {
        skillsToLearn: [...(authUser.skillsToLearn || []), { skillName: newSkillToLearn }]
      });
      toast.success("Skill to learn added successfully");
      setNewSkillToLearn("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding skill to learn");
    }
  };

  const handleCertificateUpload = async () => {
    if (!selectedFile || !certificateTitle) {
      return toast.error("Both certificate and title are required");
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);

    reader.onload = async () => {
      try {
        await axiosInstance.put("/api/auth/update-profile", {
          certificates: [...(authUser.certificates || []), {
            title: certificateTitle,
            fileUrl: reader.result
          }]
        });
        toast.success("Certificate uploaded successfully");
        setSelectedFile(null);
        setCertificateTitle("");
      } catch (error) {
        toast.error(error.response?.data?.message || "Error uploading certificate");
      }
    };
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Manage your profile information</p>
          </div>

          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.name}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Mobile Number
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.mobileNumber}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/70 flex items-center gap-2">
                <User className="w-4 h-4" />
                Father's Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fatherName}</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Award className="size-5" />
              Skills
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {authUser?.skills?.map((skill, index) => (
                <div key={index} className="badge badge-primary gap-2">
                  {skill.skillName}
                  <span className="text-xs">({skill.proficiencyLevel})</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new skill..."
                value={newSkill.skillName}
                onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                className="input input-bordered flex-1"
              />
              <select
                value={newSkill.proficiencyLevel}
                onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                className="select select-bordered"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button className="btn btn-primary" onClick={handleAddSkill}>Add</button>
            </div>
          </div>

          {/* Skills to Learn Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="size-5" />
              Skills to Learn
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {authUser?.skillsToLearn?.map((skill, index) => (
                <div key={index} className="badge badge-secondary">
                  {skill.skillName}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a skill you want to learn..."
                value={newSkillToLearn}
                onChange={(e) => setNewSkillToLearn(e.target.value)}
                className="input input-bordered flex-1"
              />
              <button className="btn btn-primary" onClick={handleAddSkillToLearn}>Add</button>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileCheck className="size-5" />
              Certificates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authUser?.certificates?.map((cert, index) => (
                <div key={index} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-base">{cert.title}</h3>
                    <p className="text-sm text-base-content/70">
                      Uploaded on {new Date(cert.uploadDate).toLocaleDateString()}
                    </p>
                    <div className="card-actions justify-end">
                      <a
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        View Certificate
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Upload New Certificate</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Certificate Title"
                    value={certificateTitle}
                    onChange={(e) => setCertificateTitle(e.target.value)}
                    className="input input-bordered w-full"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="file-input file-input-bordered flex-1"
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleCertificateUpload}
                      disabled={!selectedFile || !certificateTitle}
                    >
                      <Upload className="size-5" />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-base">Activity Stats</h2>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Sessions Completed</div>
                  <div className="stat-value">{authUser?.sessionsCompleted || 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Skills</div>
                  <div className="stat-value">{authUser?.skills?.length || 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Certificates</div>
                  <div className="stat-value">{authUser?.certificates?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
