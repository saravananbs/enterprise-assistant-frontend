import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faClipboardList, faQuestionCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons'

export function WelcomePanel({ email }: { email: string }) {
  const userName = email.split('@')[0]

  const capabilities = [
    {
      icon: faEnvelope,
      title: 'Draft Emails',
      description: 'Help you compose professional emails and communications',
    },
    {
      icon: faClipboardList,
      title: 'Answer Policy Questions',
      description: 'Provide information about company policies and procedures',
    },
    {
      icon: faQuestionCircle,
      title: 'General Inquiries',
      description: 'Help with general work-related questions and clarifications',
    },
    {
      icon: faPaperPlane,
      title: 'Email Actions',
      description: 'Send emails directly through integrated email functionality',
    },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Hello, {userName}
        </h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          How may I help you today?
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="mb-2 text-blue-600">
                <FontAwesomeIcon icon={capability.icon} size="2x" />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">
                {capability.title}
              </h3>
              <p className="text-sm text-gray-600">{capability.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-center text-sm text-gray-700">
            Start by typing a message below!
          </p>
        </div>
      </div>
    </div>
  )
}
