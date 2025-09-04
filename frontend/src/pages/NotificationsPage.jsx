import { Bell, Check, Trash2, Video } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const { 
    notifications, 
    markAllAsRead, 
    clearNotifications, 
    markAsRead,
    handleConnectionRequest 
  } = useNotificationStore();
  
  const navigate = useNavigate();
  const [bookingSession, setBookingSession] = useState(null);

  useEffect(() => {
    // Mark all as read when visiting the notifications page
    markAllAsRead();
  }, [markAllAsRead]);

  const bookSession = async (sessionId) => {
    try {
      setBookingSession(sessionId);
      await axiosInstance.post(`/sessions/${sessionId}/book`);
      toast.success("Session booked successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error booking session");
    } finally {
      setBookingSession(null);
    }
  };

  const joinSessionDirectly = async (sessionId) => {
    try {
      setBookingSession(sessionId);
      const response = await axiosInstance.post(`/sessions/${sessionId}/join`);
      const { videoCallRoom, userRole } = response.data;
      
      // Open video call in new window/tab
      const videoCallUrl = `/video-call/${videoCallRoom}?role=${userRole}&sessionId=${sessionId}`;
      window.open(videoCallUrl, '_blank', 'width=1200,height=800');
      
      toast.success("Joining session...");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error joining session");
    } finally {
      setBookingSession(null);
    }
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHours, startMinutes] = session.startTime.split(':');
    const [endHours, endMinutes] = session.endTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    if (now >= sessionStart && now <= sessionEnd) return 'ongoing';
    if (now > sessionEnd) return 'completed';
    if (now < sessionStart) return 'scheduled';
    return 'scheduled';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="btn btn-ghost btn-sm text-error gap-2"
              >
                <Trash2 className="size-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex flex-col gap-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="size-16 mx-auto mb-4 text-base-content/30" />
                <p className="text-base-content/70">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`
                    card bg-base-200 transition-colors
                    ${notification.read ? 'opacity-70' : 'ring-1 ring-primary'}
                    ${notification.type === 'session_live' ? 'ring-2 ring-success bg-success/10' : ''}
                  `}
                >
                  <div className="card-body py-4">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-full">
                          <img 
                            src={notification.user?.profilePic || "/avatar.png"}
                            alt={notification.user?.name}
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{notification.user?.name}</span>
                          {" "}{notification.message}
                        </p>
                        <span className="text-xs text-base-content/60">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {!notification.read && (
                        <>
                          {notification.type === 'connection_request' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleConnectionRequest(notification.requestId, true);
                                  toast.success(`Connected with ${notification.user.name}`);
                                }}
                                className="btn btn-success btn-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  handleConnectionRequest(notification.requestId, false);
                                  toast.error(`Declined connection request from ${notification.user.name}`);
                                }}
                                className="btn btn-error btn-sm"
                              >
                                Decline
                              </button>
                            </div>
                          ) : notification.type === 'session_invitation' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigate('/sessions');
                                  markAsRead(notification._id);
                                  toast.success("Redirected to sessions page");
                                }}
                                className="btn btn-outline btn-sm gap-1"
                              >
                                <Video className="size-4" />
                                View All
                              </button>
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="btn btn-ghost btn-sm btn-square text-primary"
                                title="Mark as read"
                              >
                                <Check className="size-4" />
                              </button>
                            </div>
                          ) : notification.type === 'session_live' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  await joinSessionDirectly(notification.sessionData.sessionId);
                                  markAsRead(notification._id);
                                }}
                                className="btn btn-success btn-sm gap-1 animate-pulse"
                              >
                                <Video className="size-4" />
                                Join Live
                              </button>
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="btn btn-ghost btn-sm btn-square text-primary"
                                title="Mark as read"
                              >
                                <Check className="size-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="btn btn-ghost btn-sm btn-square text-primary"
                              title="Mark as read"
                            >
                              <Check className="size-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Session Details for Invitations */}
                      {notification.type === 'session_invitation' && notification.sessionData && (
                        <div className="mt-3 p-3 bg-base-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Video className="size-4 text-primary" />
                            <span className="font-medium text-sm">{notification.sessionData.skill} Sessions</span>
                          </div>
                          
                          <div className="space-y-2">
                            {notification.sessionData.sessions.map((session) => {
                              const currentStatus = getSessionStatus(session);
                              const isSessionCompleted = currentStatus === 'completed';
                              const isSessionOngoing = currentStatus === 'ongoing';
                              const isSessionBooked = session.status === 'booked';
                              const isDisabled = isSessionCompleted || bookingSession === session._id;
                              
                              return (
                                <div key={session._id} className="flex items-center justify-between bg-base-100 p-2 rounded">
                                  <div className="text-xs">
                                    <div className="font-medium">
                                      {new Date(session.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-base-content/70">
                                      {session.startTime} - {session.endTime}
                                    </div>
                                    {session.price > 0 && (
                                      <div className="text-primary font-medium">
                                        ${session.price}
                                      </div>
                                    )}
                                    {isSessionOngoing && (
                                      <div className="text-success text-xs mt-1 font-medium">
                                        🟢 Live Now
                                      </div>
                                    )}
                                    {isSessionBooked && !isSessionOngoing && (
                                      <div className="text-info text-xs mt-1">
                                        Booked
                                      </div>
                                    )}
                                    {isSessionCompleted && (
                                      <div className="text-error text-xs mt-1">
                                        Session ended
                                      </div>
                                    )}
                                  </div>
                                  
                                  {isSessionOngoing ? (
                                    <button
                                      onClick={async () => {
                                        await joinSessionDirectly(session._id);
                                        markAsRead(notification._id);
                                      }}
                                      disabled={bookingSession === session._id}
                                      className="btn btn-success btn-xs gap-1"
                                    >
                                      {bookingSession === session._id ? (
                                        <>
                                          <span className="loading loading-spinner loading-xs"></span>
                                          Joining...
                                        </>
                                      ) : (
                                        <>
                                          <Video className="size-3" />
                                          Join Live
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        await bookSession(session._id);
                                        markAsRead(notification._id);
                                      }}
                                      disabled={isDisabled}
                                      className={`btn btn-xs gap-1 ${isDisabled ? 'btn-disabled' : 'btn-primary'}`}
                                    >
                                      {bookingSession === session._id ? (
                                        <>
                                          <span className="loading loading-spinner loading-xs"></span>
                                          Booking...
                                        </>
                                      ) : isSessionCompleted ? (
                                        'Ended'
                                      ) : (
                                        <>
                                          <Video className="size-3" />
                                          Book
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Live Session Details */}
                      {notification.type === 'session_live' && notification.sessionData && (
                        <div className="mt-3 p-3 bg-success/20 rounded-lg border border-success">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                              <Video className="size-4 text-success" />
                              <span className="font-medium text-sm text-success">{notification.sessionData.skill} - LIVE NOW</span>
                            </div>
                          </div>
                          <div className="text-xs text-base-content/70">
                            Session is currently active. Join now to participate!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
