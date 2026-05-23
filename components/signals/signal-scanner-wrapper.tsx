'use client'

import { SignalScanner } from './signal-scanner'

export function SignalScannerWrapper() {
  return <SignalScanner scanInterval={120000} />  // Scan every 2 minutes
}
