const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

const isValidRequest = function (value) {
  if (Object.keys(value).length == 0) {
    return false;
  }
  return true;
};

const urlRegx = function (url) {
  return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(
    url
  );
};

module.exports = { isValid, urlRegx , isValidRequest};
