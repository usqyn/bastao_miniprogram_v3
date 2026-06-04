const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init()

const MCHID = process.env.MCHID
const APIv3_KEY = process.env.APIv3_KEY
const SERIAL_NO = process.env.SERIAL_NO
const NOTIFY_URL = process.env.NOTIFY_URL
const PRIVATE_KEY_B64 = process.env.PRIVATE_KEY_B64

let privateKey
try {
  privateKey = crypto.createPrivateKey(Buffer.from(PRIVATE_KEY_B64, 'base64'))
} catch (e) {
  console.error('私钥加载失败:', e)
}

function createSign(method, url, body) {
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const bodyStr = body ? JSON.stringify(body) : ''
  const signStr = `${method}\n${url}\n${timestamp}\n${nonce}\n${bodyStr}\n`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signStr), privateKey).toString('base64')
  return {
    authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${SERIAL_NO}",signature="${signature}"`,
    timestamp,
    nonce
  }
}

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed)
          else reject(new Error(parsed.message || JSON.stringify(parsed)))
        } catch (e) { reject(new Error(body)) }
      })
    })
    req.on('error', reject)
    if (data) req.write(JSON.stringify(data))
    req.end()
  })
}

exports.main = async (event) => {
  const { orderNo, totalAmount } = event
  const wxContext = cloud.getWXContext()
  const APPID = wxContext.APPID
  const openid = wxContext.OPENID

  if (!APPID) return { code: -1, message: 'APPID 未获取到' }

  if (!MCHID) return { code: -1, message: 'MCHID 未配置' }
  if (!privateKey) return { code: -1, message: '商户私钥未配置' }

  try {
    const url = '/v3/pay/transactions/jsapi'
    const body = {
      appid: APPID,
      mchid: MCHID,
      description: '巴丝淘-商品购买',
      out_trade_no: orderNo,
      notify_url: NOTIFY_URL,
      amount: { total: Math.round(parseFloat(totalAmount) * 100), currency: 'CNY' },
      payer: { openid }
    }

    const { authorization, timestamp, nonce } = createSign('POST', url, body)

    const result = await httpsRequest({
      hostname: 'api.mch.weixin.qq.com',
      path: url,
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'wx-cloud-function'
      }
    }, body)

    const packageStr = `prepay_id=${result.prepay_id}`
    const paySignStr = `${APPID}\n${timestamp}\n${nonce}\n${packageStr}\n`
    const paySign = crypto.sign('RSA-SHA256', Buffer.from(paySignStr), privateKey).toString('base64')

    return {
      code: 0,
      data: {
        timeStamp: String(timestamp),
        nonceStr: nonce,
        package: packageStr,
        signType: 'RSA',
        paySign
      }
    }
  } catch (e) {
    console.error('统一下单失败:', e)
    return { code: -1, message: e.message }
  }
}
