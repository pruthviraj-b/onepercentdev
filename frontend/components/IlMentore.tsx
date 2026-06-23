'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'mentore';
  text: string;
}

interface IlMentoreProps {
  courseId: string;
  partNum: number;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IlMentore({ courseId, partNum, lessonTitle, isOpen, onClose }: IlMentoreProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize companion greeting when lesson changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'mentore',
          text: `Salute, my apprentice! I am Leonardo. I see you are studying "${lessonTitle}" in our modern Academy. To build masterworks of engineering, one must observe nature and understand the mechanics. How shall we dissect these principles today?`
        }
      ]);
    }
  }, [isOpen, lessonTitle]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Generate response based on selected prompt or typed input
  const getDaVinciResponse = (input: string): string => {
    const clean = input.toLowerCase();
    
    // Custom responses for specific inquiries
    if (clean.includes('gears') || clean.includes('mechanical')) {
      if (courseId === 'cloud') {
        return `Ah! Think of Cloud computing like a grand public clock tower. In the old days, every merchant needed their own small clock. But a centralized clock tower uses a single giant set of gears, distributed by iron linkages throughout the city square. When you request data, a gear in your browser triggers a cable that rotates a spool in the server. Virtualization is simply a way to let three different clock faces share the same drive shaft without their hands colliding!`;
      } else {
        return `A programming loop is like a water wheel linked to a series of stone grinding gears. The water flows continuously (the condition), driving the wheel around. Each rotation performs one iteration of the grindstone. When the grain is fully crushed, a latch releases, stopping the flow of water. The CPU registers are like the teeth of the gear, holding single values as they rotate into position!`;
      }
    }

    if (clean.includes('natural philosophy') || clean.includes('nature') || clean.includes('natural')) {
      return `To understand the digital, we must look to the rivers. Information flows like water seeking the path of least resistance. A network is a series of aqueducts and canals, with routers acting as sluice gates directing the current. If the volume of water is too great for one gate, we build a bypass channel (a load balancer) to prevent the fields from flooding. Observe the eddies in a stream—they are the buffers and caches of nature.`;
    }

    if (clean.includes('flying') || clean.includes('machine')) {
      return `If we were to design a flying machine based on these principles, it would require absolute coordination! The client is the pilot's eyes, observing the altitude. The server is the mechanical wings, translating muscle tension into lift. If the winds (traffic) increase, the machine must extend additional canvas sails—this is what you call 'auto-scaling' in your cloud architecture. All must remain in perfect geometric symmetry, or the machine will plunge to the earth.`;
    }

    // Default responses based on course context
    if (courseId === 'cloud') {
      if (clean.includes('network') || clean.includes('internet')) {
        return `A network is like the postal carriage system of the Medici. Each envelope has an address (IP) and is sealed to prevent eyes from reading it (HTTPS). If the bridge at Florence is washed out, the carriage driver routes through Pisa. Nature always finds another path, and so must our packages.`;
      }
      if (clean.includes('virtual') || clean.includes('vm') || clean.includes('hypervisor')) {
        return `Virtualization is the ultimate art of illusion. Imagine a single canvas upon which three painters paint separate works. By using cross-hatching and polarized lenses, each painter sees only their own creation. The canvas is the physical server; the lenses are the hypervisor. It is efficient, harmonious, and prevents one painter's spills from ruining another's work.`;
      }
      return `An excellent inquiry. Just as a cathedral requires a solid foundation in the soil before we raise the gold dome, cloud architecture requires understanding the raw physical elements: the copper wires, the magnetic discs, and the heat of the processors. Maintain proportions, keep your subnets isolated, and your system will stand for centuries.`;
    } else {
      if (clean.includes('variable')) {
        return `A variable is a labeled drawer in a craftsman's workshop. You write 'Spikes' on the drawer and store a count inside. When you need to construct a scaffold, you pull the drawer, read the value, and update the label when you add more spikes. Simple, organized, and essential for order.`;
      }
      if (clean.includes('function') || clean.includes('method')) {
        return `A function is a recipe for mixing paint. Rather than writing down 'grind lapis lazuli, mix with egg yolk, stir with cedar wood' every single time you need blue, you simply declare a process called 'CreateBluePaint'. When you invoke it, the work is done instantly. It keeps your workshop clean.`;
      }
      return `In coding, as in painting, every stroke must have purpose. Do not write a line of code unless it serves the overall composition. Simplify your algorithms as you would simplify the lines of a portrait, focusing only on the light and shade that define the truth.`;
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const newMsg: Message = { sender: 'user', text };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getDaVinciResponse(text);
      setMessages(prev => [...prev, { sender: 'mentore', text: response }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="mentore-drawer raised">
      <div className="mentore-header">
        <div className="mentore-title-wrap">
          <span className="mentore-avatar">🦉</span>
          <div>
            <h4 className="mentore-title">Il Mentore</h4>
            <span className="mentore-subtitle">da Vinci Study Companion</span>
          </div>
        </div>
        <button className="mentore-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="mentore-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-bubble-wrap ${msg.sender}`}>
            <div className="message-sender">{msg.sender === 'user' ? 'You' : 'Leonardo'}</div>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="message-bubble-wrap mentore">
            <div className="message-sender">Leonardo</div>
            <div className="message-bubble typing">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
      </div>

      <div className="mentore-quick-prompts">
        <button className="prompt-chip" onClick={() => handleSend('Explain this using mechanical gears.')}>
          ⚙️ Explain with Gears
        </button>
        <button className="prompt-chip" onClick={() => handleSend('What is the natural philosophy behind this?')}>
          🍃 Natural Philosophy
        </button>
        <button className="prompt-chip" onClick={() => handleSend('How would you design a flying machine for this?')}>
          🪶 Flying Machine Analogy
        </button>
      </div>

      <form 
        className="mentore-input-form" 
        onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
      >
        <input
          type="text"
          className="mentore-input"
          placeholder="Ask Leonardo a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="mentore-send-btn">Ask</button>
      </form>

      <style jsx>{`
        .mentore-drawer {
          position: fixed;
          top: var(--header-h);
          right: 0;
          bottom: 0;
          width: 330px;
          background: #fdfaf2; /* always parchment style */
          border-left: 2px solid #4c3821;
          display: flex;
          flex-direction: column;
          z-index: 99;
          box-shadow: -4px 0 16px rgba(0,0,0,0.1);
          animation: slideIn 0.25s ease-out;
          font-family: 'EB Garamond', Georgia, serif;
          color: #2b1803;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mentore-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #8b0000;
          color: #fdfaf2;
          border-bottom: 2px solid #4c3821;
        }

        .mentore-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mentore-avatar {
          font-size: 1.4rem;
        }

        .mentore-title {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .mentore-subtitle {
          font-size: 0.65rem;
          font-family: var(--font-ui);
          text-transform: uppercase;
          opacity: 0.8;
          letter-spacing: 0.05em;
        }

        .mentore-close-btn {
          background: transparent;
          border: none;
          color: #fdfaf2;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 4px;
        }

        .mentore-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fdfaf2;
        }

        .message-bubble-wrap {
          display: flex;
          flex-direction: column;
          max-width: 85%;
        }

        .message-bubble-wrap.user {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message-bubble-wrap.mentore {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-sender {
          font-family: 'Cinzel', serif;
          font-size: 0.62rem;
          text-transform: uppercase;
          color: #8b0000;
          margin-bottom: 2px;
        }

        .user .message-sender {
          color: #78644e;
        }

        .message-bubble {
          padding: 8px 12px;
          border: 1px solid #4c3821;
          background: #fbf8f0;
          font-size: 0.88rem;
          line-height: 1.45;
          box-shadow: 2px 2px 0 rgba(76, 56, 33, 0.15);
        }

        .user .message-bubble {
          background: #f5ecd5;
          box-shadow: 2px 2px 0 rgba(76, 56, 33, 0.25);
        }

        .typing span {
          display: inline-block;
          animation: bounce 1.4s infinite both;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }

        .mentore-quick-prompts {
          padding: 10px;
          background: #fbf8f0;
          border-top: 1px solid #e6d6b8;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .prompt-chip {
          background: #fdfaf2;
          border: 1px solid #4c3821;
          color: #2b1803;
          padding: 5px 8px;
          font-size: 0.72rem;
          text-align: left;
          cursor: pointer;
          font-family: 'Cinzel', serif;
          font-weight: 600;
          transition: all 0.1s ease;
        }

        .prompt-chip:hover {
          background: #8b0000;
          color: #fdfaf2;
          transform: translateY(-1px);
        }

        .mentore-input-form {
          display: flex;
          padding: 10px;
          background: #fdfaf2;
          border-top: 2px solid #4c3821;
          gap: 6px;
        }

        .mentore-input {
          flex: 1;
          border: 1px solid #4c3821;
          background: #fbf8f0;
          padding: 6px 10px;
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 0.85rem;
          outline: none;
          color: #2b1803;
        }

        .mentore-send-btn {
          background: #8b0000;
          color: #fdfaf2;
          border: 1px solid #4c3821;
          padding: 6px 12px;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
        }

        .mentore-send-btn:hover {
          background: #aa1111;
        }
      `}</style>
    </div>
  );
}
