const express = require("express");
const router = express.Router();
const { publicList, adminList, create, update, remove } = require("../controllers/bannerController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/admin", protect, adminOnly, adminList);
router.get("/", publicList);
router.post("/", protect, adminOnly, create);
router.put("/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
