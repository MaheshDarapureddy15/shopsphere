const requireAdmin = (req, res, next) => {
  const user = req.user;
  const role = user?.role;

  if (!user || role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = requireAdmin;
