const urlModel = require("../model/urlModel");
const shortId = require("shortid");
const axios = require("axios");
const { isValidRequest, isValid, urlRegx } = require("../validator/validation");
const { promisify } = require("util");
const redis = require("redis");

//Connect to redis
const redisClient = redis.createClient(
  11612,
  "redis-11612.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("7dY5g7NzvIgoFrI9WwOFy2dw7yntKi6q", function (error) {
  if (error) throw error;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

let createshortUrl = async function (req, res) {
  try {
    let { longUrl } = req.body;
    if (!isValidRequest(req.body)) {
      return res
        .status(400)
        .send({ status: false, message: "Please input valid request" });
    }

    if (!isValid(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide a URL" });
    }
    if (!urlRegx(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide a valid URL" });
    }
    

    let urlFound = false;

    let object = {
      method: "get",
      url: longUrl,
    };
    await axios(object)
      .then((res) => {
        if (res.status == 201 || res.status == 200) urlFound = true;
      })
      .catch((err) => {});

    if (urlFound == false) {
      return res.status(400).send({ status: false, message: "Invalid URL" });
    }

    let catchedUrl = await GET_ASYNC(`${longUrl}`);
    if (catchedUrl) {
      catchedUrl = JSON.parse(catchedUrl)
      return res.status(409).send({
        status: true,
        message: `${longUrl} this url has already been shortened`,
        data: catchedUrl,
      });
    }else {

      const urlExists = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });

    if (urlExists) {
      return res.status(409).send({
        status: true,
        message: `${longUrl.trim()}, This URL has already been shortened`,
        data: urlExists,
      });
    }

    }

    const baseUrl = "localhost:3000";
    const urlCode = shortId.generate();
    const shortUrl = baseUrl + "/" + urlCode.toLowerCase();

    const obj = {};
    obj["longUrl"] = longUrl;
    obj["shortUrl"] = shortUrl;
    obj["urlCode"] = urlCode;

    await urlModel.create(obj);

    return res.status(201).send({ data: obj });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async function (req, res) {
  try {
    const { urlCode } = req.params;
    let catchedUrl = await GET_ASYNC(`${urlCode}`);
    if (catchedUrl) {
      catchedUrl = JSON.parse(catchedUrl);
      longUrl = catchedUrl.longUrl;
      res.status(302).redirect(longUrl);
    } else {
      let getCatchedUrl = await urlModel
        .findOne({ urlCode: urlCode })
        .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
      if (!getCatchedUrl) {
        return res
          .status(404)
          .send({ status: false, message: "Data not found" });
      }
      await SET_ASYNC(`${urlCode}`, JSON.stringify(getCatchedUrl));
      await SET_ASYNC(
        `${getCatchedUrl.longUrl}`,
        JSON.stringify(getCatchedUrl)
      );
      res.status(302).redirect(getCatchedUrl.longUrl);
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createshortUrl, getUrl };
