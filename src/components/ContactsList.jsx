export default function ContactsList({
  title = "Chats",
  contacts = [],
  selectedTag,
  onSelect,
  searchValue,
  onSearchChange,
}) {
  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</p>
            <h2 className="text-xl font-bold text-slate-950">{contacts.length} {title.toLowerCase()}</h2>
          </div>
        </div>

        <div className="mt-4">
          <input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search contacts"
            className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {contacts.length === 0 ? (
          <div className="mt-12 text-center text-sm text-slate-500">No conversations yet. Start a chat by selecting a contact.</div>
        ) : (
          <ul className="space-y-3">
            {contacts.map((contact) => (
              <li
                key={contact.tag}
                onClick={() => onSelect(contact.tag)}
                className={`group cursor-pointer rounded-3xl border p-3 transition ${selectedTag === contact.tag ? "border-indigo-500 bg-white shadow-sm" : "border-transparent bg-white/80 hover:border-slate-300 hover:bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-950 text-white">
                    {contact.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-950">{contact.name || "Unknown"}</p>
                      {contact.lastMessageTime && (
                        <span className="text-xs text-slate-400">{new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                    <p className="truncate text-sm text-slate-500">{contact.lastMessage || "Start a new conversation"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span>{contact.tag}</span>
                  {contact.unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-950 px-2 py-1 text-white">{contact.unreadCount}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
