import { wsOnOpen, wsOnClose, wsOnError } from '../utils/ws'

export default defineWebSocketHandler({
  open(peer) {
    wsOnOpen(peer)
  },
  close(peer) {
    wsOnClose(peer)
  },
  error(peer) {
    wsOnError(peer)
  }
})
