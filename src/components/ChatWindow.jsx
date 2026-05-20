import { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import API from "../utils/api.js";
import ContactsList from "./ContactsList.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

const socket = io("http://localhost:5000");

export default function ChatWindow() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [receiverTag, setReceiverTag] = useState(null);
  const userTag = user?.user?.tag;

  useEffect(() => {
    if (!userTag || !receiverTag) return;

    const fetchMessages = async () => {
      const res = await API.get(`/chat/messages/${encodeURIComponent(userTag)}`);
      setMessages(res.data.filter((m) => m.receiverTag === receiverTag || m.senderTag === receiverTag));
    };

    fetchMessages();

    const handleReceive = (msg) => {
      if (msg.receiverTag === receiverTag || msg.senderTag === receiverTag) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceive);
    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [receiverTag, userTag]);

  const sendMessage = () => {
    if (input.trim() === "" || !receiverTag || !userTag) return;

    const msg = { senderTag: userTag, receiverTag, content: input };
    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
    setInput("");
  };

  return (
    <div className="flex h-screen">
      <ContactsList onSelect={setReceiverTag} />
      <div className="flex flex-col flex-1 bg-gray-100">
        <div className="flex-1 overflow-y-auto p-4">
          {receiverTag ? (
            messages.map((msg, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{msg.senderTag}: </span>
                <span>{msg.content}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Select a contact to start chatting</p>
          )}
        </div>
        {receiverTag && (
          <div className="p-4 border-t flex">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
