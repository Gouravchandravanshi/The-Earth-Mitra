const express = require("express");
const router = express.Router();
const { publicList, publicDetail, adminList, create, update, remove } = require("../controllers/collectionController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/admin", protect, adminOnly, adminList);
router.get("/", publicList);
router.get("/:slug", publicDetail);
router.post("/", protect, adminOnly, create);
router.put("/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
