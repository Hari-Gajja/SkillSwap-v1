import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { Bell, LogOut, MessageSquare, Settings, User, Users, BrainCircuit } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">SkillSwap</h1>
            </Link>

            {authUser && (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/peers" className="btn btn-sm gap-2">
                  <Users className="size-4" />
                  <span>Find Peers</span>
                </Link>
                <Link to="/quiz" className="btn btn-sm gap-2">
                  <BrainCircuit className="size-4" />
                  <span>Quiz & Problems</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <Link to="/notifications" className="btn btn-sm btn-ghost gap-2 relative">
                <Bell className="size-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-content text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </Link>
            )}
            
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="btn btn-sm gap-2" onClick={logout}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
