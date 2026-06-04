const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init()
const db = cloud.database()

const APIv3_KEY = process.env.APIv3_KEY

function decryptResource(associatedData, nonce, ciphertext) {
  const key = Buffer.from(APIv3_KEY, 'utf-8')
  const nonceBuf = Buffer.from(nonce, 'utf-8')
  const cipherBuf = Buffer.from(ciphertext, 'base64')
  const tag = cipherBuf.slice(-16)
  const text = cipherBuf.slice(0, -16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuf)
  decipher.setAuthTag(tag)
  decipher.setAAD(Buffer.from(associatedData, 'utf-8'))

  const decoded = Buffer.concat([decipher.update(text), decipher.final()])
  return JSON.parse(decoded.toString('utf-8'))
}

exports.main = async (event) => {
  console.log('[notify] received')

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || event)

    if (body.event_type === 'TRANSACTION.SUCCESS') {
      const resource = body.resource
      const decrypted = decryptResource(
        resource.associated_data,
        resource.nonce,
        resource.ciphertext
      )

      console.log('[notify] decrypted:', decrypted)

      await db.collection('orders').where({
        orderNo: decrypted.out_trade_no
      }).update({
        data: {
          status: 'paid',
          transaction_id: decrypted.transaction_id,
          paid_amount: decrypted.amount?.total,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      console.log('[notify] order updated:', decrypted.out_trade_no)
    }

    return { code: 'SUCCESS', message: 'OK' }
  } catch (e) {
    console.error('[notify] error:', e)
    return { code: 'FAIL', message: e.message }
  }
}
