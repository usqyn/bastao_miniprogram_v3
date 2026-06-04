const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { collection, action, data, query, page, pageSize } = event

  try {
    switch (action) {
      // ===== 创建 =====
      case 'create': {
        const res = await db.collection(collection).add({ data })
        return { code: 0, data: { _id: res._id } }
      }

      // ===== 列表 =====
      case 'list': {
        let q = db.collection(collection)
        if (query) q = q.where(query)
        const countRes = await q.count()
        q = q.orderBy('created_at', 'desc')

        const pg = page || 1
        const ps = pageSize || 100
        if (pg > 0) q = q.skip((pg - 1) * ps).limit(ps)

        const listRes = await q.get()
        return { code: 0, data: listRes.data, total: countRes.total }
      }

      // ===== 列表(无分页) =====
      case 'listAll': {
        let q = db.collection(collection)
        if (query) q = q.where(query)
        const countRes = await q.count()
        q = q.orderBy('created_at', 'desc')

        const total = countRes.total
        const batchSize = 100
        let allData = []
        for (let i = 0; i < total; i += batchSize) {
          const res = await db.collection(collection)
            .where(query || {})
            .orderBy('created_at', 'desc')
            .skip(i)
            .limit(batchSize)
            .get()
          allData = allData.concat(res.data)
        }
        return { code: 0, data: allData, total }
      }

      // ===== 更新 =====
      case 'update': {
        if (query && query._id) {
          await db.collection(collection).doc(query._id).update({ data })
        } else if (query) {
          await db.collection(collection).where(query).update({ data })
        }
        return { code: 0 }
      }

      // ===== 删除 =====
      case 'delete': {
        if (query && query._id) {
          await db.collection(collection).doc(query._id).remove()
        } else if (query) {
          await db.collection(collection).where(query).remove()
        }
        return { code: 0 }
      }

      // ===== 统计 =====
      case 'getStats': {
        const [total, pending, contacted, closed] = await Promise.all([
          db.collection('leads').count(),
          db.collection('leads').where({ status: 'pending' }).count(),
          db.collection('leads').where({ status: 'contacted' }).count(),
          db.collection('leads').where({ status: 'closed' }).count()
        ])
        return {
          code: 0,
          data: {
            total: total.total,
            pending: pending.total,
            contacted: contacted.total,
            closed: closed.total
          }
        }
      }

      default:
        return { code: -1, message: `未知操作: ${action}` }
    }
  } catch (e) {
    console.error('[api] 错误:', e)
    return { code: -1, message: e.message }
  }
}
