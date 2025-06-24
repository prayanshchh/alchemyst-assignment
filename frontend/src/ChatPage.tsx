import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { ScrollArea } from './components/ui/scroll-area';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Skeleton } from './components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
}

const AVATAR = {
  user: <Avatar><AvatarFallback>U</AvatarFallback></Avatar>,
  ai: <Avatar><AvatarFallback>A</AvatarFallback></Avatar>,
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now() + '-user',
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMsg, { id: Date.now() + '-loading', role: 'ai', content: '', loading: true }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading
            ? { ...msg, loading: false, content: 'This is a dummy assistant reply.' }
            : msg
        )
      );
      setLoading(false);
    }, 1200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dark flex min-h-screen flex-col bg-background">
      {/* Optional Header */}
      <Card className="rounded-none border-b bg-background/80">
        <CardContent className="py-3 px-4 text-lg font-semibold tracking-tight">DeepResearch Agent</CardContent>
      </Card>
      {/* Chat Area */}
      <div className="flex-1 overflow-hidden md:max-w-2xl w-full mx-auto flex flex-col">
        <ScrollArea className="h-full px-4 py-6 flex-1">
          <div ref={scrollRef} className="flex flex-col gap-3">
            {messages.length === 0 && (
              <Card className="mx-auto max-w-xs bg-muted/60">
                <CardContent className="py-6 text-center text-muted-foreground text-base">
                  Ask me anything to start your research journey!
                </CardContent>
              </Card>
            )}
            {messages.map((msg) => (
              <Card
                key={msg.id}
                className={
                  msg.role === 'user'
                    ? 'self-end bg-primary text-primary-foreground'
                    : 'self-start'
                }
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {msg.role === 'user' ? null : AVATAR.ai}
                  {msg.loading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <span className="whitespace-pre-line break-words text-base">{msg.content}</span>
                  )}
                  {msg.role === 'user' ? AVATAR.user : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
        {/* Input Bar */}
        <div className="sticky bottom-0 w-full bg-background/80">
          <Card className="rounded-none border-t bg-background/80">
            <CardContent className="p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your message..."
                className="flex-1"
                disabled={loading}
                autoFocus
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                Send
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 