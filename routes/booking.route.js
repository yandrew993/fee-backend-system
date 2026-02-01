import express from "express";
import {
  getBookings,
  addBooking,
  bookingCount,
  getAllBookings,
  getBookingStats
} from "../controllers/booking.controller.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/count", bookingCount);

router.get("/user", verifyToken, getBookings);
router.get("/", verifyToken, getAllBookings);

router.get("/stats", getBookingStats);

router.post("/", addBooking);

export default router;
