import { get, groupBy, reject } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'
import { ETHER_ADDRESS, tokens, ether, GREEN, RED } from '../helpers'

const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)

export const contractsLoadedSelector = createSelector(
  tokenLoaded,
  exchangeLoaded,
  (tl, el) => (tl && el)
)

// All orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
// export const allOrdersLoadedSelector = createSelector(allOrdersLoaded, loaded => loaded)
const allOrders = state => get(state, 'exchange.allOrders.data', [])
// export const allOrdersSelector = createSelector(allOrders, o => o)

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

// Filled orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
  filledOrders,
  (orders) => {
    // sort orders by asc date for price comparison
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)

    // decorate the orders
    orders = decorateFilledOrders(orders)

    // sort orders by desc date
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)
    return orders
  }
)

const decorateFilledOrders = (orders) => {
  // track previous order to compare history
  let previousOrder = orders[0]
  return (
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateFilledOrder(order, previousOrder)
      previousOrder = order // update the previous order once it's decorated
      return order
    })
  )
}

const decorateOrder = (order) => {
  let etherAmount
  let tokenAmount

  if (order.tokenGive == ETHER_ADDRESS) {
    etherAmount = order.amountGive
    tokenAmount = order.amountGet
  } else {
    etherAmount = order.amountGet
    tokenAmount = order.amountGive
  }

  // calculate token price to 5 decimal places
  const precision = 100000
  let tokenPrice = (etherAmount / tokenAmount)
  tokenPrice = Math.round(tokenPrice * precision) / precision

  return({
    ...order,
    etherAmount: ether(etherAmount),
    tokenAmount: tokens(tokenAmount),
    tokenPrice,
    formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss: a M/D')
  })
}

const decorateFilledOrder = (order, previousOrder) => {
  return({
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
  })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  if (previousOrder.id === orderId) {
    return GREEN
  }

  // show green price if order price higher than previous order
  // show red price if order price lower than previous order
  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN // success
  } else {
    return RED // danger
  }
}

const openOrders = state => {
  const all = allOrders(state)
  const filled = filledOrders(state)
  const cancelled = cancelledOrders(state)

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some((o) => o.id === order.id)
    const orderCancelled = cancelled.some((o) => o.id === order.id)
    return(orderFilled || orderCancelled)
  })

  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

// create order book
export const orderBookSelector = createSelector(
  openOrders,
  (orders) => {
    // decorate orders
    orders = decorateOrderBookOrders(orders)
    // group order by "orderType"
    orders = groupBy(orders, 'orderType')
    
    // fetch buy orders
    const buyOrders = get(orders, 'buy', [])
    // sort buy orders by token price
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
    }

    // fetch sell orders
    const sellOrders = get(orders, 'sell', [])
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
    }

    return orders
  }
)

const decorateOrderBookOrders = (orders) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateOrderBookOrder(order)
      return(order)
    })
  )
}

const decorateOrderBookOrder = (order) => {
  const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'
  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderFillClass: orderType === 'buy' ? 'sell' : 'buy'
  })
}
