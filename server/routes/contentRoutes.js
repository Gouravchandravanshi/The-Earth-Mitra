const express = require("express");
const createHandlers = require("../controllers/contentController");
const { protect, adminOnly } = require("../middlewares/auth");

module.exports = type => {
  const router = express.Router();
  const { publicList, publicDetail, adminList, create, update, remove } = createHandlers(type);
  router.get("/admin", protect, adminOnly, adminList);
  router.get("/", publicList);
  router.get("/:slug", publicDetail);
  router.post("/", protect, adminOnly, create);
  router.put("/:id", protect, adminOnly, update);
  router.delete("/:id", protect, adminOnly, remove);
  return router;
};
