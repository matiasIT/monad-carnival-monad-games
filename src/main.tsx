import React from 'react'
import ReactDOM from 'react-dom/client'

import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  lightTheme,
  connectorsForWallets,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'

import { toPrivyWallet } from '@privy-io/cross-app-connect/rainbow-kit'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import './index.css'
import { monadTestnet } from './lib/chain'

// ========= PRIVY =========
import { PrivyProvider } from '@privy-io/react-auth'

// === ENV ===
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string
const PRIVY_CROSS_APP_ID = 'cmd8euall0037le0my79qpz42' // Monad Games ID

// Icono: pon un PNG en /public o cambia la ruta
const privyWallet = toPrivyWallet({
  id: PRIVY_CROSS_APP_ID,
  name: 'Monad Games ID (Privy)',
  iconUrl: '/mgid-icon.png',
})

// === Conectores de RainbowKit (sin WalletConnect en la UI) ===
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recomendados',
      wallets: [privyWallet, rainbowWallet, metaMaskWallet, coinbaseWallet, injectedWallet],
    },
  ],
  {
    appName: 'Carnival Shooter',
    // Requerido por tipos de RainbowKit. NO habilita WalletConnect si no lo listamos.
    projectId: 'not-used',
  }
)

// === wagmi config ===
const config = createConfig({
  connectors,
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        // ❌ Importante: quitamos "loginMethodsAndOrder" para evitar el error de tipos.
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: '#ad65ff' })}>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </React.StrictMode>
)
