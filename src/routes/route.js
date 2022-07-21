const express = require("express");
const { createshortUrl, getUrl } = require("../controllers/urlController");
const router = express.Router();

router.post("/url/shorten", createshortUrl);
router.get("/:urlCode", getUrl);

router.all("/**", function (req, res) {
  return res
    .status(404)
    .send({ status: false, message: "Requested Api is Not Available" });
});

module.exports = router;
