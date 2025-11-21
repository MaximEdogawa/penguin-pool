'use client'

import { toWalletAssets } from '@/entities/asset'
import type { AssetAmount, OfferDetails } from '@/entities/offer'
import { useCreateOffer, useWalletAddress } from '@/features/wallet'
import { useAmountInput, useThemeClasses } from '@/shared/hooks'
import { convertToSmallestUnit } from '@/shared/lib/utils/chia-units'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import { Loader2, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOfferStorage } from '../model/useOfferStorage'
import AssetSelector, { type ExtendedOfferAsset } from './AssetSelector'

interface CreateOfferModalProps {
  onClose: () => void
  onOfferCreated: (offer: OfferDetails) => void
}

export default function CreateOfferModal({ onClose, onOfferCreated }: CreateOfferModalProps) {
  const { t, isDark } = useThemeClasses()
  const createOfferMutation = useCreateOffer()
  const offerStorage = useOfferStorage()
  const { data: walletAddress } = useWalletAddress()

  // Form state with extended asset types for UI
  interface ExtendedCreateOfferForm {
    assetsOffered: ExtendedOfferAsset[]
    assetsRequested: ExtendedOfferAsset[]
    fee: AssetAmount
    memo?: string
    expirationEnabled?: boolean
    expirationDays?: number
    expirationHours?: number
    expirationMinutes?: number
  }

  const [form, setForm] = useState<ExtendedCreateOfferForm>({
    assetsOffered: [],
    assetsRequested: [],
    fee: 0,
    memo: '',
    expirationEnabled: false,
    expirationDays: 1,
    expirationHours: 0,
    expirationMinutes: 0,
  })

  // Fee input composable
  const feeInput = useAmountInput({
    value: form.fee,
    assetType: 'xch',
    onChange: (value) => {
      setForm((prev) => ({ ...prev, fee: value }))
    },
  })

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Initialize with one asset in each section
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      assetsOffered: [
        {
          assetId: '',
          amount: 0,
          type: 'xch',
          symbol: '',
        },
      ],
      assetsRequested: [
        {
          assetId: '',
          amount: 0,
          type: 'xch',
          symbol: '',
        },
      ],
    }))
  }, [])

  // Computed
  const isFormValid = useMemo(() => {
    return (
      form.assetsOffered.length > 0 &&
      form.assetsRequested.length > 0 &&
      form.assetsOffered.every(
        (asset) => asset.amount >= 0 && (asset.type === 'xch' || asset.assetId)
      ) &&
      form.assetsRequested.every(
        (asset) => asset.amount >= 0 && (asset.type === 'xch' || asset.assetId)
      ) &&
      form.fee >= 0
    )
  }, [form])

  // Methods
  const addOfferedAsset = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      assetsOffered: [
        ...prev.assetsOffered,
        {
          assetId: '',
          amount: 0,
          type: 'xch',
          symbol: '',
        },
      ],
    }))
  }, [])

  const removeOfferedAsset = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      assetsOffered: prev.assetsOffered.filter((_, i) => i !== index),
    }))
  }, [])

  const updateOfferedAsset = useCallback((index: number, asset: ExtendedOfferAsset) => {
    setForm((prev) => ({
      ...prev,
      assetsOffered: prev.assetsOffered.map((a, i) => (i === index ? asset : a)),
    }))
  }, [])

  const addRequestedAsset = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      assetsRequested: [
        ...prev.assetsRequested,
        {
          assetId: '',
          amount: 0,
          type: 'xch',
          symbol: '',
        },
      ],
    }))
  }, [])

  const removeRequestedAsset = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      assetsRequested: prev.assetsRequested.filter((_, i) => i !== index),
    }))
  }, [])

  const updateRequestedAsset = useCallback((index: number, asset: ExtendedOfferAsset) => {
    setForm((prev) => ({
      ...prev,
      assetsRequested: prev.assetsRequested.map((a, i) => (i === index ? asset : a)),
    }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMessage('')
      setSuccessMessage('')

      if (!isFormValid) {
        setErrorMessage('Please fill in all required fields')
        return
      }

      setIsSubmitting(true)

      try {
        // Convert form assets to the format expected by the wallet
        // Use utility function to ensure proper asset ID mapping
        const offerAssets = toWalletAssets(
          form.assetsOffered.map((asset) => ({
            ...asset,
            amount: Number(asset.amount) || 0,
          })),
          convertToSmallestUnit
        )

        const requestAssets = toWalletAssets(
          form.assetsRequested.map((asset) => ({
            ...asset,
            amount: Number(asset.amount) || 0,
          })),
          convertToSmallestUnit
        )

        const result = await createOfferMutation.mutateAsync({
          walletId: 1,
          offerAssets,
          requestAssets,
          fee: convertToSmallestUnit(Number(form.fee) || 0, 'xch'), // Fee is always in XCH
        })

        if (!result || !result.offer) {
          throw new Error('Wallet did not return a valid offer string')
        }

        const newOffer: OfferDetails = {
          id: result?.id || Date.now().toString(),
          tradeId: result?.tradeId || result?.id || 'unknown',
          offerString: result?.offer || '',
          status: 'active',
          createdAt: new Date(),
          assetsOffered: form.assetsOffered.map((asset) => ({
            assetId: asset.assetId || '',
            amount: Number(asset.amount) || 0, // Ensure amount is always a number
            type: asset.type,
            symbol: asset.symbol || asset.type.toUpperCase(),
          })),
          assetsRequested: form.assetsRequested.map((asset) => ({
            assetId: asset.assetId || '',
            amount: Number(asset.amount) || 0, // Ensure amount is always a number
            type: asset.type,
            symbol: asset.symbol || asset.type.toUpperCase(),
          })),
          fee: Number(form.fee) || 0, // Ensure fee is always a number
          creatorAddress: walletAddress?.address || 'unknown',
        }

        // Save offer to IndexedDB
        await offerStorage.saveOffer(newOffer, true) // true = isLocal

        setSuccessMessage('Offer created successfully!')
        onOfferCreated(newOffer)

        // Reset form
        setForm({
          assetsOffered: [],
          assetsRequested: [],
          fee: 0,
          memo: '',
          expirationEnabled: false,
          expirationDays: 1,
          expirationHours: 0,
          expirationMinutes: 0,
        })
        feeInput.reset()
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
        setErrorMessage(`Failed to create offer: ${errorMsg}`)
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, isFormValid, createOfferMutation, offerStorage, walletAddress, onOfferCreated, feeInput]
  )

  return (
    <Modal onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold ${t.text}`}>New Offer</h2>
          <button
            onClick={onClose}
            className={`${t.textSecondary} hover:${t.text} transition-colors`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Two Column Layout: Offered | Requested */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Offered Section */}
            <div className="space-y-3">
              <div>
                <h3 className={`text-base font-medium ${t.text} mb-0.5`}>Offered</h3>
                <p className={`text-xs ${t.textSecondary}`}>Add the assets you are offering.</p>
              </div>
              <div className="space-y-2">
                {form.assetsOffered.map((asset, index) => (
                  <AssetSelector
                    key={`offered-${index}`}
                    asset={{
                      ...asset,
                      searchQuery: asset.searchQuery || '',
                      showDropdown: asset.showDropdown || false,
                    }}
                    onUpdate={(updatedAsset) => updateOfferedAsset(index, updatedAsset)}
                    onRemove={() => removeOfferedAsset(index)}
                  />
                ))}
                <Button
                  type="button"
                  onClick={addOfferedAsset}
                  variant="secondary"
                  icon={Plus}
                  className="w-full"
                >
                  Add Asset
                </Button>
              </div>
            </div>

            {/* Requested Section */}
            <div className="space-y-3">
              <div>
                <h3 className={`text-base font-medium ${t.text} mb-0.5`}>Requested</h3>
                <p className={`text-xs ${t.textSecondary}`}>Add the assets you are requesting.</p>
              </div>
              <div className="space-y-2">
                {form.assetsRequested.map((asset, index) => (
                  <AssetSelector
                    key={`requested-${index}`}
                    asset={{
                      ...asset,
                      searchQuery: asset.searchQuery || '',
                      showDropdown: asset.showDropdown || false,
                    }}
                    onUpdate={(updatedAsset) => updateRequestedAsset(index, updatedAsset)}
                    onRemove={() => removeRequestedAsset(index)}
                  />
                ))}
                <Button
                  type="button"
                  onClick={addRequestedAsset}
                  variant="secondary"
                  icon={Plus}
                  className="w-full"
                >
                  Add Asset
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Section: Fee and Settings */}
          <div className={`border-t ${t.border} pt-3`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <div>
                <label className={`block text-xs font-medium ${t.textSecondary} mb-1.5`}>
                  Network Fee
                </label>
                <div className="flex items-center gap-2 mt-2.5">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    autoComplete="off"
                    spellCheck={false}
                    value={feeInput.value}
                    onChange={feeInput.onChange}
                    onBlur={feeInput.onBlur}
                    placeholder={feeInput.placeholder}
                    className={`flex-1 px-2 py-1.5 text-xs border ${t.border} rounded-lg backdrop-blur-xl ${t.input} ${t.text}`}
                  />
                  <span className={`text-xs ${t.textSecondary} whitespace-nowrap`}>XCH</span>
                </div>
              </div>
              <div className="min-h-[60px]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-medium ${t.textSecondary}`}>
                    Expiring offer
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        expirationEnabled: !prev.expirationEnabled,
                      }))
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full backdrop-blur-3xl transition-all duration-300 focus:outline-none focus:ring-2 ${t.focusRing} overflow-hidden ${
                      isDark
                        ? form.expirationEnabled
                          ? 'bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 shadow-lg shadow-amber-500/20'
                          : 'bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 shadow-lg'
                        : form.expirationEnabled
                          ? 'bg-gradient-to-r from-white/20 via-white/30 to-white/20 border border-white/30 shadow-lg shadow-slate-900/20'
                          : 'bg-gradient-to-r from-white/20 via-white/30 to-white/20 border border-white/30 shadow-lg'
                    }`}
                    aria-label="Toggle expiration"
                  >
                    {/* Glass reflection effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 rounded-full pointer-events-none" />
                    <span
                      className={`relative inline-block h-3 w-3 transform rounded-full backdrop-blur-3xl transition-all duration-300 shadow-lg ${
                        form.expirationEnabled
                          ? isDark
                            ? 'translate-x-[20px] bg-gradient-to-br from-white/30 via-white/20 to-white/10 border border-white/40'
                            : 'translate-x-[20px] bg-gradient-to-br from-white/50 via-white/40 to-white/30 border border-white/60'
                          : isDark
                            ? 'translate-x-0.5 bg-gradient-to-br from-white/30 via-white/20 to-white/10 border border-white/40'
                            : 'translate-x-0.5 bg-gradient-to-br from-white/50 via-white/40 to-white/30 border border-white/60'
                      } flex items-center justify-center`}
                    >
                      {/* Inner glass highlight */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full opacity-60" />
                    </span>
                  </button>
                </div>
                {/* Always render container with fixed height to prevent layout shift */}
                <div className="h-[52px] relative">
                  <div
                    className={`absolute inset-0 grid grid-cols-3 gap-2 transition-all duration-300 ${
                      form.expirationEnabled
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={form.expirationDays || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          setForm((prev) => ({
                            ...prev,
                            expirationDays: isNaN(value) ? 0 : Math.max(0, value),
                          }))
                        }}
                        placeholder="0"
                        disabled={!form.expirationEnabled}
                        className={`w-full px-2 py-1.5 text-xs border ${t.border} rounded-lg backdrop-blur-xl ${t.input} ${t.text} disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                      <label className={`block text-[10px] ${t.textSecondary} mt-1 text-center`}>
                        Days
                      </label>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={form.expirationHours || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          setForm((prev) => ({
                            ...prev,
                            expirationHours: isNaN(value) ? 0 : Math.max(0, Math.min(23, value)),
                          }))
                        }}
                        placeholder="0"
                        disabled={!form.expirationEnabled}
                        className={`w-full px-2 py-1.5 text-xs border ${t.border} rounded-lg backdrop-blur-xl ${t.input} ${t.text} disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                      <label className={`block text-[10px] ${t.textSecondary} mt-1 text-center`}>
                        Hours
                      </label>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={form.expirationMinutes || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          setForm((prev) => ({
                            ...prev,
                            expirationMinutes: isNaN(value) ? 0 : Math.max(0, Math.min(59, value)),
                          }))
                        }}
                        placeholder="0"
                        disabled={!form.expirationEnabled}
                        className={`w-full px-2 py-1.5 text-xs border ${t.border} rounded-lg backdrop-blur-xl ${t.input} ${t.text} disabled:opacity-50 disabled:cursor-not-allowed`}
                      />
                      <label className={`block text-[10px] ${t.textSecondary} mt-1 text-center`}>
                        Minutes
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {errorMessage && (
            <div
              className={`p-3 backdrop-blur-xl rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50/80 border-red-200/60'}`}
            >
              <p className={`text-xs ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                {errorMessage}
              </p>
            </div>
          )}

          {successMessage && (
            <div
              className={`p-3 backdrop-blur-xl rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800/40' : 'bg-green-50/80 border-green-200/60'}`}
            >
              <p className={`text-xs ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                {successMessage}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex justify-end gap-2 pt-3 border-t ${t.border}`}>
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              variant="primary"
              icon={isSubmitting ? undefined : Plus}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Offer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
