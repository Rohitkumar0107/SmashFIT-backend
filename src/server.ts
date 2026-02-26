import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import matchRoutes from './routes/match.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import playerRoutes from './routes/player.routes';
import tournamentRoutes from './routes/tournament.routes';
import cors from 'cors';
import path from 'path';
import { corsConfig } from './config/cors.config';



export function startServer(){
  
  const app = express();
  app.use(cors(corsConfig));
  dotenv.config(); 
  app.use(cookieParser()); // Cookie parser middleware for handling cookies

  app.use(express.json());

  // for auth routes
  app.use('/api/auth', authRoutes);

  //for dashboard routes
  app.use('/api/dashboard', dashboardRoutes);

  //for match routes
  app.use('/api/matches', matchRoutes);
  
  // for leaderboard routes
  app.use('/api/leaderboard', leaderboardRoutes);

  // for player
  app.use('/api/players', playerRoutes);
  
  // for tournament
  app.use('/api/tournaments', tournamentRoutes);

  
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