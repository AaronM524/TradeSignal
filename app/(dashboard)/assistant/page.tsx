'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Spinner } from '@/components/ui/spinner'
import { Bot, User, Send, TrendingUp, BarChart3, Calculator, Sparkles } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: 'Analyze NVDA for me' },
  { icon: BarChart3, text: 'What signals are active right now?' },
  { icon: Calculator, text: 'Help me size a position with $10k account' },
  { icon: Sparkles, text: 'Explain what RSI oversold means' },
]

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
    return <span key={i}>{rendered}{i < lines.length - 1 && <br />}</span>
  })
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  .chat-input { flex:1;background:rgba(232,224,212,0.04);border:1px solid rgba(232,224,212,0.15);color:#e8e0d4;padding:12px 16px;font-family:"DM Sans",sans-serif;font-size:14px;outline:none;transition:border-color 0.2s;resize:none; }
  .chat-input::placeholder { color:rgba(232,224,212,0.25); }
  .chat-input:focus { border-color:rgba(232,224,212,0.4); }
  .chat-send { display:flex;align-items:center;justify-content:center;padding:12px 16px;background:#e8e0d4;color:#0a0a0a;border:none;cursor:pointer;transition:opacity 0.15s;flex-shrink:0; }
  .chat-send:hover { opacity:0.85; }
  .chat-send:disabled { opacity:0.35;cursor:not-allowed; }
  .prompt-btn { display:flex;align-items:center;gap:8px;padding:12px 16px;background:rgba(232,224,212,0.03);border:1px solid rgba(232,224,212,0.1);color:rgba(232,224,212,0.6);font-family:"DM Sans",sans-serif;font-size:13px;cursor:pointer;transition:all 0.15s;text-align:left; }
  .prompt-btn:hover { border-color:rgba(232,224,212,0.25);color:#e8e0d4;background:rgba(232,224,212,0.05); }
`

export default function AssistantPage() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div style={{ padding:'32px 40px', fontFamily:'"DM Sans",sans-serif', color:'#e8e0d4', height:'100vh', display:'flex', flexDirection:'column', background:'#0a0a0a', boxSizing:'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ marginBottom:'24px', flexShrink:0 }}>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'10px', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,224,212,0.4)', marginBottom:'8px' }}>AI</div>
        <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'32px', fontWeight:900, letterSpacing:'-0.02em', color:'#e8e0d4', lineHeight:1 }}>AI Assistant</h1>
        <p style={{ fontSize:'14px', color:'rgba(232,224,212,0.45)', marginTop:'6px', fontWeight:300 }}>Ask questions about stocks, setups, and trading strategies</p>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, border:'1px solid rgba(232,224,212,0.08)', display:'flex', flexDirection:'column', minHeight:0 }}>
        {/* Chat header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(232,224,212,0.07)', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <div style={{ width:32, height:32, border:'1px solid rgba(232,224,212,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bot size={14} style={{ color:'rgba(232,224,212,0.6)' }} />
          </div>
          <div>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.7)', letterSpacing:'0.06em' }}>TradeSignal AI</div>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'9px', color:'rgba(232,224,212,0.35)', letterSpacing:'0.06em' }}>Powered by Llama 3.1</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px', minHeight:0 }}>
          {messages.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center' }}>
              <div style={{ width:56, height:56, border:'1px solid rgba(232,224,212,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>
                <Sparkles size={22} style={{ color:'rgba(232,224,212,0.4)' }} />
              </div>
              <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'22px', fontWeight:700, color:'rgba(232,224,212,0.7)', marginBottom:'8px' }}>How can I help you today?</div>
              <p style={{ fontSize:'13px', color:'rgba(232,224,212,0.35)', marginBottom:'32px', fontWeight:300, maxWidth:'320px' }}>
                Ask me to analyze stocks, explain trade setups, or help with position sizing
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', maxWidth:'480px' }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button key={i} className="prompt-btn" onClick={() => sendMessage({ text: p.text })}>
                    <p.icon size={14} style={{ color:'rgba(232,224,212,0.4)', flexShrink:0 }} />
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {messages.map((message) => (
                <div key={message.id} style={{ display:'flex', gap:'12px', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {message.role === 'assistant' && (
                    <div style={{ width:28, height:28, border:'1px solid rgba(232,224,212,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                      <Bot size={12} style={{ color:'rgba(232,224,212,0.5)' }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth:'75%', padding:'12px 16px', fontSize:'14px', lineHeight:1.65,
                    background: message.role === 'user' ? '#e8e0d4' : 'rgba(232,224,212,0.04)',
                    color: message.role === 'user' ? '#0a0a0a' : '#e8e0d4',
                    border: message.role === 'user' ? 'none' : '1px solid rgba(232,224,212,0.08)',
                    fontFamily: '"DM Sans", sans-serif',
                  }}>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') return <div key={index}>{renderMarkdown(part.text)}</div>
                      if (part.type === 'tool-invocation') {
                        const t = part as any
                        return (
                          <div key={index} style={{ margin:'8px 0', padding:'6px 10px', border:'1px solid rgba(232,224,212,0.1)', fontFamily:'"DM Mono",monospace', fontSize:'10px', color:'rgba(232,224,212,0.45)', letterSpacing:'0.04em' }}>
                            {t.state === 'output-available' ? '✓' : '◌'} {t.toolName ?? t.name ?? 'tool'}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                  {message.role === 'user' && (
                    <div style={{ width:28, height:28, border:'1px solid rgba(232,224,212,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                      <User size={12} style={{ color:'rgba(232,224,212,0.5)' }} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div style={{ display:'flex', gap:'12px' }}>
                  <div style={{ width:28, height:28, border:'1px solid rgba(232,224,212,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Bot size={12} style={{ color:'rgba(232,224,212,0.5)' }} />
                  </div>
                  <div style={{ padding:'12px 16px', border:'1px solid rgba(232,224,212,0.08)', background:'rgba(232,224,212,0.04)', display:'flex', alignItems:'center', gap:'8px' }}>
                    <Spinner className="h-3 w-3" />
                    <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'11px', color:'rgba(232,224,212,0.4)', letterSpacing:'0.04em' }}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ borderTop:'1px solid rgba(232,224,212,0.07)', padding:'16px 20px', flexShrink:0 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', gap:'0' }}>
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about a stock, signal, or trading concept..."
              disabled={isLoading}
            />
            <button type="submit" className="chat-send" disabled={isLoading || !input.trim()}>
              {isLoading ? <Spinner className="h-4 w-4" /> : <Send size={15} />}
            </button>
          </form>
          <p style={{ marginTop:'10px', fontFamily:'"DM Mono",monospace', fontSize:'9px', color:'rgba(232,224,212,0.25)', textAlign:'center', letterSpacing:'0.04em' }}>
            AI responses are for educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}