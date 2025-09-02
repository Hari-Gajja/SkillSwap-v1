import { Bell, Check, Trash2 } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const { 
    notifications, 
    markAllAsRead, 
    clearNotifications, 
    markAsRead,
    handleConnectionRequest 
  } = useNotificationStore();

  useEffect(() => {
    // Mark all as read when visiting the notifications page
    markAllAsRead();
  }, [markAllAsRead]);

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

                      {/* Mark as Read Button */}
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
                          ) : !notification.read && (
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
