const {createHash}= require('crypto');
/**
 * @param {string} algorithm
 * @param {any} content
 *  @return {string}
 */
const encrypt = (algorithm, content) => {
  let hash = createHash(algorithm)
  hash.update(content)
  return hash.digest('hex')
}
/**
 * @param {any} content
 *  @return {string}
 */
const sha1 = (content) => encrypt('sha1', content)
/**
 * @param {any} content
 *  @return {string}
 */
const md5 = (content) => encrypt('md5', content)

module.exports={sha1,md5,encrypt}
