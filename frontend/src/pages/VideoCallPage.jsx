import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Monitor,
  Settings,
  Users,
  MessageCircle
} from "lucide-react";

const VideoCallPage = () => {
  const { authUser } = useAuthStore();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Get session ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');
  const userRole = urlParams.get('role');

  const initializeCall = useCallback(async () => {
    try {
      // Fetch session data
      if (sessionId) {
        const response = await axiosInstance.post(`/sessions/${sessionId}/join`);
        setSessionData(response.data.session);
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      initializePeerConnection();
      setCallStarted(true);
      
    } catch (error) {
      console.error("Error initializing call:", error);
      toast.error("Failed to initialize video call");
    }
  }, [sessionId]);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, [initializeCall]);

  const initializePeerConnection = () => {
    // This is a simplified WebRTC setup
    // In a real application, you would use a signaling server
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, send this to the other peer via signaling server
        console.log("ICE candidate:", event.candidate);
      }
    };
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track with screen share
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }
      
      setIsScreenSharing(true);
      
      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast.error("Failed to start screen sharing");
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
      
      localStreamRef.current = cameraStream;
      setIsScreenSharing(false);
      
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  };

  const endCall = async () => {
    try {
      if (sessionId) {
        await axiosInstance.post(`/sessions/${sessionId}/end`);
        toast.success("Session ended successfully");
      }
      
      cleanupCall();
      window.close(); // Close the video call window
      
    } catch (error) {
      console.error("Error ending call:", error);
      toast.error("Error ending session");
      cleanupCall();
      window.close();
    }
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      const message = {
        id: Date.now(),
        sender: authUser.name,
        text: chatInput,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages(prev => [...prev, message]);
      setChatInput("");
      
      // In a real app, send this via WebSocket or WebRTC data channel
    }
  };

  const formatCallDuration = () => {
    // Simple duration counter - in a real app, track actual call time
    return "00:00";
  };

  if (!callStarted) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">
            {sessionData ? `${sessionData.skill} Session` : 'Video Call'}
          </h1>
          {sessionData && (
            <span className="text-sm text-gray-300">
              with {userRole === 'teacher' ? sessionData.student?.name : sessionData.teacher?.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            Duration: {formatCallDuration()}
          </span>
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span className="text-sm">{participants.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="relative h-[calc(100vh-140px)] flex">
        {/* Remote video (main) */}
        <div className="flex-1 relative bg-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Remote user info overlay */}
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded">
            <span className="text-sm">
              {userRole === 'teacher' ? sessionData?.student?.name : sessionData?.teacher?.name}
            </span>
          </div>
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Local user info overlay */}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
            You {isScreenSharing && '(Screen)'}
          </div>
          
          {/* Video/Audio status indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            {!isVideoOn && (
              <div className="bg-red-500 p-1 rounded">
                <VideoOff className="size-3" />
              </div>
            )}
            {!isAudioOn && (
              <div className="bg-red-500 p-1 rounded">
                <MicOff className="size-3" />
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="text-sm">
                  <div className="font-medium text-blue-400">{message.sender}</div>
                  <div className="text-gray-300">{message.text}</div>
                  <div className="text-xs text-gray-500">{message.timestamp}</div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 input input-sm bg-gray-700 border-gray-600 text-white"
                />
                <button
                  onClick={sendChatMessage}
                  className="btn btn-sm btn-primary"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          className={`btn btn-circle ${isAudioOn ? 'btn-ghost' : 'btn-error'}`}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>

        {/* Video toggle */}
        <button
          onClick={toggleVideo}
          className={`btn btn-circle ${isVideoOn ? 'btn-ghost' : 'btn-error'}`}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>

        {/* Screen share */}
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`btn btn-circle ${isScreenSharing ? 'btn-info' : 'btn-ghost'}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor className="size-5" />
        </button>

        {/* Chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`btn btn-circle ${showChat ? 'btn-info' : 'btn-ghost'}`}
          title="Toggle chat"
        >
          <MessageCircle className="size-5" />
        </button>

        {/* Settings */}
        <button
          className="btn btn-circle btn-ghost"
          title="Settings"
        >
          <Settings className="size-5" />
        </button>

        {/* End call */}
        <button
          onClick={endCall}
          className="btn btn-circle btn-error"
          title="End call"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;
