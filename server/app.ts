import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from 'express';

dotenv.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const PUBLIC_KEY = process.env.PUBLIC_KEY || "";
const HASH_PASS_PHRASE = process.env.HASH_PASS_PHRASE || "";
const services = [
  { serviceId: process.env.FRONT_END_ID, serviceSecret: process.env.FRONT_END_SECRET }
]

const PORT = 8080;
const app = express();

const generateHmacHash = (data: string) => {
  return crypto.createHmac("sha256", HASH_PASS_PHRASE).update(data).digest("hex");
};

const database = { data: "Hello World", hash: generateHmacHash("Hello World") };

const authenticateServiceToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied, no token provided" });
  }

  try {
    
    jwt.verify(token, PUBLIC_KEY);
    next();
  } catch (err) {
    console.log(err);
    return res.status(403).json({ message: "Token is invalid" });
  }
};

app.use(cors());
app.use(express.json());

app.get("/", authenticateServiceToken, (req: Request, res: Response) => {
  res.json(database);
});

app.post("/", authenticateServiceToken, (req: Request, res: Response) => {
  const { data } = req.body;
  const hashedData = generateHmacHash(data);

  database.data = data;
  database.hash = hashedData; 
  
  res.sendStatus(200);
});

app.post("/verify", authenticateServiceToken, (req: Request, res: Response) => {
  const { data } = req.body;
  const hashedData = generateHmacHash(data);

  if (hashedData === database.hash) {
    res.sendStatus(200);
  } else {
    res.status(400).json({ 
      error: "Data has been tampered with. Latest untampered data under data property.", 
      data: database // Optionally, send the current state of the database for recovery
    });
  }
});

app.post('/auth', (req, res) => {
  const { serviceId, serviceSecret } = req.body;
  const service = services.find(service => service.serviceId == serviceId)

  if(!service || service.serviceSecret != serviceSecret){
    res.status(403).json({ message: 'Invalid client credentials' });
  } else {
    const token = jwt.sign(
      { service: serviceId },
      PRIVATE_KEY,  
      { algorithm: 'RS256', expiresIn: '1h' }
    );
  
    res.status(200).json({ token });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
