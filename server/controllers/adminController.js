const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");
const Order = require("../models/Order");

const getDashboard = async (req, res) => {
  try {
    const [products, categories, customers, orders, paid, recentOrders, lowStock, topProducts] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { "paymentInfo.status": "paid", status: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Order.find().select("user totalAmount status paymentInfo.status createdAt shippingAddress.city shippingAddress.state")
        .populate("user", "name email").sort({ createdAt: -1, _id: -1 }).limit(5).lean(),
      Product.countDocuments({ stock: { $lte: 10 } }),
      Product.find().select("name sku stock price").sort({ stock: 1, _id: 1 }).limit(5).lean(),
    ]);
    const paidSummary = paid[0] || { revenue: 0, count: 0 };
    return res.json({
      stats: {
        revenue: paidSummary.revenue,
        orderCount: orders,
        customerCount: customers,
        productCount: products,
        categoryCount: categories,
        lowStockCount: lowStock,
        averagePaidOrderValue: paidSummary.count ? Math.round(paidSummary.revenue / paidSummary.count) : 0,
      },
      recentOrders,
      lowStockProducts: topProducts,
    });
  } catch {
    return res.status(500).json({ message: "Unable to retrieve admin dashboard data" });
  }
};

module.exports = { getDashboard };
