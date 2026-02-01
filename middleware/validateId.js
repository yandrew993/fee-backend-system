// Utility function to validate MongoDB ObjectId format
export const isValidObjectId = (id) => {
  if (!id || id === "undefined") {
    return false;
  }
  return id.match(/^[0-9a-fA-F]{24}$/) !== null;
};

// Middleware to validate ID in params
export const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || id === "undefined") {
      return res.status(400).json({ message: `${paramName} is required` });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: `Invalid ${paramName} format` });
    }

    next();
  };
};
