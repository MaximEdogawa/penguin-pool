import type { CoreTypes, ProposalTypes } from '@walletconnect/types'

export enum SageMethod {
  // Authentication
  LogIn = 'log_in',
  GetLoggedInFingerprint = 'get_logged_in_fingerprint',
  GetPublicKeys = 'get_public_keys',
  GetPrivateKey = 'get_private_key',

  // Wallet Management
  GetWallets = 'get_wallets',
  CreateNewWallet = 'create_new_wallet',
  GetWalletBalance = 'get_wallet_balance',
  GetWalletBalances = 'get_wallet_balances',
  GetCurrentAddress = 'get_current_address',
  GetNextAddress = 'get_next_address',

  // Sync and Status
  GetSyncStatus = 'get_sync_status',
  GetHeightInfo = 'get_height_info',
  GetNetworkInfo = 'get_network_info',

  // Transactions
  GetTransaction = 'get_transaction',
  GetTransactions = 'get_transactions',
  GetTransactionCount = 'get_transaction_count',
  SendTransaction = 'send_transaction',
  SendTransactionMulti = 'send_transaction_multi',

  // Coins and Selection
  GetCoinRecords = 'get_coin_records',
  GetCoinRecordsByNames = 'get_coin_records_by_names',
  GetSpendableCoins = 'get_spendable_coins',
  SelectCoins = 'select_coins',
  GetFarmedAmount = 'get_farmed_amount',

  // Signing and Verification
  SignMessageById = 'sign_message_by_id',
  SignMessageByAddress = 'sign_message_by_address',
  VerifySignature = 'verify_signature',

  // Offers and Trading
  GetAllOffers = 'get_all_offers',
  GetOffersCount = 'get_offers_count',
  CreateOfferForIds = 'create_offer_for_ids',
  CancelOffer = 'cancel_offer',
  CheckOfferValidity = 'check_offer_validity',
  TakeOffer = 'take_offer',
  GetOfferSummary = 'get_offer_summary',
  GetOffer = 'get_offer',

  // CAT Wallets
  CreateNewCatWallet = 'create_new_cat_wallet',
  GetCatWalletInfo = 'cat_get_wallet_info',
  GetCatAssetId = 'cat_get_asset_id',
  SpendCat = 'cat_spend',
  AddCatToken = 'cat_set_name',
  GetCatList = 'get_cat_list',

  // NFT Wallets
  GetNfts = 'nft_get_nfts',
  GetNftInfo = 'nft_get_info',
  MintNft = 'nft_mint_nft',
  TransferNft = 'nft_transfer_nft',
  GetNftsCount = 'nft_count_nfts',

  // DID Wallets
  CreateNewDidWallet = 'create_new_did_wallet',
  SetDidName = 'did_set_wallet_name',
  SetNftDid = 'nft_set_nft_did',
  GetNftWalletsWithDids = 'nft_get_wallets_with_dids',

  // Notifications
  GetNotifications = 'get_notifications',
  SendNotification = 'send_notification',
  DeleteNotifications = 'delete_notifications',
}

// Determine chain ID based on environment
const isTestnet =
  typeof window !== 'undefined'
    ? window.location.hostname.includes('localhost') || window.location.hostname.includes('testnet')
    : true

export const CHIA_CHAIN_ID = isTestnet ? 'chia:testnet' : 'chia:mainnet'

export const REQUIRED_NAMESPACES: ProposalTypes.RequiredNamespaces = {
  chia: {
    methods: Object.values(SageMethod),
    chains: [CHIA_CHAIN_ID],
    events: [],
  },
}

export const CHIA_METADATA: CoreTypes.Metadata = {
  name: 'Penguin Pool',
  description: 'Decentralized lending platform on Chia Network',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://penguin.pool',
  icons: ['https://penguin.pool/icon.png'],
}
