import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: 3000, // Explicitly port 3000 for AI Studio dev server
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'learnmate_super_secret_jwt_key_2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',
};
