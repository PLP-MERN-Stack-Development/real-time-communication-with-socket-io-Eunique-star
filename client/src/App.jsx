import React, { useState } from "react";
import { useSocket } from "./socket/socket";
import JoinChat from "./components/JoinChat";
import ChatRoom from "./components/ChatRoom";

function App() {
  const {
    messages,
    users,
    typingUsers,
    connect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
  } = useSocket();

  const [username, setUsername] = useState(null);

  const handleJoin = (name) => {
    setUsername(name);
    connect(name);

    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  // 🔴 THE FIX: Check "username" instead of "isConnected"
  // This keeps the Chat Room open even if the connection drops,
  // allowing the Red Banner to show up.
  if (!username) {
    return <JoinChat onJoin={handleJoin} />;
  }

  return (
    <ChatRoom
      messages={messages}
      users={users}
      typingUsers={typingUsers}
      sendMessage={sendMessage}
      sendPrivateMessage={sendPrivateMessage}
      setTyping={setTyping}
      currentUser={username}
    />
  );
}

export default App;
