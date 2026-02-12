import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
})

export type ChatListItem = {
  chat_id: string
  title: string
  created_at: string
}

export type HistoryUserMessage = {
  role: 'user'
  content: string | Record<string, unknown>
  timestamp: string
}

export type HistoryAssistantChunk = {
  type: 'message'
  message: {
    role: 'assistant'
    content: string
  }
}

export type HistoryAssistantMessage = {
  role: 'assistant'
  content: HistoryAssistantChunk[]
  timestamp: string
}

export type HistoryEntry = HistoryUserMessage | HistoryAssistantMessage

export type InterruptPayload = {
  type: 'interrupt'
  payload: string
  draft_email: {
    to: string[]
    subject: string
    body: string
    cc: string[] | null
    is_html: boolean
  }
}

export type StreamMessagePayload = {
  type: 'message'
  message: {
    role: 'assistant'
    content: string
  }
}

export type StreamEvent = StreamMessagePayload | InterruptPayload

export async function loginWithEmail(email: string) {
  const res = await api.post('/auth/login', { email })
  return res.data as { message?: string; detail?: string }
}

export async function verifyOtp(email: string, otp: string) {
  const res = await api.post('/auth/verify-otp-login', { email, otp })
  return res.data as {
    message?: string
    email?: string
    employee_id?: string
    detail?: string
  }
}

export async function fetchChatList(employeeId: string) {
  const res = await api.get<ChatListItem[]>(`/chats/lists/${employeeId}`)
  return res.data
}

export async function createChat(employeeId: string) {
  const res = await api.post<ChatListItem>(`/chats/lists/${employeeId}`)
  return res.data
}

export async function fetchChatHistory(employeeId: string, chatId: string) {
  const res = await api.get<HistoryEntry[] | { messages: HistoryEntry[] }>(
    `/chats/history/${employeeId}/${chatId}`,
  )
  return Array.isArray(res.data) ? res.data : res.data.messages
}

export async function deleteChat(employeeId: string, chatId: string) {
  await api.delete(`/chats/delete/${employeeId}/${chatId}`)
}

export async function getGoogleAuthUrl(employeeId: string) {
  const res = await api.get<{ authorization_url: string }>(
    `/oauth/google/connect`,
    {
      params: { user_id: employeeId },
    },
  )
  return res.data.authorization_url
}

export type InterruptAction = 'accept' | 'reject' | 'llmedit' | 'inplaceedit'

export type InterruptRespondBody = {
  to?: string[]
  subject?: string
  body?: string
  cc?: string[]
  is_html: boolean
  action: InterruptAction
  instructions?: string
}

export async function respondToInterrupt(
  employeeId: string,
  chatId: string,
  body: InterruptRespondBody,
) {
  const res = await api.post(`/chats/ai/interrupt/respond`, body, {
    params: { user_id: employeeId, chat_id: chatId },
  })
  return res.data
}

export async function streamInterruptRespond(params: {
  employeeId: string
  chatId: string
  body: InterruptRespondBody
  onMessage: (payload: StreamMessagePayload) => void
  onInterrupt: (payload: InterruptPayload) => void
}) {
  const controller = new AbortController()
  const { employeeId, chatId, body, onMessage, onInterrupt } = params

  const response = await fetch(
    `http://localhost:8000/chats/ai/interrupt/respond?user_id=${encodeURIComponent(
      employeeId,
    )}&chat_id=${encodeURIComponent(chatId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    },
  )

  if (!response.body) {
    throw new Error('No response body from interrupt endpoint')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)

      if (!line.startsWith('data:')) continue
      const jsonPart = line.slice('data:'.length).trim()
      if (!jsonPart) continue

      try {
        const parsed = JSON.parse(jsonPart) as StreamEvent
        if (parsed.type === 'message') {
          onMessage(parsed)
        } else if (parsed.type === 'interrupt') {
          onInterrupt(parsed)
        }
      } catch {
      }
    }
  }

  return {
    cancel: () => controller.abort(),
  }
}

export async function streamSendMessage(params: {
  employeeId: string
  chatId: string
  message: string
  onMessage: (payload: StreamMessagePayload) => void
  onInterrupt: (payload: InterruptPayload) => void
}) {
  const controller = new AbortController()
  const { employeeId, chatId, message, onMessage, onInterrupt } = params

  const response = await fetch('http://localhost:8000/chats/ai/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      user_id: employeeId,
      chat_id: chatId,
      message,
    }),
    signal: controller.signal,
  })

  if (!response.body) {
    throw new Error('No response body from send endpoint')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)

      if (!line.startsWith('data:')) continue
      const jsonPart = line.slice('data:'.length).trim()
      if (!jsonPart) continue
      try {
        const parsed = JSON.parse(jsonPart) as StreamEvent
        if (parsed.type === 'message') {
          onMessage(parsed)
        } else if (parsed.type === 'interrupt') {
          onInterrupt(parsed)
        }
      } catch {
      }
    }
  }
  return {
    cancel: () => controller.abort(),
  }
}

