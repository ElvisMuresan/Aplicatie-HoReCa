import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../SupabaseClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MenuItem {
  id: number;
  nume: string;
  descriere: string | null;
  pret: number;
  subcategorie: string;
  categorie: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  // Fetch menu data from Supabase
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const { data, error } = await supabase
          .from('menu')
          .select(`
            id,
            nume,
            descriere,
            pret,
            este_activ,
            subcategorii!inner(
              nume,
              categorii!inner(
                nume
              )
            )
          `)
          .eq('este_activ', true);

        if (error) throw error;

        const formattedData: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          nume: item.nume,
          descriere: item.descriere,
          pret: item.pret,
          subcategorie: item.subcategorii.nume,
          categorie: item.subcategorii.categorii.nume,
        }));

        setMenuData(formattedData);
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };

    fetchMenuData();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Bună ziua! Sunt asistentul pentru meniul restaurantului. Întreabă-mă orice despre felurile noastre, prețuri sau recomandări!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  // Clean markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove bold **text**
      .replace(/\*/g, '•')  // Replace * with bullet point •
      .replace(/#{1,6}\s/g, '') // Remove headers #
      .replace(/`/g, ''); // Remove code backticks
  };

  const createMenuContext = () => {
    if (menuData.length === 0) return "Menu data is currently loading...";

    const categorizedMenu = menuData.reduce((acc, item) => {
      if (!acc[item.categorie]) {
        acc[item.categorie] = {};
      }
      if (!acc[item.categorie][item.subcategorie]) {
        acc[item.categorie][item.subcategorie] = [];
      }
      acc[item.categorie][item.subcategorie].push(item);
      return acc;
    }, {} as Record<string, Record<string, MenuItem[]>>);

    let context = "RESTAURANT MENU:\n\n";
    
    for (const [category, subcategories] of Object.entries(categorizedMenu)) {
      context += `${category.toUpperCase()}:\n`;
      for (const [subcategory, items] of Object.entries(subcategories)) {
        context += `  ${subcategory}:\n`;
        items.forEach(item => {
          context += `    - ${item.nume}: ${item.pret} lei`;
          if (item.descriere) {
            context += ` (${item.descriere})`;
          }
          context += '\n';
        });
      }
      context += '\n';
    }

    return context;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const menuContext = createMenuContext();
      
      const systemPrompt = `You are a friendly and helpful restaurant menu assistant. You have access to the complete menu below.

${menuContext}

IMPORTANT INSTRUCTIONS:
- ALL PRICES ARE IN LEI (Romanian currency), NOT DOLLARS
- Always show prices as "XX lei" not "$XX"
- Answer questions about menu items, prices, descriptions, and categories in BOTH Romanian and English
- Make personalized recommendations based on customer preferences
- Be conversational and friendly
- If asked about items not on the menu, politely say they're not available
- Suggest similar alternatives when appropriate
- Use emojis occasionally to be friendly (but not excessively)
- Keep responses concise but informative
- When listing items, use simple dashes (-) or bullet points, NOT markdown asterisks
- DO NOT use **bold** formatting - just write normally
- DO NOT use markdown syntax like *, **, #, etc.
- Format lists with simple dashes like: - Item name (price lei)
- RESPOND IN THE SAME LANGUAGE the customer uses (Romanian or English)
- If customer writes in Romanian, respond in Romanian
- If customer writes in English, respond in English
- You understand both languages perfectly
- Write in plain text without markdown formatting

Customer question: ${input}`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanMarkdown(text), // Clean markdown formatting
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment. / Îmi pare rău, am probleme în procesarea cererii tale. Te rog încearcă din nou într-un moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-linear-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center text-white z-50"
          aria-label="Open chatbot"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-150 bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 max-sm:rounded-none">
          {/* Header */}
          <div className="bg-linear-to-br from-purple-600 to-indigo-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle size={22} />
              <span className="font-semibold text-lg">Menu Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors duration-200"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                } animate-[slideIn_0.3s_ease]`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap wrap-break-words leading-relaxed text-sm">
                    {message.content}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start animate-[slideIn_0.3s_ease]">
                <div className="bg-white text-gray-800 rounded-xl rounded-bl-sm shadow-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Întreabă despre meniu"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 bg-linear-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Add keyframe animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}