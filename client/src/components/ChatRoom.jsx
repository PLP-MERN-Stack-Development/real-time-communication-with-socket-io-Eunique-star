import React, { useState, useEffect, useRef } from "react";
import { socket } from "../socket/socket"; // Import socket directly for connection check

function ChatRoom({
  messages,
  users,
  typingUsers,
  sendMessage,
  sendPrivateMessage,
  setTyping,
  currentUser,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 Task 5: Search
  const [showSidebar, setShowSidebar] = useState(false); // 📱 Task 5: Mobile UI
  const [isOnline, setIsOnline] = useState(socket.connected); // 🔌 Task 5: Connection Status

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Monitor Connection Status
  // Monitor Connection Status & Auto-Rejoin
  useEffect(() => {
    const onConnect = () => {
      setIsOnline(true);
      // 🔄 RECONNECTION LOGIC:
      // When server comes back, tell it who we are again!
      // Otherwise, we will be "Anonymous" to the server.
      if (currentUser) {
        socket.emit("user_join", currentUser);
      }
    };

    const onDisconnect = () => setIsOnline(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [currentUser]); // Add currentUser to dependency array

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, previewUrl]);

  // 🔍 Task 5: Filter Messages by Search Query
  const filteredMessages = messages.filter((msg) => {
    // 1. Check Room Logic (Global vs Private)
    let isInRoom = false;
    if (!selectedUser) {
      isInRoom = !msg.isPrivate;
    } else {
      const isMyMessageToThem =
        msg.sender === currentUser && msg.receiverId === selectedUser.id;
      const isTheirMessageToMe =
        msg.sender === selectedUser.username && msg.isPrivate;
      isInRoom = isMyMessageToThem || isTheirMessageToMe;
    }

    // 2. Check Search Query
    if (!isInRoom) return false;
    if (searchQuery.trim() === "") return true;
    return (
      msg.message &&
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // File Handling (Same as before)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) {
        alert("File too large (Max 1MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result);
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    const payload = { message: newMessage, image: selectedFile };

    if (selectedUser) {
      sendPrivateMessage(selectedUser.id, payload);
    } else {
      sendMessage(payload);
    }

    setNewMessage("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setTyping(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* 🔌 Task 5: Connection Status Banner */}
      {!isOnline && (
        <div className="absolute top-0 w-full bg-red-500 text-white text-center text-xs py-1 z-50">
          ⚠️ Disconnected. Reconnecting...
        </div>
      )}

      {/* --- SIDEBAR (Mobile Responsive) --- */}
      {/* On mobile, we toggle 'hidden' based on showSidebar state */}
      <div
        className={`w-full md:w-1/4 bg-white border-r border-gray-200 flex-col absolute md:relative z-20 h-full transition-transform duration-300 ${
          showSidebar ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="p-4 bg-blue-700 text-white font-bold text-lg shadow-md flex justify-between items-center">
          <span>PLP Chat App</span>
          {/* Mobile Close Button */}
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden text-white font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowSidebar(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition ${
              !selectedUser
                ? "bg-blue-100 text-blue-700 font-bold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <span className="mr-2">🌐</span> Global Chat
          </button>
        </div>

        <div className="p-4 text-xs font-bold text-gray-400 uppercase mt-2">
          Private Messages
        </div>
        <ul className="overflow-y-auto flex-1">
          {users
            .filter((u) => u.username !== currentUser)
            .map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowSidebar(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center transition ${
                    selectedUser?.id === user.id
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="relative mr-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <span>{user.username}</span>
                </button>
              </li>
            ))}
        </ul>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center z-10 gap-2">
          {/* 📱 Task 5: Mobile Menu Button */}
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden text-gray-600 mr-2"
          >
            ☰
          </button>

          <div className="flex items-center flex-1 overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">
              {selectedUser ? `🔒 ${selectedUser.username}` : "🌐 Global Chat"}
            </h2>
            {typingUsers.includes(selectedUser?.username) && (
              <span className="ml-2 text-xs text-gray-500 italic animate-pulse hidden sm:block">
                typing...
              </span>
            )}
          </div>

          {/* 🔍 Task 5: Message Search */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="🔍 Search..."
              className="border rounded-full px-3 py-1 text-sm w-24 md:w-48 focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {filteredMessages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              No messages found.
            </div>
          )}

          {filteredMessages.map((msg, index) => {
            const isMe = msg.sender === currentUser;
            if (msg.system)
              return (
                <div
                  key={index}
                  className="text-center text-xs text-gray-400 my-2"
                >
                  <span className="bg-gray-200 px-2 py-1 rounded-full">
                    {msg.message}
                  </span>
                </div>
              );

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-md p-3 rounded-lg shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs text-gray-500 mb-1 font-bold">
                      {msg.sender}
                    </div>
                  )}

                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Shared"
                      className="w-full rounded-lg mb-2 max-h-60 object-cover border border-white/20"
                    />
                  )}
                  {msg.message && <p className="break-words">{msg.message}</p>}

                  <div
                    className={`text-[10px] mt-1 text-right flex justify-end items-center gap-1 ${
                      isMe ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {/* ✅ Task 5: Delivery Acknowledgment (Simulated) */}
                    {isMe && <span>✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 bg-white border-t">
          {previewUrl && (
            <div className="mb-2 relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-16 md:h-20 rounded border border-gray-300"
              />
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                />
              </svg>
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Message..."
              className="flex-1 p-2 md:p-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm md:text-base"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-full hover:bg-blue-700 transition font-semibold shadow-sm text-sm md:text-base"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
