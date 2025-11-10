export interface LoanOffer {
  id: number
  maker: string
  assetType: 'ERC20' | 'NFT' | 'Options'
  amount: number
  currency: string
  interestRate: number
  duration: number
  collateralAssetType: 'ERC20' | 'NFT' | 'Options'
  collateralType: string
  collateralRatio: number
  optionType?: 'Call' | 'Put'
  strikePrice?: number
  status: 'available' | 'funded' | 'settled'
  borrower?: string
  fundedDate?: string
  // NFT fields
  nftCollection?: string
  nftTokenId?: string
  // Options fields
  optionUnderlying?: string
  optionContractType?: 'Call' | 'Put'
  optionStrike?: number
  optionQuantity?: number
  // Collateral NFT fields
  collateralNftCollection?: string
  collateralNftFloor?: number
  // Collateral Options fields
  collateralOptionUnderlying?: string
  collateralOptionType?: 'Call' | 'Put'
}

export interface LoanAgreement extends LoanOffer {
  lender: string
  monthlyPayment: number
  totalRepayment: number
  collateralProvided: number
  startDate: string
  nextPayment: string
  paymentsRemaining: number
}

export interface SettledLoan {
  id: number
  amount: number
  currency: string
  interestRate: number
  duration: number
  collateralType: string
  collateralRatio: number
  borrower: string
  startDate: string
  endDate: string
  totalRepaid: number
  totalInterest: number
  status: 'settled'
  assetType: 'ERC20' | 'NFT' | 'Options'
  collateralAssetType: 'ERC20' | 'NFT' | 'Options'
}

export interface CreateLoanForm {
  assetType: 'ERC20' | 'NFT' | 'Options'
  amount: string
  currency: string
  interestRate: string
  duration: string
  collateralAssetType: 'ERC20' | 'NFT' | 'Options'
  collateralType: string
  collateralRatio: string
  optionType: 'Call' | 'Put'
  strikePrice: string
  validUntil: string
  // NFT fields
  nftCollection: string
  nftTokenId: string
  // Options fields
  optionUnderlying: string
  optionContractType: 'Call' | 'Put'
  optionStrike: string
  optionQuantity: string
  // Collateral NFT fields
  collateralNftCollection: string
  collateralNftFloor: string
  // Collateral Options fields
  collateralOptionUnderlying: string
  collateralOptionType: 'Call' | 'Put'
}

export interface FilterChip {
  value: string
  label: string
  type: string
  description: string
  colorClass: string
  category: 'currency' | 'collateral' | 'rate' | 'duration' | 'search'
}

export interface AmountFilter {
  min: number
  max: number
}

export interface LoanFilters {
  activeChips: FilterChip[]
  searchQuery: string
}
