import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings, Sparkles, MessageSquare, FileEdit, BarChart, Globe2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import 'highlight.js/styles/github-dark.css';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

type Tool = 'chat' | 'editor' | 'chart';

function App() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      console.error('API key is missing! Please check your .env file');
    } else {
      console.log('API key found (first few chars):', apiKey.substring(0, 5) + '...');
      testApiKey(apiKey);
    }
  }, []);

  const testApiKey = async (apiKey: string) => {
    try {
      const response = await axios.post('https://api.groq.com/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log('API connection successful!', response.status);
    } catch (error: any) {
      console.error('API test failed:', error.response?.data || error.message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const callGroqAPI = async (userMessages: Message[]) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!apiKey) {
        console.error('API key is missing. Please check your .env file.');
        throw new Error('API key is missing');
      }
      
      console.log('Using API key (first few chars):', apiKey.substring(0, 5) + '...');
      
      const response = await axios.post('https://api.groq.com/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: userMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 2048
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error calling Groq API:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to get response from Groq API');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const conversationHistory = [...messages, userMessage];
      const aiResponse = await callGroqAPI(conversationHistory);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in chat completion:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t('error.apiError'),
        role: 'assistant',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const tools = [
    {
      id: 'chat' as Tool,
      name: t('tools.chat.name'),
      icon: MessageSquare,
      description: t('tools.chat.description')
    },
    {
      id: 'editor' as Tool,
      name: t('tools.editor.name'),
      icon: FileEdit,
      description: t('tools.editor.description')
    },
    {
      id: 'chart' as Tool,
      name: t('tools.chart.name'),
      icon: BarChart,
      description: t('tools.chart.description')
    }
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">
      {/* Sidebar */}
      <div className="w-[300px] bg-white border-r border-gray-200 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">{t('app.title')}</h2>
          </div>
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={i18n.language === 'en' ? '切换到中文' : 'Switch to English'}
          >
            <Globe2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <tool.icon className={`w-5 h-5 ${
                activeTool === tool.id ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <div className="flex-1 text-left">
                <div className={`font-medium ${
                  activeTool === tool.id ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {tool.name}
                </div>
                <div className="text-sm text-gray-500">{tool.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <button 
            onClick={() => {
              setMessages([]);
              setInput('');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>{t('app.newChat')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {tools.find(t => t.id === activeTool)?.name}
              </h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Chat Container */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 && (
              <div className="text-center mt-12">
                <Bot className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {t('app.welcome.title')}
                </h2>
                <p className="text-gray-600">{t('app.welcome.subtitle')}</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}
              >
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`flex-1 rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-6 mr-12">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Form */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('input.placeholder', {
                  tool: tools.find(t => t.id === activeTool)?.name
                })}
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 resize-none"
                style={{ maxHeight: '200px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              {t('input.hint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;