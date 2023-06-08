import './dotenv.js';
// TODO sync this with dot-env
const P2P_PORT = process.env.P2P_PORT || 30000; // 0 for development/debugging, 30000 for deployment
const HTTP_PORT = process.env.HTTP_PORT || 30001;
const API_PORT = process.env.API_PORT || 30002;
const TCP_PORT = process.env.TCP_PORT || 30003;

export default {
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
  sequelize: {
    database: 'ibp_monitor',
    username: 'ibp_monitor',
    password: 'ibp_monitor',
    options: {
      dialect: 'mariadb',
      // hostname = docker service name
      host: 'ibp-datastore',
      port: 3306,
      logging: false,
    },
  },
  redis: {
    // hostname = docker service name
    // host: 'ibp-redis',
    host: 'localhost',
    port: 6379,
  },
  httpPort: HTTP_PORT,
  // apiPort: API_PORT, // no longer used, same as httpPort
  libp2p: {
    tcpPort: TCP_PORT,
    allowedTopics: [
      '/ibp',
      '/ibp/services',
      '/ibp/healthCheck',
      '/ibp/signedMessage',
    ],
    bootstrapPeers: [
      // '/ip4/192.168.1.91/tcp/30000/p2p/12D3KooWEhSdbKnDJ4T8Gu57fcqrMyRyHQwh5FkcJ6P9ryi55j1G',
      // // '/ip4/192.168.1.91/tcp/30000/p2p/12D3KooWSAdKceyWnAB97AoWKRxbUv3hpAxg3eJLpLGV5za1wJsu',
      // // metaspan:dns
      // // '/dns4/ibp-monitor.metaspan.io/tcp/30000/p2p/12D3KooWK88CwRP1eHSoHheuQbXFcQrQMni2cgVDmB8bu9NtaqVu',
      '/ip4/192.168.1.91/tcp/30000/p2p/12D3KooWK88CwRP1eHSoHheuQbXFcQrQMni2cgVDmB8bu9NtaqVu',
      // // helikon:ip4
      // // '/ip4/78.181.100.160/tcp/30000/p2p/12D3KooWFZzcMsKumdpNyTKtivcGPukPfQAtCaW5o8qinFzSzHuf',
      // '/ip4/78.181.100.160/tcp/30000/p2p/12D3KooWSQJWsaxHiMqxBXxBrbMm7fx7KEMdjWGpikxMM8H5FeDG',
      // // helikon:dns
      // // '/dnsaddr/ibp-monitor.helikon.io/tcp/30000/p2p/12D3KooWFZzcMsKumdpNyTKtivcGPukPfQAtCaW5o8qinFzSzHuf', // wrong peerId
      // '/dns4/ibp-monitor.helikon.io/tcp/30000/p2p/12D3KooWSQJWsaxHiMqxBXxBrbMm7fx7KEMdjWGpikxMM8H5FeDG',
      '/dns4/ibp-monitor.turboflakes.io/tcp/30000/p2p/12D3KooWQv2KCogXS3qmJL1ND1gPMzmRwiGAtEAEsMSMmW4G9L4c',
    ],
    gossipResults: true,
    relay: null,
  },
  workers: {
    apiKey: '123123123',
  },
  updateInterval: 5 * 60 * 1000, // 5 mins, as milliseconds
  pruning: {
    age: 90 * 24 * 60 * 60, // 90 days as seconds
    interval: 1 * 60 * 60, // 1 hour as seconds
  },
};
