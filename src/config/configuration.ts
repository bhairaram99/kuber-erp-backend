export default () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wood_business_erp',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secure_wood_erp_jwt_secret_key_2026_xyz!@#',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
});
