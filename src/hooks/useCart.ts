'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'
import { VAT_RATE, FREE_DELIVERY_THRESHOLD, FLAT_SHIPPING_RATE } from '@/lib/utils/constants'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'line_total'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTax: () => number
  getShippingCost: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = crypto.randomUUID()
        const line_total = item.quantity * item.unit_price
        set((state) => ({
          items: [...state.items, { ...item, id, line_total }],
        }))
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity, line_total: quantity * item.unit_price }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.line_total, 0)
      },

      getTax: () => {
        return get().getSubtotal() * VAT_RATE
      },

      getShippingCost: () => {
        const subtotal = get().getSubtotal()
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const shipping = get().getShippingCost()
        return subtotal + subtotal * VAT_RATE + shipping
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'sp-cart-storage',
    }
  )
)
