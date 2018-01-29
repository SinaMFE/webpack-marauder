const request = require('request')

function fetch(url) {
  return new Promise((resolve, reject) => {
    request(
      { url: url, headers: { 'User-Agent': 'mara-cli' } },
      (err, res, body) => {
        if (err) reject(err)
        const requestBody = JSON.parse(body)
        if (Array.isArray(requestBody)) {
          resolve(requestBody)
        } else {
          reject(requestBody.message)
        }
      }
    )
  })
}

module.exports = fetch
