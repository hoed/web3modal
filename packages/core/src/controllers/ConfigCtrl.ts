import { proxy, subscribe as valtioSub } from 'valtio/vanilla'
import type { ConfigCtrlState } from '../types/controllerTypes'
import { CoreUtil } from '../utils/CoreUtil'
import { ClientCtrl } from './ClientCtrl'
import { EventsCtrl } from './EventsCtrl'
import { OptionsCtrl } from './OptionsCtrl'

const state = proxy<ConfigCtrlState>({
  projectId: '',
  mobileWallets: undefined,
  desktopWallets: undefined,
  walletImages: undefined,
  chainImages: undefined,
  tokenImages: undefined,
  tokenContracts: undefined,
  standaloneChains: undefined,
  enableStandaloneMode: false,
  enableAuthMode: false,
  enableNetworkView: false,
  enableAccountView: true,
  enableExplorer: true,
  defaultChain: undefined,
  explorerExcludedWalletIds: undefined,
  explorerRecommendedWalletIds: undefined,
  termsOfServiceUrl: undefined,
  privacyPolicyUrl: undefined
})

// -- controller --------------------------------------------------- //
export const ConfigCtrl = {
  state,

  subscribe(callback: (newState: ConfigCtrlState) => void) {
    return valtioSub(state, () => callback(state))
  },

  setConfig(config: ConfigCtrlState) {
    EventsCtrl.initialize()
    OptionsCtrl.setStandaloneChains(config.standaloneChains)
    OptionsCtrl.setIsStandalone(
      Boolean(config.standaloneChains?.length) || Boolean(config.enableStandaloneMode)
    )
    OptionsCtrl.setIsAuth(Boolean(config.enableAuthMode))
    OptionsCtrl.setIsCustomMobile(Boolean(config.mobileWallets?.length))
    OptionsCtrl.setIsCustomDesktop(Boolean(config.desktopWallets?.length))
    OptionsCtrl.setWalletConnectVersion(config.walletConnectVersion ?? 1)

    if (!OptionsCtrl.state.isStandalone) {
      OptionsCtrl.setChains(ClientCtrl.client().chains)
      OptionsCtrl.setIsPreferInjected(
        ClientCtrl.client().isInjectedProviderInstalled() && CoreUtil.isPreferInjectedFlag()
      )
    }

    if (config.defaultChain) {
      OptionsCtrl.setSelectedChain(config.defaultChain)
    }

    CoreUtil.setWeb3ModalVersionInStorage()

    Object.assign(state, config)
  }
}
