var PROHIBITED=['中国','中华','中央','国务院','国家','国旗','国徽','国歌','军旗','勋章','红十字','红新月','红十会','毛泽东','邓小平','习近平','共产党','国民党','政协','人大','世博','奥运','奥运会','奥林匹克']
var KNOWN_BRANDS=['apple','google','microsoft','amazon','meta','facebook','twitter','netflix','华为','huawei','小米','xiaomi','oppo','vivo','三星','samsung','sony','腾讯','tencent','阿里巴巴','alibaba','淘宝','taobao','百度','baidu','比亚迪','byd','抖音','tiktok','微信','wechat','nike','adidas','puma','李宁','lining','安踏','anta','coca-cola','cocacola','pepsi','麦当劳','mcdonald','肯德基','kfc','星巴克','starbucks','nestle','nintendo','任天堂','playstation','disney','迪士尼','奔驰','mercedes','bmw','audi','toyota','honda','tesla','特斯拉','lv','gucci','chanel','zara','uniqlo','优衣库','京东','jd','拼多多','pinduoduo','美团','meituan','滴滴','did']
var GENERIC_TERMS=['手机','电脑','笔记本','软件','网站','商城','电商','商店','店铺','公司','企业','工厂','衣服','服装','鞋','鞋子','食品','饮料','茶叶','茶','水果','酒店','饭店','餐厅','旅馆','教育','培训','咨询','服务','美容','美发','摄影','建筑','装修','设计','印刷','新闻','报纸','杂志','媒体','银行','保险','证券','基金','房产','地产','中介','物流','快递','运输','旅游','旅行','航空','酒店','医院','诊所','药店','学校','学院','大学']
var DESCRIPTIVE_TERMS=['优质','正宗','纯正','天然','有机','绿色','环保','顶级','至尊','第一','最好','最佳','首选','全新','新款','时尚','潮流','专业','专注','健康','美丽','快乐','幸福']
var COMMON_SURNAMES=['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','马','朱','胡','郭','何','高','林','罗','郑','梁','谢','宋','唐','韩','曹','许','邓','冯','曾','程','蔡','彭','潘','袁','董','余','苏','叶','吕','魏','蒋','田','杜','丁','沈','姜','范']
var GEO_TERMS=['中国','美国','英国','法国','日本','韩国','俄罗斯','德国','印度','新疆','北京','上海','广州','深圳','杭州','成都','南京','武汉','西安','重庆']
var SINGLE_CHAR=/^[a-zA-Z0-9ก-๏]$/
var PURE_NUMBERS=/^\d+$/
var PURE_LETTERS=/^[a-zA-Z]+$/

function checkTrademark(keyword, country, category){
  if(!keyword||!keyword.trim()) return {status:'unknown',risk:'',advice:''}
  var kw=keyword.trim(); var kwl=kw.toLowerCase()

  for(var i=0;i<PROHIBITED.length;i++){if(kwl.indexOf(PROHIBITED[i])>-1) return {status:'registered',risk:'通过率预估：<10%',advice:'名称包含禁止注册的词汇"'+PROHIBITED[i]+'"，根据《商标法》第十条规定，不得作为商标使用。'}}
  for(var i=0;i<KNOWN_BRANDS.length;i++){if(kwl===KNOWN_BRANDS[i]||kwl.indexOf(KNOWN_BRANDS[i])>-1) return {status:'registered',risk:'通过率预估：<30%',advice:'与知名商标"'+KNOWN_BRANDS[i]+'"相同或近似，注册风险极高，建议更换名称。'}}
  for(var i=0;i<GENERIC_TERMS.length;i++){if(kwl===GENERIC_TERMS[i]) return {status:'registered',risk:'通过率预估：<20%',advice:'"'+GENERIC_TERMS[i]+'"为行业通用名称，缺乏显著性，无法作为商标注册。'}}
  for(var i=0;i<GENERIC_TERMS.length;i++){if(kwl.indexOf(GENERIC_TERMS[i])>-1&&kwl.length<6) return {status:'unknown',risk:'通过率预估：40%',advice:'名称包含通用词"'+GENERIC_TERMS[i]+'"，建议增加显著要素以提高通过率。'}}
  for(var i=0;i<DESCRIPTIVE_TERMS.length;i++){if(kwl===DESCRIPTIVE_TERMS[i]) return {status:'unknown',risk:'通过率预估：40%',advice:'"'+(DESCRIPTIVE_TERMS[i])+'"为描述性词汇，缺乏显著性，需证明通过使用获得显著性才能注册。'}}
  if(SINGLE_CHAR.test(kw)) return {status:'registered',risk:'通过率预估：<10%',advice:'单个字母或数字缺乏显著性，无法作为商标注册。'}
  if(PURE_NUMBERS.test(kw)) return {status:'registered',risk:'通过率预估：<10%',advice:'纯数字组合缺乏显著性，难以作为商标注册。'}
  if(PURE_LETTERS.test(kw)&&kw.length<=2) return {status:'registered',risk:'通过率预估：<20%',advice:'短字母组合缺乏显著性，难以作为商标注册。'}
  for(var i=0;i<COMMON_SURNAMES.length;i++){if(kw===COMMON_SURNAMES[i]&&kw.length<=2) return {status:'unknown',risk:'通过率预估：50%',advice:'常见姓氏单独作为商标缺乏显著性，需结合其他显著要素。'}}
  for(var i=0;i<GEO_TERMS.length;i++){if(kwl===GEO_TERMS[i]) return {status:'registered',risk:'通过率预估：<10%',advice:'地名作为商标缺乏显著性且可能误导公众，难以注册。'}}
  if(kw.length<=2&&/[\u4e00-\u9fff]/.test(kw)) return {status:'unknown',risk:'通过率预估：60%',advice:'名称较短，建议增加显著性词汇以提高通过率。'}
  return {status:'available',risk:'通过率预估：80%',advice:'该名称暂未发现明显冲突，建议尽快锁定类别并提交申请。'}
}
module.exports={checkTrademark}
