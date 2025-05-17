import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import redemptionsRouter from './routes/redemptions.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Cost Per Point API!' });
});

app.use('/api/redemptions', redemptionsRouter);

initDb();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 