import { useEffect, useRef, useState } from "react";
import { AlertCircle, Mic, MicOff, Send, Sparkles, Trash2, X } from "lucide-react";
import API from "../services/api";
let chronoLib = null;

async function ensureChrono() {
  if (chronoLib) return chronoLib;
  try {
    const mod = await import('chrono-node');
    chronoLib = mod.default || mod;
    return chronoLib;
  } catch (e) {
    console.warn('chrono-node dynamic import failed', e);
    return null;
  }
}
import "./AIChatbot.css";

const STORAGE_KEY = "ai_chatbot_history";

const generateMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function speakText(text) {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis failed:", e);
  }
}

function parseVoiceCreateTask(text) {
  if (!text || typeof text !== "string") return null;
  const raw = text.trim();
  const tl = raw.toLowerCase();

  const createIntents = ["create", "add", "make", "new task", "remind me", "set a task", "put a task", "schedule"];
  const hasIntent = createIntents.some((kw) => tl.includes(kw));

  if (!hasIntent) return null;

  let title = "";
  let description = "";

  const descSplit = raw.split(/(?:\s+and)?\s+(?:description|details)\s*(?:is|:)?\s*/i);
  if (descSplit.length > 1) {
    title = descSplit[0].trim();
    description = descSplit.slice(1).join(" ").trim();
  } else {
    title = raw.trim();
  }

  title = title
    .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+want\s+to\s+)?/i, "")
    .replace(/^(?:create|add|make|set|put|schedule)\s+(?:a\s+)?(?:new\s+)?(?:task\s*)?(?:to|called|named|with\s+title)?\s*/i, "")
    .replace(/^(?:title\s*(?:is|=|:)?\s*)/i, "")
    .replace(/^remind\s+me\s+(?:to\s+)?/i, "")
    .replace(/^(?:with\s+that\.?\s*)?/i, "")
    .trim();

  title = title.replace(/\s+(?:due|by|priority|before)\s+.*$/i, "").trim();
  description = description.replace(/^(?:is|are|=|:)\s+/i, "").trim();

  if (!title) return null;

  title = title.charAt(0).toUpperCase() + title.slice(1);

  const today = new Date();
  let due_date = today.toISOString().slice(0, 10);

  if (/\btomorrow\b/i.test(tl)) {
    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    due_date = tom.toISOString().slice(0, 10);
  } else if (/\bnext week\b/i.test(tl)) {
    const nw = new Date(today);
    nw.setDate(nw.getDate() + 7);
    due_date = nw.toISOString().slice(0, 10);
  } else {
    const dateMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) {
      due_date = dateMatch[1];
    }
  }

  let priority = "medium";
  if (/\b(high|urgent|important|critical)\b/i.test(tl)) {
    priority = "high";
  } else if (/\b(low|minor)\b/i.test(tl)) {
    priority = "low";
  }

  const start_date = today.toISOString().slice(0, 10);

  return {
    title,
    description,
    start_date,
    due_date,
    priority,
    completed: false,
  };
}

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I can help you manage tasks with natural language. Ask me to create, update, delete, restore, or list tasks.",
    timestamp: new Date().toISOString(),
  },
];

function loadSavedMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse saved chat history:", e);
  }
  return initialMessages;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AIChatbot({ visible = false, onClose, onTaskSync, onNavigateSection, onFilterStatus, onSetSearchQuery, onFillTaskForm }) {
  const [open, setOpen] = useState(visible);
  const [messages, setMessages] = useState(loadSavedMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setListening(true);
        setStatus("Listening...");
        setError("");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          // Automatically submit voice transcript
          handleVoiceSubmit(transcript);
        }
      };

      recognition.onerror = (event) => {
        setListening(false);
        setStatus("Online");
        if (event.error !== "no-speech") {
          console.error("Speech recognition error:", event.error);
          setError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setListening(false);
        setStatus("Online");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setListening(false);
      setStatus("Online");
    }
  };

  const handleVoiceSubmit = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return;

    const userMessage = {
      id: generateMessageId(),
      role: "user",
      text: transcriptText.trim(),
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput("");
    setLoading(true);
    setError("");
    setStatus("Processing...");

    if (pendingAction) {
      const handled = await handlePendingAction(userMessage.text);
      setStatus("Online");
      setLoading(false);
      if (handled) return;
    }

    const handledLocally = await handleLocalCommands(userMessage.text);
    if (handledLocally) {
      setStatus("Online");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/ai/chat", { message: userMessage.text });
      const data = response.data;
      const assistantText = data.ai_message || "I couldn't process that command.";
      addAssistantMessage(assistantText);

      if (onTaskSync) {
        onTaskSync();
      }
    } catch (err) {
      console.error("AI chat error:", err);
      setError(err.response?.data?.detail || "Unable to connect to AI assistant.");
      const failMsg = "Sorry, I had trouble processing that voice command.";
      addAssistantMessage(failMsg);
    } finally {
      setStatus("Online");
      setLoading(false);
    }
  };

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history to localStorage:", e);
    }
  }, [messages]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const clearHistory = () => {
    setMessages(initialMessages);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addMessage = (newMessage) => {
    setMessages((current) => [...current, newMessage]);
  };

  const addAssistantMessage = (content) => {
    const base = {
      id: generateMessageId(),
      role: "assistant",
      timestamp: new Date().toISOString(),
    };

    if (typeof content === "string") {
      addMessage({ ...base, text: content });
    } else if (content && Array.isArray(content.items)) {
      addMessage({ ...base, items: content.items, meta: content.meta });
    } else if (content && content.html) {
      addMessage({ ...base, html: content.html });
    } else {
      addMessage({ ...base, text: "I couldn't process that." });
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: generateMessageId(),
      role: "user",
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput("");
    setLoading(true);
    setError("");
    setStatus("Processing...");
    // If there's a pending action (e.g. awaiting due date), handle it first
    if (pendingAction) {
      const handled = await handlePendingAction(userMessage.text);
      setStatus("Online");
      setLoading(false);
      if (handled) return;
    }

    // Handle simple local commands without calling AI
    const handledLocally = await handleLocalCommands(userMessage.text);
    if (handledLocally) {
      setStatus("Online");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/ai/chat", { message: userMessage.text });
      const data = response.data;
      const assistantText = data.ai_message || "I couldn't process that command.";
      addAssistantMessage(assistantText);

      if (onTaskSync && data.result) {
        onTaskSync(data.result);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      setError(err.response?.data?.detail || "Unable to connect to AI assistant.");
      addAssistantMessage("Sorry, I had trouble processing that. Please try again.");
    } finally {
      setStatus("Online");
      setLoading(false);
    }
  };

  // Local intent handling for simple task management commands
  const handleLocalCommands = async (text) => {
    const t = text.trim();
    const tl = t.toLowerCase();

    // 1) Natural voice creation parsing:
    const taskPayload = parseVoiceCreateTask(t);
    if (taskPayload) {
      if (onFillTaskForm) {
        onFillTaskForm(taskPayload);
        const confirmMsg = `I've pre-filled the form with task details for "${taskPayload.title}". Please review the form and click "Add Task" to confirm.`;
        addAssistantMessage(confirmMsg);
        speakText(confirmMsg);
        return true;
      }
      try {
        const resp = await API.post("/tasks", taskPayload);
        const createdTask = resp.data;
        const successMsg = `Created task "${createdTask.title}" (Due: ${createdTask.due_date}, Priority: ${createdTask.priority}).`;
        addAssistantMessage(successMsg);
        speakText(successMsg);
        onTaskSync?.();
        return true;
      } catch (err) {
        console.error("Failed to create task via voice command:", err);
        const msg = err.response?.data?.detail || err.message || "Unknown error";
        const errMsg = `Sorry, I could not create the task. ${Array.isArray(msg) ? msg[0]?.msg || msg : msg}`;
        addAssistantMessage(errMsg);
        speakText(errMsg);
        return true;
      }
    }

    // Delete by id: 'delete task 3' or 'delete 3'
    const mDeleteId = tl.match(/^(?:delete|remove)\s+(?:task\s*)?#?(\d+)\b/);
    if (mDeleteId) {
      const id = Number(mDeleteId[1]);
      try {
        await API.delete(`/tasks/${id}`);
        const delMsg = `Deleted task ${id}.`;
        addAssistantMessage(delMsg);
        speakText(delMsg);
        onTaskSync?.();
      } catch (err) {
        console.error('Failed to delete task by id', err);
        const msg = err.response?.data?.detail || err.message || 'Unknown error';
        const errMsg = `Could not delete task id ${id}. ${Array.isArray(msg) ? msg[0]?.msg || msg : msg}`;
        addAssistantMessage(errMsg);
        speakText(errMsg);
      }
      return true;
    }

    // Complete / mark done by id
    const mCompleteId = tl.match(/^(?:complete|mark (?:as )?done|done)\s+(?:task\s*)?#?(\d+)\b/);
    if (mCompleteId) {
      const id = Number(mCompleteId[1]);
      try {
        const respAll = await API.get('/tasks');
        const existing = (respAll.data || []).find((it) => it.id === id);
        if (!existing) {
          const notFoundMsg = `Task id ${id} not found.`;
          addAssistantMessage(notFoundMsg);
          speakText(notFoundMsg);
          return true;
        }
        const payload = { ...existing, completed: true };
        await API.put(`/tasks/${id}`, payload);
        const doneMsg = `Marked task ${id} as completed.`;
        addAssistantMessage(doneMsg);
        speakText(doneMsg);
        onTaskSync?.();
      } catch (err) {
        console.error('Failed to mark complete', err);
        const msg = err.response?.data?.detail || err.message || 'Unknown error';
        const errMsg = `Could not mark task id ${id} as complete. ${Array.isArray(msg) ? msg[0]?.msg || msg : msg}`;
        addAssistantMessage(errMsg);
        speakText(errMsg);
      }
      return true;
    }

    // Update title: 'update task 3 title Buy milk'
    const mUpdateTitle = tl.match(/^(?:update|edit)\s+(?:task\s*)?#?(\d+)\s+title\s+(?:to\s+)?(.+)/i);
    if (mUpdateTitle) {
      const id = Number(mUpdateTitle[1]);
      const newTitle = mUpdateTitle[2].trim();
      try {
        const respAll = await API.get('/tasks');
        const existing = (respAll.data || []).find((it) => it.id === id);
        if (!existing) {
          addAssistantMessage(`Task id ${id} not found.`);
          return true;
        }
        const payload = { ...existing, title: newTitle };
        const resp = await API.put(`/tasks/${id}`, payload);
        addAssistantMessage(`Updated task ${resp.data.id} title to: ${resp.data.title}`);
        onTaskSync?.();
      } catch (err) {
        console.error('Failed to update title', err);
        const msg = err.response?.data?.detail || err.message || 'Unknown error';
        addAssistantMessage(`Could not update task id ${id}. ${Array.isArray(msg) ? msg[0]?.msg || msg : msg}`);
      }
      return true;
    }

    // Navigating UI sections & filtering commands: e.g. "show pending tasks", "go to completed", "filter high priority"
    const isPending = /\b(pending|incomplete|not done)\b/.test(tl);
    const isCompleted = /\b(completed|done|finished)\b/.test(tl);
    const isUpcoming = /\b(upcoming|due soon)\b/.test(tl);
    const isShowList = /\b(list|give|show|what|filter|view|open|go to|display)\b/.test(tl);

    if (isShowList) {
      if (isPending) {
        onNavigateSection?.("dashboard");
        onFilterStatus?.("pending");
        onSetSearchQuery?.("");
        addAssistantMessage("Filtered the web UI to show pending tasks.");
        return true;
      }
      if (isCompleted) {
        onNavigateSection?.("completed");
        onFilterStatus?.("all");
        onSetSearchQuery?.("");
        addAssistantMessage("Navigated to completed tasks view.");
        return true;
      }
      if (isUpcoming) {
        onNavigateSection?.("upcoming");
        onFilterStatus?.("all");
        onSetSearchQuery?.("");
        addAssistantMessage("Navigated to upcoming tasks view.");
        return true;
      }
      if (/\b(all tasks|dashboard|home|my tasks)\b/.test(tl)) {
        onNavigateSection?.("dashboard");
        onFilterStatus?.("all");
        onSetSearchQuery?.("");
        addAssistantMessage("Navigated to main tasks dashboard.");
        return true;
      }
    }

    try {
      const resp = await API.get('/tasks');
      const all = resp.data || [];
      let items = [];
      if (isPending) items = all.filter((it) => !it.completed);
      else if (isCompleted) items = all.filter((it) => it.completed);
      else items = all;

      if (items.length === 0) {
        const textMsg = isCompleted ? 'No completed tasks found.' : 'No pending tasks found.';
        addAssistantMessage(textMsg);
        return true;
      }

      // Send structured items to render as a table in chat
      const structured = items.map((it) => ({
        id: it.id,
        title: it.title,
        due_date: it.due_date || "",
        priority: it.priority || "medium",
        completed: !!it.completed,
      }));

      const title = isCompleted ? 'Completed Tasks' : isPending ? 'Pending Tasks' : 'Tasks';
      addAssistantMessage({ items: structured, meta: { title } });
      return true;
    } catch (err) {
      console.error('Failed to fetch tasks for list command', err);
      addAssistantMessage('Sorry, I could not fetch tasks right now.');
      return true;
    }
  };

  // Handle pending actions (e.g. awaiting due date)
  const handlePendingAction = async (text) => {
    if (!pendingAction) return false;
    if (pendingAction.type === "create") {
      const raw = text.trim().toLowerCase();
      // allow user to cancel pending action
      if (["cancel", "stop", "nevermind", "never mind", "no"].includes(raw)) {
        setPendingAction(null);
        addAssistantMessage("Canceled the pending action.");
        return true;
      }

      const dateStr = await parseDateFromText(text.trim());
      if (!dateStr) {
        addAssistantMessage("Sorry, I couldn't parse that date. Please reply with YYYY-MM-DD, 'today', or 'tomorrow'.");
        return true;
      }

      const { title, description } = pendingAction.payload;
      try {
        const today = new Date().toISOString().slice(0, 10);
        const payload = { title, description, start_date: today, due_date: dateStr, priority: "medium", completed: false };
        const resp = await API.post('/tasks', payload);
        addAssistantMessage(`Task created successfully: ${resp.data.title} (id ${resp.data.id})`);
        onTaskSync?.();
      } catch (err) {
        console.error('Failed to create task (pending)', err);
        const msg = err.response?.data?.detail || err.message || 'Unknown error';
        addAssistantMessage(`Sorry, I could not create the task. ${Array.isArray(msg) ? msg[0]?.msg || msg : msg}`);
      } finally {
        setPendingAction(null);
      }
      return true;
    }
    return false;
  };

  const parseDateFromText = async (text) => {
    if (!text) return null;
    const raw = text.trim().toLowerCase();
    if (raw === "today") return new Date().toISOString().slice(0, 10);
    if (raw === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }

    // Try ISO date first
    const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    // Try "in N days"
    const inDaysMatch = text.match(/in\s+(\d+)\s+days?/i);
    if (inDaysMatch) {
      const n = Number(inDaysMatch[1]);
      if (!Number.isNaN(n)) {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
      }
    }

    // Fallback to chrono-node natural language parsing (dynamically imported)
    try {
      const chrono = await ensureChrono();
      if (chrono && typeof chrono.parseDate === 'function') {
        const parsed = chrono.parseDate(text);
        if (parsed && !Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      }
    } catch (e) {
      // ignore and return null
    }

    return null;
  };


  const assistantClass = open ? "ai-chatbot-panel open" : "ai-chatbot-panel";

  return (
    <>
      <div className="ai-chatbot-toggle" onClick={() => setOpen((state) => !state)}>
        <Sparkles size={20} />
      </div>

      <div className={assistantClass}>
        <div className="ai-chatbot-header">
          <div>
            <span className="ai-chatbot-title">AI Task Assistant</span>
            <span className="ai-chatbot-status">● {status}</span>
          </div>
          <div className="ai-chatbot-header-actions">
            <button
              type="button"
              className="icon-btn small"
              title="Clear Chat History"
              aria-label="Clear chat history"
              onClick={clearHistory}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="icon-btn small"
              aria-label="Close chat"
              onClick={() => { setOpen(false); onClose?.(); }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="ai-chatbot-body">
          <div className="ai-message-list">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ${message.role}`}>
                {message.items ? (
                  <div className="ai-message-text ai-message-table">
                    <div className="ai-table-header">{message.meta?.title || 'Results'}</div>
                    <table className="ai-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Title</th>
                          <th>Due</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {message.items.map((it, idx) => (
                          <tr key={it.id}>
                            <td>{idx + 1}</td>
                            <td>{it.title}</td>
                            <td>{it.due_date || '-'}</td>
                            <td>{it.priority}</td>
                            <td>{it.completed ? 'Done' : 'Pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : message.html ? (
                  <div className="ai-message-text" dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  <div className="ai-message-text">{message.text}</div>
                )}
                <div className="ai-message-meta">
                  <span>{message.role === "user" ? "You" : "Assistant"}</span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="ai-chatbot-footer">
          <div className="ai-input-row">
            <button
              type="button"
              className={`voice-btn ${listening ? "active" : ""}`}
              onClick={toggleListening}
              title={listening ? "Listening... Click to stop" : "Voice AI Command (Click to speak)"}
              aria-label="Voice AI Command"
            >
              {listening ? <MicOff size={18} className="mic-pulse" /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={listening ? "Listening..." : "Type or speak your request..."}
            />
            <button type="button" className="send-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
              {loading ? <span className="spinner small" /> : <Send size={18} />}
            </button>
          </div>
          {error && (
            <div className="ai-chatbot-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AIChatbot;
