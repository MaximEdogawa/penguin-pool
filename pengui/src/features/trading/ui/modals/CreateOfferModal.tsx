'use client'

import type { OfferDetails } from '@/entities/offer'
import Modal from '@/shared/ui/Modal'
import type { OrderBookFilters, OrderBookOrder } from '../../lib/orderBookTypes'
import CreateOfferForm from '../make-offer/CreateOfferForm'

interface CreateOfferModalProps {
  onClose: () => void
  onOfferCreated: (offer: OfferDetails) => void
  initialOrder?: OrderBookOrder
  initialPriceAdjustments?: { requested: number; offered: number }
  filters?: OrderBookFilters
}

export default function CreateOfferModal({
  onClose,
  onOfferCreated,
  initialOrder,
  initialPriceAdjustments,
  filters,
}: CreateOfferModalProps) {
  return (
    <Modal onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-4">
        <CreateOfferForm
          order={initialOrder}
          onOfferCreated={onOfferCreated}
          onClose={onClose}
          mode="modal"
          initialPriceAdjustments={initialPriceAdjustments}
          filters={filters}
        />
      </div>
    </Modal>
  )
}
