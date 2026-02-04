import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { startScheduledBalanceUpdates } from "./lib/balanceUpdateService.js";

// Fee Management Routes
import authRoute from "./routes/auth.route.js";
import usersRoute from "./routes/users.route.js";
import academicTermRoute from "./routes/academicTerm.route.js";
import studentRoute from "./routes/student.route.js";
import classRoute from "./routes/class.route.js";
import classFeeRoute from "./routes/classFee.route.js";
import studentFeeStatementRoute from "./routes/studentFeeStatement.route.js";
import feePaymentRoute from "./routes/feePayment.route.js";
import paymentRoute from "./routes/payment.route.js";
import receiptRoute from "./routes/receipt.route.js";
import reportRoute from "./routes/report.route.js";
import balanceManagementRoute from "./routes/balanceManagement.route.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL1,
  process.env.CLIENT_URL2,
  process.env.CLIENT_URL3,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://surewayfeemanagement.surewaygroupofschools.org",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Fee Management Routes
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/academic-years", academicTermRoute);
app.use("/api/students", studentRoute);
app.use("/api/classes", classRoute);
app.use("/api/class-fees", classFeeRoute);
app.use("/api/student-fee-statements", studentFeeStatementRoute);
app.use("/api/fee-payments", feePaymentRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/receipts", receiptRoute);
app.use("/api/reports", reportRoute);
app.use("/api/balance-management", balanceManagementRoute);

// Initialize scheduled balance updates
// Updates active term balances every 5 minutes (300 seconds)
const BALANCE_UPDATE_INTERVAL = parseInt(process.env.BALANCE_UPDATE_INTERVAL || "5");
try {
  console.log(`Initializing scheduled balance updates (interval: ${BALANCE_UPDATE_INTERVAL} minutes)`);
  startScheduledBalanceUpdates(BALANCE_UPDATE_INTERVAL);
} catch (error) {
  console.error("Failed to start scheduled balance updates:", error.message);
  // Continue running even if balance updates fail
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Fee Management System API is running",
    timestamp: new Date().toISOString()
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
