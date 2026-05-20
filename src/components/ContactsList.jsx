import { useState, useEffect } from "react";
import API from "../utils/api.js";

export default function ContactsList({ onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await API.get("/auth/users");
        setContacts(res.data);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
        setError("Unable to load contacts.");
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="w-64 border-r bg-white p-4">
      <h2 className="text-lg font-bold mb-4">Contacts</h2>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <ul>
        {contacts.map((contact) => (
          <li
            key={contact.tag}
            onClick={() => onSelect(contact.tag)}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {contact.name} <span className="text-gray-500">{contact.tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
