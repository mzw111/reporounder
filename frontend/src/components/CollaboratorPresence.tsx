import { useDiffSocket } from '../hooks/useDiffSocket'

export function CollaboratorPresence({ reviewId }: { reviewId: string }) {
  const { isConnected } = useDiffSocket(reviewId)
  if (!isConnected) return null

  return <span className="font-mono text-code-sm text-primary">● Live</span>
}