import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await axiosInstance.get("/connection/pending");
      setPendingRequests(response.data);
    } catch (error) {
      toast.error("Error fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, accept) => {
    try {
      await axiosInstance.post(`/connection/${requestId}/respond`, { accept });
      toast.success(accept ? "Connection accepted!" : "Connection declined");
      // Refresh the pending requests
      fetchPendingRequests();
    } catch (error) {
      toast.error("Error responding to request");
    }
  };

  if (loading) {
    return null;
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="card bg-base-200 shadow-lg w-80">
        <div className="card-body p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="size-4" />
            <h3 className="font-medium">Connection Requests</h3>
          </div>
          <div className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <div key={request._id} className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full">
                    <img 
                      src={request.fromUser.profilePic || "/avatar.png"}
                      alt={request.fromUser.name}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{request.fromUser.name}</p>
                  <p className="text-sm text-base-content/70">wants to connect</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(request._id, true)}
                    className="btn btn-success btn-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(request._id, false)}
                    className="btn btn-error btn-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRequests;
