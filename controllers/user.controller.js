import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

// export const getUser = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//     });
//     res.status(200).json(user);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get user!" });
//   }
// };

import { ObjectId } from 'mongodb';

export const getUser = async (req, res) => {
  const id = req.params.id;
  const userId = req.userId;
  const userRole = req.userRole;

  // Validate if the id is a valid MongoDB ObjectID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format." });
  }

  try {
    if (userId === id || userRole === 'admin') {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found!" });
      }
    } else {
      res.status(403).json({ message: "Not authorized to access this user's data." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};


export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const tokenUserRole = req.userRole;
  const { password, avatar, id: bodyId, ...inputs } = req.body;

  // Authorization check: User can update their own profile or admin can update any user
  if (tokenUserId !== id && tokenUserRole !== "admin") {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  // Additional check: If admin is updating another user, they can only update accountants or users (not other admins)
  if (tokenUserId !== id && tokenUserRole === "admin") {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!targetUser) {
        return res.status(404).json({ message: "User not found!" });
      }

      // Admin can only update users with "accountant" or "user" roles
      if (targetUser.role === "admin") {
        return res.status(403).json({ message: "Admins cannot update other admin accounts!" });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Failed to verify user role!" });
    }
  }

  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json({
      message: "User updated successfully",
      user: rest,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const tokenUserRole = req.userRole;

  // Authorization check: User can delete their own account or admin can delete any user
  if (tokenUserId !== id && tokenUserRole !== "admin") {
    return res.status(403).json({ message: "Not Authorized!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const tokenUserId = req.userId;

    // Validate userId
    if (!tokenUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: tokenUserId }, 
      include: {
        post: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            address: true,
            city: true,
            bedroom: true,
            bathroom: true,
            type: true,
            property: true,
            createdAt: true,
          },
        },
      },
    });

    if (!savedPosts || savedPosts.length === 0) {
      return res.status(200).json([]); 
    }

    res.status(200).json(savedPosts.map((saved) => saved.post)); 
  } catch (err) {
    console.error("Error fetching saved posts:", err);
    res.status(500).json({ message: "Failed to get saved posts!" });
  }
};


export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete users!" });
  }
};

export const deleteSavedPost = async (req, res) => {
  const postId = req.body.postId || req.params.postId || req.query.postId;
  const tokenUserId = req.userId;

  if (!postId) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved list" });
    } else {
      res.status(404).json({ message: "Post not found in saved list" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete saved post!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserId = req.userId;
  const userRole = req.userRole;

  try {
    let userPosts = [];
    let savedPosts = [];
    let bookings = [];

    // Validate userId
    if (!tokenUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch saved posts for all users
    try {
      const saved = await prisma.savedPost.findMany({
        where: { userId: tokenUserId },
        include: {
          post: true,
        },
      });

      savedPosts = saved.map((item) => item.post);
    } catch (err) {
      console.error("Error fetching saved posts:", err);
      savedPosts = [];
    }

    if (userRole === "admin") {
      // Fetch posts for admin only
      try {
        userPosts = await prisma.post.findMany({
          where: { userId: tokenUserId },
        });
      } catch (err) {
        console.error("Error fetching user posts:", err);
        userPosts = [];
      }

      return res.status(200).json({ userPosts, savedPosts });
    }

    // Fetch bookings for regular users only
    try {
      bookings = await prisma.booking.findMany({
        where: { userId: tokenUserId },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
              address: true,
              city: true,
              bedroom: true,
              bathroom: true,
              type: true,
              property: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      bookings = [];
    }

    // Return bookings and savedPosts for regular users
    return res.status(200).json({ bookings, savedPosts });
  } catch (err) {
    console.error("Error in profilePosts:", err);
    res.status(500).json({ message: "Failed to get profile posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    // Chat model is not available in this fee management system
    // Return 0 notifications for now
    // TODO: Implement notification system if needed in the future
    res.status(200).json(0);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get notifications!" });
  }
};

export const totalUsers = async (req, res) => {
  try {
    const total = await prisma.user.count();
    res.status(200).json( total);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get total users!" });
  }
}

//total users with posts(have created posts)
export const usersWithPosts = async (req, res) => {
  try {
    const total = await prisma.user.count({
      where: {
        posts: {
          some: {},
        },
      },
    });
    res.status(200).json(total);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users with posts!" });
  }
}

export const getUserStats = async (req, res) => {
  try {
    // Get current count of all users
    const currentCount = await prisma.user.count();
    
    // Get count from previous period (e.g., last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const previousMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          lt: lastMonth
        }
      }
    });
    
    // Calculate new users in the last month
    const newUsers = currentCount - previousMonthUsers;
    
    // Calculate percentage change
    let percentChange = 0;
    if (previousMonthUsers > 0) {
      percentChange = Math.round((newUsers / previousMonthUsers) * 100);
    } else if (currentCount > 0) {
      percentChange = 100; 
    }
    
    res.status(200).json({
      count: currentCount,
      newUsers: newUsers,
      percentChange: percentChange
    });
  } catch (err) {
    console.error("Error in getUserStats:", err);
    res.status(500).json({ message: "Failed to get user statistics!" });
  }
};

export const getLandlordStats = async (req, res) => {
  try {
    // Get current count of all landlords
    const currentCount = await prisma.user.count({
      where: {
        role: "admin"
      }
    });
    
    // Get count from previous period (e.g., last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const previousMonthLandlords = await prisma.user.count({
      where: {
        role: "admin",
        createdAt: {
          lt: lastMonth
        }
      }
    });
    
    // Calculate new landlords in the last month
    const newLandlords = currentCount - previousMonthLandlords;
    
    // Calculate percentage change
    let percentChange = 0;
    if (previousMonthLandlords > 0) {
      percentChange = Math.round((newLandlords / previousMonthLandlords) * 100);
    } else if (currentCount > 0) {
      percentChange = 100; // If previous count was 0, and now we have landlords, that's a 100% increase
    }
    
    res.status(200).json({
      count: currentCount,
      newLandlords: newLandlords,
      percentChange: percentChange
    });
  } catch (err) {
    console.error("Error in getLandlordStats:", err);
    res.status(500).json({ message: "Failed to get landlord statistics!" });
  }
};

/**
 * Create a new user (Admin only)
 * @route POST /users
 * @access Admin
 */
export const createUser = async (req, res) => {
  const { username, email, password, fullName, phone, role } = req.body;
  const tokenUserRole = req.userRole;

  try {
    // Check if user is admin
    if (tokenUserRole !== "admin") {
      return res.status(403).json({ message: "Only administrators can create users!" });
    }

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required!" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName: fullName || username,
        phone: phone || null,
        role: role || "accountant", // Default role
      },
    });

    // Return user without password
    const { password: _, ...userInfo } = newUser;

    res.status(201).json({
      message: "User created successfully",
      user: userInfo,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Failed to create user!" });
  }
};