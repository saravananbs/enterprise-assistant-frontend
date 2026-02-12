import { type FormEvent, useMemo, useState } from 'react'
import type { InterruptAction, InterruptPayload } from '../api/client'

type InterruptRespondPayload = {
  to?: string[]
  subject?: string
  body?: string
  cc?: string[]
  is_html: boolean
  action: InterruptAction
  instructions?: string
}

type Props = {
  interrupt: InterruptPayload | null
  onClose: () => void
  onSubmit: (body: InterruptRespondPayload) => Promise<void>
}

export function InterruptPanel({ interrupt, onClose, onSubmit }: Props) {
  const [action, setAction] = useState<InterruptAction>('accept')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [cc, setCc] = useState('')
  const [isHtml, setIsHtml] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useMemo(() => {
    if (!interrupt) return
    const draft = interrupt.draft_email
    setTo((draft.to ?? []).join(', '))
    setSubject(draft.subject ?? '')
    setBody(draft.body ?? '')
    setCc((draft.cc ?? []).join(', '))
    setIsHtml(Boolean(draft.is_html))
  }, [interrupt])

  if (!interrupt) return null

  function validate(): string | null {
    if (action === 'llmedit' && !instructions.trim()) {
      return 'Instructions are required for LLM edit.'
    }
    if (action === 'inplaceedit') {
      if (!to.trim() || !subject.trim() || !body.trim()) {
        return 'To, subject, and body are required for inplace edit.'
      }
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    try {
      const payload: InterruptRespondPayload = {
        action,
        is_html: isHtml,
      }
      if (action === 'llmedit') {
        payload.instructions = instructions.trim()
      }
      if (action === 'inplaceedit') {
        payload.to = to
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
        payload.subject = subject.trim()
        payload.body = body
        payload.cc = cc
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
      await onSubmit(payload)
    } catch (err) {
      console.error(err)
      setError('Failed to respond to interrupt.')
    } finally {
      setSubmitting(false)
    }
  }

  const actionLabels: Record<InterruptAction, string> = {
    accept: 'Send Email',
    reject: 'Discard Draft',
    llmedit: 'Rewrite using AI',
    inplaceedit: 'Edit Myself',
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/30 p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Email approval required</h2>
            <p className="mt-1 text-xs text-gray-500">Choose how you want to proceed with the drafted email.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-700">Action</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['accept', 'reject', 'llmedit', 'inplaceedit'] as InterruptAction[]).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAction(option)}
                    className={`rounded-md border px-2 py-1 text-left ${
                      action === option
                        ? 'border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {actionLabels[option]}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-[11px] font-medium text-gray-600">Draft email from assistant</p>
            <div className="space-y-1 text-[11px] text-gray-700">
              <p><span className="font-semibold">To:</span> {to || '—'}</p>
              <p><span className="font-semibold">Subject:</span> {subject || '—'}</p>
              <p><span className="font-semibold">Body:</span></p>
              <pre className="whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-gray-800 max-h-40 overflow-y-auto">{body || '—'}</pre>
            </div>
          </div>
          {(action === 'inplaceedit' || action === 'llmedit') && (
            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              {action === 'inplaceedit' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">To</label>
                    <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Subject</label>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">CC</label>
                    <input value={cc} onChange={(e) => setCc(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Body</label>
                    <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)}className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </>
              )}

              {action === 'llmedit' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Instructions for the assistant</label>
                  <textarea rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Explain how you want the email to be adjusted."/>
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={isHtml} onChange={(e) => setIsHtml(e.target.checked)} className="h-3 w-3 rounded border-gray-400 text-blue-600"/>
                <span>Send as HTML</span>
              </label>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {error}
            </div>
          )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300">
              {submitting ? 'Submitting…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

