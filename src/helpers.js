export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
export const DECIMALS = (10**18)

export const GREEN = 'success'
export const RED = 'danger'

// shortcut to avoid passing around web3 connection
export const ether = (wei) => {
  if (wei) {
    return (wei / DECIMALS) // 18 decimal places
  }
}

// tokens and ether have same decimal resolution
export const tokens = ether
