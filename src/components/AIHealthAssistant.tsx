import { useState, useEffect } from 'react';
import { generateHealthResponse } from '../lib/openai';
import { Send, AlertCircle, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { logger } from '../utils/logger';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIHealthAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('AI Health Assistant initialized');
    setMessages([{
      role: 'assistant',
      content: 'Hello! I am your HealthAxis AI Assistant. How can I help you today?'
    }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      logger.info('Sending message to AI', { message: userMessage });
      const response = await generateHealthResponse(userMessage);
      logger.info('Received AI response', { responseLength: response.length });
      
      if (response.startsWith('Error:')) {
        logger.error('AI response error', { error: response });
        setError(response);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I apologize, but I'm having trouble processing your request. Please check the error message above." 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      logger.error('AI request failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble processing your request at the moment. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-b-3xl shadow-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              HealthAxis AI Assistant
            </h1>
            <p className="text-gray-600 mt-1">Your intelligent healthcare companion</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-start space-x-3 max-w-[85%]`}>
              {message.role === 'assistant' && (
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`rounded-3xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-900 rounded-tl-none shadow-md'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-md">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white rounded-3xl p-4 rounded-tl-none shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your health..."
            className="flex-1 p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Send className="h-5 w-5" />
            <span className="font-medium">Send</span>
          </button>
        </form>
        {error && (
          <div className="mt-3 flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHealthAssistant; 