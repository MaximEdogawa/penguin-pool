import type { CoreTypes, ProposalTypes } from '@walletconnect/types'

export enum ChiaMethod {
  LogIn = 'chia_logIn',
  GetWallets = 'chia_getWallets',
  GetTransaction = 'chia_getTransaction',
  GetWalletBalance = 'chia_getWalletBalance',
  GetCurrentAddress = 'chia_getCurrentAddress',
  SendTransaction = 'chia_sendTransaction',
  SignMessageById = 'chia_signMessageById',
  SignMessageByAddress = 'chia_signMessageByAddress',
  VerifySignature = 'chia_verifySignature',
  GetNextAddress = 'chia_getNextAddress',
  GetSyncStatus = 'chia_getSyncStatus',
  GetAllOffers = 'chia_getAllOffers',
  GetOffersCount = 'chia_getOffersCount',
  CreateOfferForIds = 'chia_createOfferForIds',
  CancelOffer = 'chia_cancelOffer',
  CheckOfferValidity = 'chia_checkOfferValidity',
  TakeOffer = 'chia_takeOffer',
  GetOfferSummary = 'chia_getOfferSummary',
  GetOfferData = 'chia_getOfferData',
  GetOfferRecord = 'chia_getOfferRecord',
  CreateNewCatWallet = 'chia_createNewCATWallet',
  GetCatWalletInfo = 'chia_getCATWalletInfo',
  GetCatAssetId = 'chia_getCATAssetId',
  SpendCat = 'chia_spendCAT',
  AddCatToken = 'chia_addCATToken',
  GetNfts = 'chia_getNFTs',
  GetNftInfo = 'chia_getNFTInfo',
  MintNft = 'chia_mintNFT',
  TransferNft = 'chia_transferNFT',
  GetNftsCount = 'chia_getNFTsCount',
  CreateNewDidWallet = 'chia_createNewDIDWallet',
  SetDidName = 'chia_setDIDName',
  SetNftDid = 'chia_setNFTDID',
  GetNftWalletsWithDids = 'chia_getNFTWalletsWithDIDs',
  GetWalletAddresses = 'chia_getWalletAddresses',
}

// Determine chain ID based on environment
const isTestnet =
  typeof window !== 'undefined'
    ? window.location.hostname.includes('localhost') || window.location.hostname.includes('testnet')
    : true

export const CHIA_CHAIN_ID = isTestnet ? 'chia:testnet' : 'chia:mainnet'

export const REQUIRED_NAMESPACES: ProposalTypes.RequiredNamespaces = {
  chia: {
    methods: Object.values(ChiaMethod),
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
