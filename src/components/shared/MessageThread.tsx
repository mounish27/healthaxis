import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Send, Upload, FileText, Image } from 'lucide-react';
import { User as UserType } from '../../types';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  attachments?: {
    type: 'prescription' | 'image';
    url: string;
    name: string;
  }[];
}

interface MessageThreadProps {
  messages: Message[];
  currentUser: UserType;
  onSendMessage: (message: string) => void;
}

export default function MessageThread({
  currentUser,
  messages,
  onSendMessage
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<NonNullable<Message['attachments']>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (newMessage.trim() || (attachments && attachments.length > 0)) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setAttachments([]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: NonNullable<Message['attachments']> = Array.from(files).map(file => {
      const fileType = file.type.startsWith('image/') ? 'image' as const : 'prescription' as const;
      const objectUrl = URL.createObjectURL(file);
      
      return {
        type: fileType,
        url: objectUrl,
        name: file.name
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      if (!prev) return [];
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.senderId === currentUser.id 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{msg.content}</p>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {attachment.type === 'prescription' ? (
                        <FileText className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Image className="w-5 h-5 text-gray-500" />
                      )}
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {attachment.name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(msg.timestamp), 'h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg"
              >
                {attachment.type === 'prescription' ? (
                  <FileText className="w-4 h-4 text-gray-500" />
                ) : (
                  <Image className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
            multiple
            className="hidden"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 