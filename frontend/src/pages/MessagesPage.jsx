import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ethers } from "ethers";

const short = (addr) =>
  addr && addr !== ethers.ZeroAddress
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : "—";

export default function MessagesPage({
  wallet,
  connectWallet,
  setView,
  tasks,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // fetch all conversations for this wallet
  useEffect(() => {
    if (!wallet) return;
    fetchConversations();
  }, [wallet]);

  // realtime subscription to messages
  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);

    const channel = supabase
      .channel("room-" + selectedConv.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          if (payload.new.conversation_id === selectedConv.id) {
            setMessages((prev) => [...prev, payload.new]);
          }
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => supabase.removeChannel(channel);
  }, [selectedConv]);

  // scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(
        "poster_address.eq." +
          wallet.toLowerCase() +
          ",worker_address.eq." +
          wallet.toLowerCase(),
      )
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setConversations(data || []);
  };

  const fetchMessages = async (convId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    setLoading(true);

    console.log("Sending message:", {
      conversation_id: selectedConv.id,
      sender_address: wallet.toLowerCase(),
      content: newMessage.trim(),
    });

    const { data, error } = await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_address: wallet.toLowerCase(),
      content: newMessage.trim(),
    });

    console.log("Result:", { data, error });

    if (error) console.error("Send error:", error);
    else setNewMessage("");
    setLoading(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // get task title for a conversation
  const getTaskTitle = (conv) => {
    const task = tasks?.find((t) => t.id === conv.task_id);
    return task ? task.title : "Task #" + conv.task_id;
  };

  const getOtherParty = (conv) => {
    if (!wallet) return "—";
    if (conv.poster_address.toLowerCase() === wallet.toLowerCase()) {
      return short(conv.worker_address);
    }
    return short(conv.poster_address);
  };

  if (!wallet) {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p className="empty-title">Connect your wallet</p>
        <p className="empty-sub">Connect to see your messages.</p>
        <button className="btn btn-primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="messages-layout">
      {/* Conversations list */}
      <div className="conversations-list">
        <div className="conversations-header">
          <h2 className="conversations-title">Messages</h2>
          <p className="conversations-sub">
            {conversations.length} conversations
          </p>
        </div>
        {conversations.length === 0 ? (
          <div className="conversations-empty">
            <p>No conversations yet.</p>
            <p>Claim a task to start messaging!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={
                "conversation-item" +
                (selectedConv?.id === conv.id ? " active" : "")
              }
              onClick={() => setSelectedConv(conv)}
            >
              <div className="conversation-task-title">
                {getTaskTitle(conv)}
              </div>
              <div className="conversation-other">
                with {getOtherParty(conv)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message thread */}
      <div className="message-thread">
        {!selectedConv ? (
          <div className="empty">
            <p className="empty-sub">No conversations</p>
          </div>
        ) : (
          <>
            <div className="thread-header">
              <h3 className="thread-title">{getTaskTitle(selectedConv)}</h3>
              <span className="thread-sub">
                with {getOtherParty(selectedConv)}
              </span>
            </div>

            <div className="thread-messages">
              {messages.length === 0 ? (
                <p className="thread-empty">No messages yet. Say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_address === wallet.toLowerCase();
                  return (
                    <div
                      key={msg.id}
                      className={
                        "message-bubble" + (isMe ? " mine" : " theirs")
                      }
                    >
                      <p className="message-content">{msg.content}</p>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="thread-input-row">
              <textarea
                className="thread-input"
                placeholder="Type a message… (Enter to send)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
