# Dexie API Configuration

The DexieDataService uses environment variables to configure the API endpoints.

## Environment Variables

Add these to your `.env` files:

```env
# Dexie API Configuration
VITE_DEXIE_API_URL=https://api.dexie.space/v1
```

## API Endpoints

### Mainnet

- **URL**: `https://api.dexie.space/v1`
- **Network**: `Mainnet`

### Testnet

- **URL**: `https://api-testnet.dexie.space/v1`
- **Network**: `Testnet`

## Usage Examples

### Inspect Offer

```typescript
const { inspectOffer } = useOfferInspection()
const response = await inspectOffer(
  'offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmxpk8znee5xnfq4edmh0ndpyerkh6k2kw3r06amc8mhdfde2ukhre430gyjsvym5x60jsk9afzcujmrpuhcx8lp62k6202ljnklhfm0nu05zdhvht8lkucmew9j2jqqzmy0g0dja7dzmqp570l90q5fe09td3gmns7uvh85advvjalug79jnz8xe8fe2xsaha22acaazhfmt97x0pmglj7mghdy70lfk450ulnpuxalyhvcyc5gdv39wgau5y7d4lqcd4lgcd3lg6d3lg7d3lg7d3llq948usq27uz7d7e7y77xkmf5mcmrwvn2gthfzkxx75q7vu7hqmrw6r8vmfwj8264q42mvn8ruzskxlaklvrfwfyx87ch3j83dt4crhtkcpkrjk6jvreexejdv959tq2ucyx7w4tyvzpn0dzx8f7qch9m0fekynqefu6c8hstrx2uj3haptrg4yhdtxft5xf8qfn5eddwm04pzd59dxjmgk08madexcfrjqsqxx3qake07zcgxhcladasdskneuylkppfp22q7dwrkeketuykp0w8y9a5tkngc4fernrvy68sc5vfqd06e43t03edu5hmh7zlta5vsdqt2dhlzluvkua7lehmegpql9r0vma35478283kultt84zh4u5824ew83f4n8cz23jl7l6pa7tq70c0k34rg00stvazl6q9n0sfkmg3l4frkdlhe7cds4kv6rwv6q6fl0l30ny00mg2z6x4rdlmlc8e4evhhm5cuc0xve772emxk3lhatplzlkag5tl7tucjal70p85ymy52v72tk3ccvcl4xdnvwjm4g77mwf60yt2k50zqmf78l6mlqthzqkakmsw9fvlw29g0mlkat8xvvv7dvml8tkec06a8c6n5tmlfj3d46ujw5kepx6g659ranlsyskdktljmgzxtyp4ze4aar8wjnv7ltl886m2s8v4z6uvnylaeyyu7232t66vu9tutgsdwteg7ctxsxpx9rwgl3e46jamjmv3czld0ame4tflxtr6mwresff0xlxhq7ucz3mwxflc4cthufvn3n6w7pkresuhlh8slv4l0g58m2kd4knkds664ehsn770tjulalw7y30fd6hl3lnnlvlju8m8cxm7274xk43s4lkkc5vh2dav0mgqptjqg7ggwmv9c'
)

// Response structure:
// {
//   "success": true,
//   "id": "B18UHqaJXBDu8PVBWsY73opqmCszRnT8hEPmL6rYDcYa",
//   "known": true,
//   "offer": {
//     "id": "B18UHqaJXBDu8PVBWsY73opqmCszRnT8hEPmL6rYDcYa",
//     "status": 4,
//     "date_found": "2022-08-06T07:30:21.468Z",
//     "date_completed": "2022-08-07T00:47:28.000Z",
//     "date_pending": "2022-08-07T00:46:59.476Z",
//     "date_expiry": "2022-08-14T00:46:59.476Z",
//     "block_expiry": null,
//     "spent_block_index": 2364190,
//     "price": 79000,
//     "offered": [
//       {
//         "id": "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913",
//         "code": "SBX",
//         "name": "Spacebucks",
//         "amount": 79000
//       }
//     ],
//     "requested": [
//       {
//         "id": "xch",
//         "code": "XCH",
//         "name": "Chia",
//         "amount": 1
//       }
//     ],
//     "fees": 0
//   }
// }
```

### Search Offers

```typescript
const { searchOffers } = useOfferInspection()
const offers = await searchOffers({
  asset_id: 'a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913',
  status: 0, // Open offers only
  limit: 20,
})
```

### Post Offer

```typescript
const { postOffer } = useOfferInspection()
const result = await postOffer({
  offer:
    'offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmxpk8znee5xnfq4edmh0ndpyerkh6k2kw3r06amc8mhdfde2ukhre430gyjsvym5x60jsk9afzcujmrpuhcx8lp62k6202ljnklhfm0nu05zdhvht8lkucmew9j2jqqzmy0g0dja7dzmqp570l90q5fe09td3gmns7uvh85advvjalug79jnz8xe8fe2xsaha22acaazhfmt97x0pmglj7mghdy70lfk450ulnpuxalyhvcyc5gdv39wgau5y7d4lqcd4lgcd3lg6d3lg7d3lg7d3llq948usq27uz7d7e7y77xkmf5mcmrwvn2gthfzkxx75q7vu7hqmrw6r8vmfwj8264q42mvn8ruzskxlaklvrfwfyx87ch3j83dt4crhtkcpkrjk6jvreexejdv959tq2ucyx7w4tyvzpn0dzx8f7qch9m0fekynqefu6c8hstrx2uj3haptrg4yhdtxft5xf8qfn5eddwm04pzd59dxjmgk08madexcfrjqsqxx3qake07zcgxhcladasdskneuylkppfp22q7dwrkeketuykp0w8y9a5tkngc4fernrvy68sc5vfqd06e43t03edu5hmh7zlta5vsdqt2dhlzluvkua7lehmegpql9r0vma35478283kultt84zh4u5824ew83f4n8cz23jl7l6pa7tq70c0k34rg00stvazl6q9n0sfkmg3l4frkdlhe7cds4kv6rwv6q6fl0l30ny00mg2z6x4rdlmlc8e4evhhm5cuc0xve772emxk3lhatplzlkag5tl7tucjal70p85ymy52v72tk3ccvcl4xdnvwjm4g77mwf60yt2k50zqmf78l6mlqthzqkakmsw9fvlw29g0mlkat8xvvv7dvml8tkec06a8c6n5tmlfj3d46ujw5kepx6g659ranlsyskdktljmgzxtyp4ze4aar8wjnv7ltl886m2s8v4z6uvnylaeyyu7232t66vu9tutgsdwteg7ctxsxpx9rwgl3e46jamjmv3czld0ame4tflxtr6mwresff0xlxhq7ucz3mwxflc4cthufvn3n6w7pkresuhlh8slv4l0g58m2kd4knkds664ehsn770tjulalw7y30fd6hl3lnnlvlju8m8cxm7274xk43s4lkkc5vh2dav0mgqptjqg7ggwmv9c',
  drop_only: false,
  claim_rewards: true,
})
```

## Response Types

### DexieOfferResponse

```typescript
interface DexieOfferResponse {
  success: boolean
  id: string
  known: boolean
  offer: DexieOffer
}
```

### DexieOffer

```typescript
interface DexieOffer {
  id: string
  status: number // 0=Open, 1=Pending, 2=Cancelling, 3=Cancelled, 4=Completed, 5=Unknown, 6=Expired
  date_found: string
  date_completed?: string
  date_pending?: string
  date_expiry?: string
  block_expiry?: number | null
  spent_block_index?: number
  price: number
  offered: DexieAsset[]
  requested: DexieAsset[]
  fees: number
}
```

### DexieAsset

```typescript
interface DexieAsset {
  id: string
  code: string
  name: string
  amount: number
}
```

## Status Mapping

| Dexie Status | App Status  | Description |
| ------------ | ----------- | ----------- |
| 0            | `active`    | Open        |
| 1            | `pending`   | Pending     |
| 2            | `pending`   | Cancelling  |
| 3            | `cancelled` | Cancelled   |
| 4            | `completed` | Completed   |
| 5            | `failed`    | Unknown     |
| 6            | `expired`   | Expired     |
