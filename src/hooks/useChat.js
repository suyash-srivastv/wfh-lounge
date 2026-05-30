import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { avatarColors } from '../constants';

export function useChat(user, tab, city) {
  const [chatRoom,       setChatRoom]       = useState(`${city}__general`);
  const [mobileChatView, setMobileChatView] = useState(() => window.innerWidth < 768 ? 'messages' : 'rooms');
  const [allChatMsgs,    setAllChatMsgs]    = useState({});
  const [chatInput,      setChatInput]      = useState('');
  const [chatLoading,    setChatLoading]    = useState(false);
  const chatEnd = useRef(null);

  // Reset to general when city changes; on mobile go straight to messages
  useEffect(() => {
    setChatRoom(`${city}__general`);
    if (window.innerWidth < 768) setMobileChatView('messages');
  }, [city]);

  // Scroll to latest message
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [allChatMsgs, chatRoom]);

  // Subscribe to active room messages
  useEffect(() => {
    if (tab !== 'chat') return;
    setChatLoading(true);
    const q = query(collection(db, 'chats', chatRoom, 'messages'), orderBy('timestamp'), limit(100));
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => {
        const data = d.data();
        const { bg, tc } = avatarColors(data.userId || data.user || '');
        return {
          id: d.id, user: data.user, text: data.text, bg, tc,
          time: data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
        };
      });
      setAllChatMsgs(p => ({ ...p, [chatRoom]: msgs }));
      setChatLoading(false);
    });
    return unsub;
  }, [tab, chatRoom]);

  async function sendChat() {
    if (!chatInput.trim() || !user) return;
    const text = chatInput.trim();
    setChatInput('');
    await addDoc(collection(db, 'chats', chatRoom, 'messages'), {
      text, user: user.name, userId: user.uid, timestamp: serverTimestamp(),
    });
  }

  const chatMsgs = allChatMsgs[chatRoom] || [];

  return { chatRoom, setChatRoom, mobileChatView, setMobileChatView, chatMsgs, chatLoading, chatInput, setChatInput, sendChat, chatEnd };
}
