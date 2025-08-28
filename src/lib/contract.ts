export const CONTRACT_ADDRESS = '0x91489A58326b88aE2d553a9A6a89306d3e4Afc47' as const

export const ABI = [
  {
    "inputs": [{"internalType":"address","name":"player","type":"address"}],
    "name":"getMyHighScore",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"limit","type":"uint256"}],
    "name":"getTopScores",
    "outputs":[{"components":[
      {"internalType":"address","name":"player","type":"address"},
      {"internalType":"uint256","name":"points","type":"uint256"},
      {"internalType":"uint256","name":"timestamp","type":"uint256"}
    ],"internalType":"struct ShootingLeaderboard.Score[]","name":"","type":"tuple[]"}],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"points","type":"uint256"}],
    "name":"saveScore","outputs":[],"stateMutability":"nonpayable","type":"function"
  }
] as const
