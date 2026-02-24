import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import cors from 'cors';
import path from 'path';
import { corsConfig } from './config/cors.config';


export function startServer(){
  
  const app = express();
  app.use(cors(corsConfig));
  dotenv.config({ path: path.join(__dirname, '../.env') }); 
  app.use(cookieParser()); // Cookie parser middleware for handling cookies

  app.use(express.json());

  // for auth routes
  app.use('/api/auth', authRoutes);

  // Define a basic route
  app.get('/', (req, res) => {
    res.send('Welcome to Smashit API!');
  });

  // Start the server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

}