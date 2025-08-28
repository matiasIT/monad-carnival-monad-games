import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, http } from 'wagmi'
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { monadTestnet } from './lib/chain'

const config = getDefaultConfig({
  appName: 'Carnival Shooter',
  projectId: import.meta.env.VITE_WC_PROJECT_ID as string,
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http('https://testnet-rpc.monad.xyz') }
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({ accentColor: '#ad65ff' })}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
