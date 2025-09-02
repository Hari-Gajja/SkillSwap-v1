import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Camera, Mail, Phone, User, Award, Book, Upload, BookOpen, FileCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { connectedUsers, getUsers } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [newSkill, setNewSkill] = useState({ skillName: "", proficiencyLevel: "beginner" });
  const [newSkillToLearn, setNewSkillToLearn] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [certificateTitle, setCertificateTitle] = useState("");
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleRemoveProfilePic = async () => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", {
        removeProfilePic: true
      });
      
      if (res.data) {
        updateProfile(res.data);
        setSelectedImg(null);
        toast.success("Profile picture removed successfully");
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast.error(error.response?.data?.message || "Error removing profile picture");
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", {
        deleteCertificateId: certificateId
      });
      
      if (res.data) {
        updateProfile(res.data);
        toast.success("Certificate deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      toast.error(error.response?.data?.message || "Error deleting certificate");
    }
  };

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
      const updatedSkills = [...(authUser.skills || []), newSkill];
      const res = await axiosInstance.put("/auth/update-profile", {
        skills: updatedSkills
      });
      
      if (res.data) {
        updateProfile(res.data);
        toast.success("Skill added successfully");
        setNewSkill({ skillName: "", proficiencyLevel: "beginner" });
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      toast.error(error.response?.data?.message || "Error adding skill");
    }
  };

  const handleAddSkillToLearn = async () => {
    if (!newSkillToLearn) {
      return toast.error("Skill name is required");
    }

    try {
      const updatedSkillsToLearn = [...(authUser.skillsToLearn || []), { skillName: newSkillToLearn }];
      const res = await axiosInstance.put("/auth/update-profile", {
        skillsToLearn: updatedSkillsToLearn
      });
      
      if (res.data) {
        updateProfile(res.data);
        toast.success("Skill to learn added successfully");
        setNewSkillToLearn("");
      }
    } catch (error) {
      console.error("Error adding skill to learn:", error);
      toast.error(error.response?.data?.message || "Error adding skill to learn");
    }
  };

  const handleRemoveSkillToLearn = async (skillName) => {
    try {
      const updatedSkillsToLearn = authUser.skillsToLearn.filter(
        skill => skill.skillName !== skillName
      );
      const res = await axiosInstance.put("/auth/update-profile", {
        skillsToLearn: updatedSkillsToLearn
      });
      
      if (res.data) {
        updateProfile(res.data);
        toast.success("Skill to learn removed successfully");
      }
    } catch (error) {
      console.error("Error removing skill to learn:", error);
      toast.error(error.response?.data?.message || "Error removing skill to learn");
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
        const newCertificate = {
          title: certificateTitle,
          fileUrl: reader.result,
          uploadDate: new Date().toISOString()
        };

        const res = await axiosInstance.put("/auth/update-profile", {
          certificates: [...(authUser.certificates || []), newCertificate]
        });
        
        if (res.data) {
          updateProfile(res.data);
          toast.success("Certificate uploaded successfully");
          setSelectedFile(null);
          setCertificateTitle("");
          // Reset the file input
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
        }
      } catch (error) {
        console.error("Error uploading certificate:", error);
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
                {authUser?.profilePic && (
                  <button
                    onClick={handleRemoveProfilePic}
                    className="absolute top-0 right-0 bg-error text-base-100 rounded-full p-1"
                    title="Remove profile picture"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
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
                <div key={index} className="badge badge-secondary gap-2">
                  {skill.skillName}
                  <button
                    onClick={() => handleRemoveSkillToLearn(skill.skillName)}
                    className="btn btn-ghost btn-xs p-0"
                    title="Remove skill"
                  >
                    ×
                  </button>
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

          {/* Connections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="size-5" />
                Connections
              </h2>
              {connectedUsers.length > 3 && (
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowAllConnections(true)}
                >
                  View all ({connectedUsers.length})
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {connectedUsers.slice(0, 3).map((user) => (
                <div key={user._id} className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.name}
                          className="size-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-base-content/70">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Skills Summary */}
                      <div className="flex flex-wrap gap-2">
                        {user.skills?.length > 0 && (
                          <div className="flex gap-1 items-center">
                            <span className="text-xs font-medium">Teaches:</span>
                            <span className="badge badge-primary badge-sm">
                              {user.skills.length} skill{user.skills.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {user.skillsToLearn?.length > 0 && (
                          <div className="flex gap-1 items-center">
                            <span className="text-xs font-medium">Learns:</span>
                            <span className="badge badge-secondary badge-sm">
                              {user.skillsToLearn.length} skill{user.skillsToLearn.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions justify-end">
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserProfile(true);
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {connectedUsers.length === 0 && (
                <p className="text-base-content/70 col-span-full text-center py-4">
                  No connections yet. Start connecting with other users to learn and share skills!
                </p>
              )}
            </div>
          </div>

          {/* All Connections Modal */}
          <dialog id="all_connections_modal" className={`modal ${showAllConnections ? 'modal-open' : ''}`}>
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-lg mb-4">All Connections ({connectedUsers.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {connectedUsers.map((user) => (
                  <div key={user._id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.name}
                            className="size-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-base-content/70">{user.email}</p>
                          </div>
                        </div>

                        {/* Skills Summary */}
                        <div className="flex flex-wrap gap-2">
                          {user.skills?.length > 0 && (
                            <div className="flex gap-1 items-center">
                              <span className="text-xs font-medium">Teaches:</span>
                              <span className="badge badge-primary badge-sm">
                                {user.skills.length} skill{user.skills.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {user.skillsToLearn?.length > 0 && (
                            <div className="flex gap-1 items-center">
                              <span className="text-xs font-medium">Learns:</span>
                              <span className="badge badge-secondary badge-sm">
                                {user.skillsToLearn.length} skill{user.skillsToLearn.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="card-actions justify-end">
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserProfile(true);
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-action">
                <button 
                  className="btn"
                  onClick={() => setShowAllConnections(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={() => setShowAllConnections(false)}>
              <button>close</button>
            </form>
          </dialog>

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
                      <div className="flex gap-2">
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          View Certificate
                        </a>
                        <button
                          onClick={() => handleDeleteCertificate(cert._id)}
                          className="btn btn-error btn-sm"
                        >
                          Delete
                        </button>
                      </div>
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

        {/* User Profile Modal */}
        <dialog id="user_profile_modal" className={`modal ${showUserProfile ? 'modal-open' : ''}`}>
          <div className="modal-box max-w-3xl">
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">User Profile</h3>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => setShowUserProfile(false)}
                  >
                    ×
                  </button>
                </div>

                {/* User Basic Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.name}
                    className="size-24 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
                    <p className="text-base-content/70">{selectedUser.email}</p>
                    <p className="text-sm mt-1">📱 {selectedUser.mobileNumber}</p>
                  </div>
                </div>

                {/* Father's Name */}
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h4 className="text-sm text-base-content/70 flex items-center gap-2">
                      <User className="size-4" />
                      Father&apos;s Name
                    </h4>
                    <p>{selectedUser.fatherName}</p>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Award className="size-4" />
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills?.map((skill, index) => (
                      <div key={index} className="badge badge-primary">
                        {skill.skillName} ({skill.proficiencyLevel})
                      </div>
                    ))}
                    {!selectedUser.skills?.length && (
                      <p className="text-base-content/70">No skills listed yet</p>
                    )}
                  </div>
                </div>

                {/* Skills to Learn Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="size-4" />
                    Skills to Learn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skillsToLearn?.map((skill, index) => (
                      <div key={index} className="badge badge-secondary">
                        {skill.skillName}
                      </div>
                    ))}
                    {!selectedUser.skillsToLearn?.length && (
                      <p className="text-base-content/70">No skills to learn listed yet</p>
                    )}
                  </div>
                </div>

                {/* Certificates Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileCheck className="size-4" />
                    Certificates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.certificates?.map((cert, index) => (
                      <div key={index} className="card bg-base-200">
                        <div className="card-body p-4">
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
                    {!selectedUser.certificates?.length && (
                      <p className="text-base-content/70 col-span-full">No certificates uploaded yet</p>
                    )}
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h4 className="card-title text-base">Activity Stats</h4>
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">Sessions</div>
                        <div className="stat-value">{selectedUser.sessionsCompleted || 0}</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Skills</div>
                        <div className="stat-value">{selectedUser.skills?.length || 0}</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Certificates</div>
                        <div className="stat-value">{selectedUser.certificates?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowUserProfile(false)}>
            <button>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
};
export default ProfilePage;
