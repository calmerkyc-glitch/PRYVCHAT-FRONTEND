import { useState, useEffect, useContext, useMemo } from "react";
import { io } from "socket.io-client";
import API from "../utils/api.js";
import ContactsList from "./ContactsList.jsx";
import UserDiscovery from "./UserDiscovery.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChatWindow() {
  const { user, logout } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeView, setActiveView] = useState("chats");
  const [contactsSubView, setContactsSubView] = useState("list");
  const [mobileMode, setMobileMode] = useState("list");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [lastReadMap, setLastReadMap] = useState({});

  const userTag = user?.user?.tag;
  const userName = user?.user?.name;

  useEffect(() => {
    if (!userTag) return;
    const saved = localStorage.getItem(`pryv_last_read_${userTag}`);
    setLastReadMap(saved ? JSON.parse(saved) : {});
  }, [userTag]);

  const updateLastRead = (contactTag, timestamp) => {
    if (!userTag || !contactTag) return;
    const next = { ...lastReadMap, [contactTag]: timestamp };
    setLastReadMap(next);
    localStorage.setItem(`pryv_last_read_${userTag}`, JSON.stringify(next));
  };

  useEffect(() => {
    if (!userTag) return;

    const fetchData = async () => {
      try {
        const [usersRes, messagesRes] = await Promise.all([
          API.get("/auth/users"),
          API.get(`/chat/messages/${encodeURIComponent(userTag)}`),
        ]);

        const verified = usersRes.data.filter((other) => other.tag !== userTag);
        setContacts(verified);
        setMessages(messagesRes.data);

        if (!selectedTag && verified.length > 0) {
          setSelectedTag(verified[0].tag);
        }
      } catch (err) {
        console.error("Failed to load chat data", err);
      }
    };

    fetchData();
  }, [userTag]);

  useEffect(() => {
    if (!userTag) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    const client = io(socketUrl);
    setSocket(client);

    client.on("receiveMessage", (msg) => {
      if (msg.receiverTag === userTag || msg.senderTag === userTag) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      client.disconnect();
    };
  }, [userTag]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return contacts
      .map((contact) => {
        const contactMessages = messages.filter(
          (msg) =>
            (msg.senderTag === contact.tag && msg.receiverTag === userTag) ||
            (msg.senderTag === userTag && msg.receiverTag === contact.tag)
        );

        const lastMessage = contactMessages.length > 0 ? contactMessages[contactMessages.length - 1] : null;
        const unreadCount = contactMessages.filter(
          (msg) =>
            msg.senderTag === contact.tag &&
            new Date(msg.createdAt) > new Date(lastReadMap[contact.tag] || 0)
        ).length;

        return {
          ...contact,
          lastMessage: lastMessage?.content || "Start a new conversation",
          lastMessageTime: lastMessage?.createdAt,
          unreadCount,
        };
      })
      .filter((contact) => {
        if (!normalizedSearch) return true;
        return (
          contact.name?.toLowerCase().includes(normalizedSearch) ||
          contact.tag?.toLowerCase().includes(normalizedSearch) ||
          contact.lastMessage?.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bTime - aTime;
      });
  }, [contacts, messages, search, lastReadMap, userTag]);

  useEffect(() => {
    if (!selectedTag && filteredContacts.length > 0) {
      setSelectedTag(filteredContacts[0].tag);
    }
  }, [filteredContacts, selectedTag]);

  const currentContact = filteredContacts.find((contact) => contact.tag === selectedTag) || null;
  const conversationMessages = useMemo(
    () =>
      messages
        .filter(
          (msg) =>
            currentContact &&
            ((msg.senderTag === currentContact.tag && msg.receiverTag === userTag) ||
              (msg.senderTag === userTag && msg.receiverTag === currentContact.tag))
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [messages, currentContact, userTag]
  );

  const selectContact = (tag) => {
    setSelectedTag(tag);
    setActiveView("chats");
    setContactsSubView("list");
    setMobileMode("conversation");
    const existing = messages
      .filter((msg) => msg.senderTag === tag && msg.receiverTag === userTag)
      .map((msg) => msg.createdAt);
    if (existing.length > 0) {
      updateLastRead(tag, existing[existing.length - 1]);
    } else {
      updateLastRead(tag, new Date().toISOString());
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !currentContact || !userTag || !socket) return;
    const messageData = {
      senderTag: userTag,
      receiverTag: currentContact.tag,
      content: input.trim(),
    };

    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, { ...messageData, createdAt: new Date().toISOString() }]);
    setInput("");
    updateLastRead(currentContact.tag, new Date().toISOString());
  };

  const showListPanel = mobileMode === "list";
  const showChatPanel = mobileMode === "conversation";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pryv Chat</p>
            <h1 className="text-2xl font-black text-slate-950">Secure Conversations</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Search
            </button>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-950 text-white">{userName?.charAt(0) || "U"}</span>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">{userTag}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl lg:flex-row">
          <div className={`${showListPanel ? "flex" : "hidden lg:flex"} min-h-0 flex-1 flex-col border-b border-slate-200 lg:w-[340px] lg:border-b-0 lg:border-r`}>
            <div className="border-b border-slate-200 px-4 py-4 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{activeView === "contacts" ? "Contacts" : activeView === "profile" ? "Profile" : "Messages"}</p>
                  <h2 className="text-lg font-semibold text-slate-950">{activeView === "contacts" ? "Contacts" : activeView === "profile" ? "Profile" : "Messages"}</h2>
                </div>
                {mobileMode === "conversation" && (
                  <button
                    onClick={() => setMobileMode("list")}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
              {['chats','contacts','profile'].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeView === view ? 'bg-indigo-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {view === 'chats' ? 'Chats' : view === 'contacts' ? 'Contacts' : 'Profile'}
                </button>
              ))}
            </div>

            {activeView === "profile" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-slate-700">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-950 text-3xl font-bold text-white">{userName?.charAt(0) || "U"}</div>
                <div>
                  <p className="text-lg font-semibold">{userName}</p>
                  <p className="text-sm text-slate-500">{userTag}</p>
                  <p className="text-sm text-slate-500 mt-1">{user?.user?.email || "No email"}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Log out
                </button>
              </div>
            ) : activeView === "contacts" ? (
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                  {["list", "discover"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setContactsSubView(mode)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${contactsSubView === mode ? "bg-indigo-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                      {mode === "list" ? "My Contacts" : "Discover"}
                    </button>
                  ))}
                </div>
                {contactsSubView === "discover" ? (
                  <UserDiscovery onStartChat={selectContact} currentUserTag={userTag} />
                ) : (
                  <ContactsList
                    title="My Contacts"
                    contacts={filteredContacts}
                    selectedTag={selectedTag}
                    onSelect={selectContact}
                    searchValue={search}
                    onSearchChange={setSearch}
                  />
                )}
              </div>
            ) : (
              <ContactsList
                title="Chats"
                contacts={filteredContacts}
                selectedTag={selectedTag}
                onSelect={selectContact}
                searchValue={search}
                onSearchChange={setSearch}
              />
            )}
          </div>

          <div className={`${showChatPanel ? "flex" : "hidden lg:flex"} min-h-0 flex-1 flex-col`}>
            <div className="border-b border-slate-200 px-6 py-5">
              {currentContact ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Chatting with</p>
                    <h2 className="text-2xl font-bold text-slate-950">{currentContact.name}</h2>
                    <p className="text-sm text-slate-500">{currentContact.tag}</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Secure channel</div>
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500">Pick a conversation to start chatting.</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {currentContact ? (
                <div className="space-y-4">
                  {conversationMessages.length === 0 ? (
                    <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                      No messages yet. Send the first secure note.
                    </div>
                  ) : (
                    conversationMessages.map((msg, index) => {
                      const isSender = msg.senderTag === userTag;
                      return (
                        <div key={`${msg.createdAt}-${index}`} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-[26px] px-4 py-3 text-sm shadow-sm ${isSender ? "bg-indigo-950 text-white" : "bg-slate-100 text-slate-900"}`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-400">
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isSender && <span>Sent</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                    Select a contact from the left panel to view your secure conversation history.
                  </div>
                </div>
              )}
            </div>

            {currentContact && (
              <div className="border-t border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    onClick={sendMessage}
                    className="rounded-3xl bg-indigo-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-900 disabled:opacity-60"
                    disabled={!input.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 block border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.2)] lg:hidden">
        <div className="mx-auto flex max-w-[700px] items-center justify-between">
          {[
            { id: "chats", label: "Chats" },
            { id: "contacts", label: "Contacts" },
            { id: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveView(tab.id);
                setMobileMode("list");
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${activeView === tab.id ? "bg-indigo-950 text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-3xl bg-slate-100 text-sm font-bold">{tab.label.charAt(0)}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
