import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Phone, Calendar, MapPin } from "lucide-react";

const UserProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/auth/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Link to="/peers" className="btn btn-primary">
          <ArrowLeft className="size-4" />
          Back to Peers
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link to="/peers" className="btn btn-ghost gap-2 mb-8">
          <ArrowLeft className="size-4" />
          Back to Peers
        </Link>

        <div className="card bg-base-200">
          <div className="card-body">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="avatar">
                <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img 
                    src={user.profilePic || "/avatar.png"} 
                    alt={user.name} 
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Mail className="size-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.mobileNumber && (
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Phone className="size-4" />
                      <span>{user.mobileNumber}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-base-content/70">
                      <MapPin className="size-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.joinedAt && (
                    <div className="flex items-center gap-2 text-base-content/70">
                      <Calendar className="size-4" />
                      <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            {user.skills && user.skills.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <div 
                      key={index}
                      className="badge badge-lg badge-primary"
                      title={`Proficiency: ${skill.proficiencyLevel}`}
                    >
                      {skill.skillName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Section */}
            {user.bio && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-base-content/70">{user.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
