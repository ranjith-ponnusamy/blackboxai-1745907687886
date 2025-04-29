import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function App() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('users', (userList) => {
      setUsers(userList.filter((user) => user !== username));
    });

    socket.on('receive_message', (msg) => {
      if (
        (msg.from === selectedUser && msg.to === username) ||
        (msg.from === username && msg.to === selectedUser)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('users');
      socket.off('receive_message');
    };
  }, [username, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = () => {
    if (username.trim()) {
      socket.emit('login', username.trim());
      setLoggedIn(true);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUser) {
      socket.emit('send_message', { to: selectedUser, message: messageInput.trim() });
      setMessages((prev) => [
        ...prev,
        { from: username, to: selectedUser, message: messageInput.trim(), timestamp: new Date().toISOString() },
      ]);
      setMessageInput('');
    }
  };

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-80">
          <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
          <input
            type="text"
            placeholder="Enter your username"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b border-gray-300">Contacts</h2>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 && <p className="p-4 text-gray-500">No contacts online</p>}
          {users.map((user) => (
            <button
              key={user}
              onClick={() => {
                setSelectedUser(user);
                setMessages([]);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-blue-100 transition ${
                selectedUser === user ? 'bg-blue-200 font-semibold' : ''
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="border-b border-gray-300 p-4 font-semibold">
          {selectedUser ? `Chat with ${selectedUser}` : 'Select a contact to start chatting'}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xs p-2 rounded ${
                msg.from === username ? 'bg-blue-500 text-white self-end' : 'bg-white text-gray-800 self-start'
              }`}
            >
              <div className="text-sm">{msg.message}</div>
              <div className="text-xs text-gray-300 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {selectedUser && (
          <div className="p-4 border-t border-gray-300 flex space-x-2">
            <input
              type="text"
              placeholder="Type a message"
              className="flex-1 p-2 border border-gray-300 rounded"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
