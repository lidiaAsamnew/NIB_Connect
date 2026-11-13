function authorize(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("At least one role must be allowed.");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid.",
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    return next();
  };
}

module.exports = { authorize };
