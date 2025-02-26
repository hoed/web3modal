import {
  AccountCtrl,
  ClientCtrl,
  CoreUtil,
  OptionsCtrl,
  ToastCtrl,
  WcConnectionCtrl
} from '@web3modal/core'
import { LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

// -- constants ---------------------------------------------------- //
const THREE_MIN_MS = 180_000
const ONE_SEC_MS = 1_000

@customElement('w3m-wc-connection-context')
export class W3mWcConnectionContext extends LitElement {
  // -- lifecycle ---------------------------------------------------- //
  public constructor() {
    super()
    this.unwatchOptions = OptionsCtrl.subscribe(options => {
      if (options.selectedChain?.id !== this.selectedChainId) {
        this.selectedChainId = options.selectedChain?.id
        this.connectAndWait()
      }
    })
    this.unwatchAccount = AccountCtrl.subscribe(account => {
      if (this.isAccountConnected !== account.isConnected || !this.isGenerated) {
        this.isAccountConnected = account.isConnected
        // FIX setTimout(0) needed for WalletConnectLegacyConnector
        setTimeout(this.connectAndWait.bind(this), 0)
      }
    })
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this))
  }

  public disconnectedCallback() {
    this.unwatchOptions?.()
    this.unwatchAccount?.()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  // -- private ------------------------------------------------------ //
  private readonly unwatchOptions?: () => void = undefined
  private readonly unwatchAccount?: () => void = undefined
  private timeout?: NodeJS.Timeout = undefined
  private isGenerated = false
  private selectedChainId = OptionsCtrl.state.selectedChain?.id
  private isAccountConnected = AccountCtrl.state.isConnected
  private lastRetry = Date.now()

  private async connectAndWait() {
    clearTimeout(this.timeout)

    if (!this.isAccountConnected) {
      this.isGenerated = true
      this.timeout = setTimeout(this.connectAndWait.bind(this), THREE_MIN_MS)
      try {
        const { standaloneUri, selectedChain } = OptionsCtrl.state
        if (standaloneUri) {
          WcConnectionCtrl.setPairingUri(standaloneUri)
        } else {
          await ClientCtrl.client().connectWalletConnect(
            uri => WcConnectionCtrl.setPairingUri(uri),
            selectedChain?.id
          )
        }
      } catch (err) {
        console.error(err)
        WcConnectionCtrl.setPairingError(true)
        ToastCtrl.openToast('Connection request declined', 'error')
        if (Date.now() - this.lastRetry >= ONE_SEC_MS) {
          this.lastRetry = Date.now()
          this.connectAndWait()
        }
      }
    }
  }

  private onVisibilityChange() {
    if (!document.hidden && CoreUtil.isMobile()) {
      setTimeout(this.connectAndWait.bind(this), ONE_SEC_MS)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-wc-connection-context': W3mWcConnectionContext
  }
}
