import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type {
  ChatListItem,
  HistoryEntry,
  HistoryAssistantMessage,
  StreamMessagePayload,
  InterruptPayload,
} from '../api/client'
import {
  fetchChatHistory,
  fetchChatList,
  createChat,
  streamSendMessage,
  streamInterruptRespond,
  getGoogleAuthUrl,
  deleteChat,
} from '../api/client'
import { useAuth } from '../state/auth'
import { InterruptPanel } from '../components/InterruptPanel'
import { WelcomePanel } from '../components/WelcomePanel'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { Toast, type ToastType } from '../components/Toast'
import { MessageContent } from '../components/MessageContent'

type LocalMessage =
  | {
      id: string
      role: 'user'
      content: string
      timestamp: string
    }
  | {
      id: string
      role: 'assistant'
      content: string
      timestamp: string
    }

type InterruptDecisionContent = {
  action?: string
  to?: string[]
  cc?: string[]
  subject?: string
  body?: string
  instructions?: string
  is_html?: boolean
}

function isInterruptDecisionContent(v: unknown): v is InterruptDecisionContent {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  if (typeof obj.action !== 'string') return false
  return true
}

function formatInterruptDecision(v: InterruptDecisionContent): string {
  const action = v.action ?? '—'
  const lines: string[] = []
  lines.push(`Decision: ${action}`)

  if (action === 'accept' || action === 'reject') {
    return lines.join('\n')
  }

  if (action === 'llmedit') {
    if (v.instructions) lines.push(`Instructions: ${v.instructions}`)
    return lines.join('\n')
  }

  if (v.to && v.to.length > 0) lines.push(`To: ${v.to.join(', ')}`)
  if (v.cc && v.cc.length > 0) lines.push(`CC: ${v.cc.join(', ')}`)
  if (typeof v.subject === 'string') lines.push(`Subject: ${v.subject}`)
  if (typeof v.is_html === 'boolean') lines.push(`HTML: ${v.is_html ? 'yes' : 'no'}`)
  if (typeof v.body === 'string') {
    lines.push('Body:')
    lines.push(v.body)
  }
  if (typeof v.instructions === 'string' && v.instructions.trim()) {
    lines.push(`Instructions: ${v.instructions}`)
  }

  return lines.join('\n')
}

const THINKING_STEPS = [
  'E-pilot is collecting data...',
  'E-pilot is reasoning...',
  'E-pilot is generating...',
]

function normalizeHistory(entries: HistoryEntry[]): LocalMessage[] {
  const result: LocalMessage[] = []
  for (const entry of entries) {
    if (entry.role === 'user') {
      const content = (() => {
        if (typeof entry.content === 'string') return entry.content
        if (isInterruptDecisionContent(entry.content)) {
          return formatInterruptDecision(entry.content)
        }
        return JSON.stringify(entry.content, null, 2)
      })()
      result.push({
        id: `${entry.role}-${entry.timestamp}`,
        role: 'user',
        content,
        timestamp: entry.timestamp,
      })
    } else if (entry.role === 'assistant') {
      const assist = entry as HistoryAssistantMessage
      const combined = (assist.content ?? [])
        .map((chunk) => chunk.message?.content ?? '')
        .filter(Boolean)
        .join('\n\n')
      result.push({
        id: `${entry.role}-${entry.timestamp}`,
        role: 'assistant',
        content: combined,
        timestamp: entry.timestamp,
      })
    }
  }
  return result
}

export function ChatPage() {
  const { employeeId, email, logout } = useAuth()
  const [chatList, setChatList] = useState<ChatListItem[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewChatDraft, setIsNewChatDraft] = useState(false)
  const [interrupt, setInterrupt] = useState<InterruptPayload | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ chatId: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: ToastType; title: string; message: string } | null>(null)
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)

  const currentChatTitle = useMemo(() => {
    if (!activeChatId) return isNewChatDraft ? 'New chat' : 'New chat'
    return chatList.find((c) => c.chat_id === activeChatId)?.title ?? 'Chat'
  }, [activeChatId, chatList, isNewChatDraft])

  useEffect(() => {
    if (!employeeId) return
    setLoadingChats(true)
    fetchChatList(employeeId)
      .then(setChatList)
      .catch((err) => {
        console.error(err)
        setError('Unable to load chats.')
      })
      .finally(() => setLoadingChats(false))
  }, [employeeId])

  useEffect(() => {
    if (!employeeId || !activeChatId) {
      setMessages([])
      return
    }
    setLoadingHistory(true)
    fetchChatHistory(employeeId, activeChatId)
      .then((history) => {
        setMessages(normalizeHistory(history))
      })
      .catch((err) => {
        console.error(err)
        setError('Unable to load chat history.')
      })
      .finally(() => setLoadingHistory(false))
  }, [employeeId, activeChatId])

  useEffect(() => {
    if (!isAssistantThinking) return undefined
    const id = window.setInterval(() => {
      setThinkingStep((step) => (step + 1) % THINKING_STEPS.length)
    }, 1500)
    return () => window.clearInterval(id)
  }, [isAssistantThinking])

  if (!employeeId) {
    return null
  }

  function handleSelectChat(chatId: string) {
    setIsNewChatDraft(false)
    setActiveChatId(chatId)
    setError(null)
  }

  function handleNewChat() {
    setIsNewChatDraft(true)
    setActiveChatId(null)
    setMessages([])
    setError(null)
  }

  function handleDeleteChatClick(e: React.MouseEvent, chatId: string) {
    e.stopPropagation()
    const chat = chatList.find((c) => c.chat_id === chatId)
    if (chat) {
      setDeleteConfirm({ chatId, title: chat.title })
    }
  }

  async function confirmDeleteChat() {
    if (!deleteConfirm || !employeeId) return
    setIsDeleting(true)
    try {
      await deleteChat(employeeId, deleteConfirm.chatId)
      setChatList((prev) => prev.filter((c) => c.chat_id !== deleteConfirm.chatId))
      if (activeChatId === deleteConfirm.chatId) {
        setActiveChatId(null)
        setMessages([])
      }
      setToast({
        type: 'success',
        title: 'Chat deleted',
        message: 'Chat history has been deleted successfully',
      })
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete chat. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleAuthenticateEmail() {
    if (!employeeId) return
    setError(null)
    setAuthLoading(true)
    try {
      const url = await getGoogleAuthUrl(employeeId as string)
      if (url) {
        window.location.href = url
      } else {
        setError('Unable to start email authentication.')
      }
    } catch (err) {
      console.error(err)
      setError('Unable to start email authentication.')
    } finally {
      setAuthLoading(false)
    }
  }

  function appendAssistantContent(payload: StreamMessagePayload) {
    setIsAssistantThinking(false)
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      const content = payload.message.content
      if (last && last.role === 'assistant') {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content: last.content ? `${last.content}\n\n${content}` : content,
          },
        ]
      }
      return [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        },
      ]
    })
  }

  async function ensureChatId(): Promise<string> {
    if (activeChatId && !isNewChatDraft) return activeChatId
    if (!employeeId) throw new Error('Missing employee id')
    const created = await createChat(employeeId)
    setChatList((prev) => [created, ...prev])
    setActiveChatId(created.chat_id)
    setIsNewChatDraft(false)
    return created.chat_id
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setError(null)
    setSending(true)

    const timestamp = new Date().toISOString()
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${timestamp}`,
        role: 'user',
        content: trimmed,
        timestamp,
      },
    ])
    setInput('')

    try {
      setIsAssistantThinking(true)
      setThinkingStep(0)
      const chatId = await ensureChatId()
      await streamSendMessage({
        employeeId: employeeId as string,
        chatId,
        message: trimmed,
        onMessage: (payload) => appendAssistantContent(payload),
        onInterrupt: (payload) => setInterrupt(payload),
      })
    } catch (err) {
      console.error(err)
      setError('Failed to send message.')
    } finally {
      setSending(false)
      setIsAssistantThinking(false)
    }
  }

  async function handleInterruptSubmit(body: {
    to?: string[]
    subject?: string
    body?: string
    cc?: string[]
    is_html: boolean
    action: 'accept' | 'reject' | 'llmedit' | 'inplaceedit'
    instructions?: string
  }) {
    if (!interrupt || !activeChatId) return
    setMessages((prev) => [
      ...prev,
      {
        id: `user-interrupt-${Date.now()}`,
        role: 'user',
        content: formatInterruptDecision(body),
        timestamp: new Date().toISOString(),
      },
    ])
    try {
      let gotNewInterrupt = false
      await streamInterruptRespond({
        employeeId: employeeId as string,
        chatId: activeChatId as string,
        body,
        onMessage: (payload) => appendAssistantContent(payload),
        onInterrupt: (payload) => {
          setInterrupt(payload)
          gotNewInterrupt = true
        },
      })
      if (!gotNewInterrupt) {
        setInterrupt(null)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to handle interrupt response.')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-900">
              {email}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:from-blue-700 hover:to-purple-700"
          >
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-1 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            Chat History
          </p>
          {loadingChats && (
            <p className="px-2 py-2 text-center text-[11px] text-gray-500">Loading…</p>
          )}
          {!loadingChats && chatList.length === 0 && (
            <p className="px-2 py-3 text-center text-[11px] text-gray-500">
              No chats yet
            </p>
          )}
          <ul className="space-y-0.5">
            {chatList.map((chat) => {
              const isActive = chat.chat_id === activeChatId && !isNewChatDraft
              const displayDate = new Date(chat.created_at)
              const formattedDate = displayDate.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li key={chat.chat_id}>
                  <div
                    className={`group relative flex items-center justify-between gap-1 rounded-lg px-2.5 py-2.5 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat.chat_id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="truncate text-xs font-semibold leading-tight">{chat.title}</p>
                      <p
                        className={`mt-1 truncate text-[11px] ${
                          isActive ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formattedDate}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChatClick(e, chat.chat_id)}
                      className={`flex-shrink-0 rounded-md p-1.5 opacity-0 transition-all group-hover:opacity-100 ${
                        isActive
                          ? 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                          : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                      }`}
                      title="Delete chat"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {currentChatTitle}
            </h2>
            <p className="text-[11px] text-gray-500">
              Ask about leave, HR, Personal queries and other internal topics. Also send emails to enhance your experience.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAuthenticateEmail}
            disabled={authLoading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authLoading ? 'Redirecting…' : 'Authenticate email'}
          </button>
        </header>

        <section className="flex-1 overflow-y-auto bg-gray-50">
          {loadingHistory && (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-gray-500">Loading conversation…</p>
            </div>
          )}
          {!loadingHistory && messages.length === 0 && email && (
            <WelcomePanel email={email} />
          )}
          {messages.length > 0 && (
            <div className="space-y-3 px-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <MessageContent content={msg.content} role={msg.role} />
                    <p
                      className={`mt-1 text-[10px] ${
                        msg.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isAssistantThinking && !loadingHistory && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-700/90 shadow-sm">
                    <p className="whitespace-pre-wrap font-medium text-gray-700/80">
                      {THINKING_STEPS[thinkingStep]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {messages.length === 0 && isAssistantThinking && !loadingHistory && (
            <div className="px-4 py-4">
              <div className="inline-block rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-700/90 shadow-sm">
                {THINKING_STEPS[thinkingStep]}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="border-y border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="min-h-[38px] flex-1 resize-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-xs font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </main>

      <InterruptPanel
        interrupt={interrupt}
        onClose={() => setInterrupt(null)}
        onSubmit={handleInterruptSubmit}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm !== null}
        title="Delete chat?"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteChat}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Toast
        type={toast?.type || 'info'}
        title={toast?.title || ''}
        message={toast?.message || ''}
        isOpen={toast !== null}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

