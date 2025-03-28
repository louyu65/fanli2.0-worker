addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
      // 根据路径选择对应的处理函数
  switch (pathname) {
    case '/querytaobaoproduct':
      return await handleQueryTaobaoProduct(request);
    case '/gettaobaopassword':
      return await handleGetTaobaoPassword(request);
    case '/longurltoshort':
        return await handleLongUrlToShort(request);
    default:
      return new Response('Invalid path', { status: 404 });
  }

}
const appkey = TAOBAO_APP_KEY;
const appsecret = TAOBAO_ACCESS_TOKEN;
const REST_URL = 'http://gw.api.taobao.com/router/rest';
async function handleLongUrlToShort(request){
    const url = new URL(request.url);
    const taobaoUrl = url.searchParams.get('taobaoUrl');
    if (!taobaoUrl) {
        return new Response('Please provide a taobaoUrl as a query parameter.', { status: 400 });
      }
    const timestamp_str = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const params = new URLSearchParams({
      method: 'taobao.tbk.spread.get',
      app_key: appkey,
      //timestamp: Math.floor(Date.now() / 1000).toString(),
      timestamp:timestamp_str,
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      requests:JSON.stringify([{url: taobaoUrl}])  
      
      
    });
    // Create the signature using a pure JavaScript MD5 implementation
    //const signature = md51(appsecret + paramString + appsecret).toUpperCase();
    const signature = signTopRequest(params ,appsecret,'md5').toUpperCase();
    params.append('sign', signature);
  
    const response = await fetch(`${REST_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return new Response(await response.text(), {
      headers: { 'content-type': 'application/json' ,'Access-Control-Allow-Origin':'*'},
    });
}

//获取商品的
async function handleGetTaobaoPassword(request) {
    const url = new URL(request.url);
    const taobaoUrl = url.searchParams.get('taobaoUrl');
    if (!taobaoUrl) {
        return new Response('Please provide a taobaoUrl as a query parameter.', { status: 400 });
      }
    const timestamp_str = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const params = new URLSearchParams({
      method: 'taobao.tbk.tpwd.create',
      app_key: appkey,
      //timestamp: Math.floor(Date.now() / 1000).toString(),
      timestamp:timestamp_str,
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      url:taobaoUrl
      
      
    });
    // Create the signature using a pure JavaScript MD5 implementation
    //const signature = md51(appsecret + paramString + appsecret).toUpperCase();
    const signature = signTopRequest(params ,appsecret,'md5').toUpperCase();
    params.append('sign', signature);
  
    const response = await fetch(`${REST_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    return new Response(await response.text(), {
      headers: { 'content-type': 'application/json' ,'Access-Control-Allow-Origin':'*'},
    });
}

//查询商品清单
async function handleQueryTaobaoProduct(request) {
  
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword');
  const pageSize = url.searchParams.get('page_size') || '20';
  const pageNo = url.searchParams.get('page_no') || '1';
  const itemLoc = url.searchParams.get('itemloc') || '';
  const userIp = url.searchParams.get('userIp') || '';

  const startPrice = url.searchParams.get('startPrice') || '0';//商品最低价格
  const endPrice = url.searchParams.get('endPrice') || '100000';//商品最高价格
  const isTmall = url.searchParams.get('isTmall') || 'false';//是否是天猫商城 true -是,false-不限
  const isOverseas = url.searchParams.get('isOverseas') || 'false';//是否海淘商品 true -是,false-不限
  const sort = url.searchParams.get('sort') || 'tk_rate_des';//排序_des（降序），排序_asc（升序），销量（total_sales），淘客收入比率（tk_rate），营销计划佣金（tk_mkt_rate）， 累计推广量（tk_total_sales），总支出佣金（tk_total_commi），预估到价格（final_promotion_price），匹配分（match）
  const start_tk_rate = url.searchParams.get('start_tk_rate') || '1';//（不添加界面删选）商品筛选-淘客收入比率下限(商品佣金比率+补贴比率)。如：1234表示12.34%
  const end_tk_rate = url.searchParams.get('end_tk_rate') || '9999';//（不添加界面筛选）商品筛选-淘客收入比率上限(商品佣金比率+补贴比率)。如：1234表示12.34%

  const start_dsr = url.searchParams.get('start_dsr') || '0';//商品筛选-店铺dsr评分。筛选大于等于当前设置的店铺dsr评分的商品0-50000之间
  const has_coupon = url.searchParams.get('has_coupon') || 'false';//是否有优惠券，默认不限
  const need_free_shipment = url.searchParams.get('need_free_shipment') || 'false';//是否包邮，不限
  
  const include_good_rate = url.searchParams.get('include_good_rate') || 'false'; //商品筛选-好评率是否高于行业均值。True表示大于等于，false或不设置表示不限
  const npx_level  = url.searchParams.get('npx_level')|| '1'//商品筛选-牛皮癣程度。取值：1不限，2无，3轻微
  const promotion_type  = url.searchParams.get('promotion_type')|| '1'  //1-自购省，2-推广赚（代理模式专属ID，代理模式必填，非代理模式不用填写该字段）
  const get_topn_rate  = url.searchParams.get('get_topn_rate')|| '0' //是否获取前N件佣金信息 0否，1是，其他值否
  const biz_scene_id  = url.searchParams.get('biz_scene_id')|| '1' //1-动态ID转链场景，2-消费者比价场景（不填默认为1）；
  const mgc_status  = url.searchParams.get('mgc_status')|| '0' 
  if (!keyword) {
    return new Response('Please provide a keyword as a query parameter.', { status: 400 });
  }
  const timestamp_str = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const params = new URLSearchParams({
    method: 'taobao.tbk.dg.material.optional.upgrade',
    app_key: appkey,
    //timestamp: Math.floor(Date.now() / 1000).toString(),
    timestamp:timestamp_str,
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    page_size: pageSize,
    page_no: pageNo,
    adzone_id: TAOBAO_PID,
    start_dsr:start_dsr,
	end_tk_rate:end_tk_rate,
	start_tk_rate:start_tk_rate,
	end_price:endPrice,
	start_price:startPrice,
	is_overseas:isOverseas,
	is_tmall:isTmall,
	sort:sort,//排序_des（降序），排序_asc（升序），销量（total_sales），淘客收入比率（tk_rate），营销计划佣金（tk_mkt_rate）， 累计推广量（tk_total_sales），总支出佣金（tk_total_commi），预估到价格（final_promotion_price），匹配分（match）
	itemloc:itemLoc,
	  //'cat':'16,18',
	'q':keyword,
	 has_coupon:has_coupon,
	 ip:userIp,
	 need_free_shipment:need_free_shipment,
	need_prepay:'true',
	include_pay_rate_30:'false',
	include_good_rate:include_good_rate,
	include_rfd_rate:'false',
	npx_level:npx_level,
	get_topn_rate:get_topn_rate,
	biz_scene_id:biz_scene_id,
	promotion_type:promotion_type,
	
	mgc_status:'0',
	
	
  });
  console.log(params.toString());
  // Create the signature using a pure JavaScript MD5 implementation
  //const signature = md51(appsecret + paramString + appsecret).toUpperCase();
  const signature = signTopRequest(params ,appsecret,'md5').toUpperCase();
  params.append('sign', signature);

  const response = await fetch(`${REST_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return new Response(await response.text(), {
    headers: { 'content-type': 'application/json' ,'Access-Control-Allow-Origin':'*'},
  });
}
function signTopRequest(params, secret, signMethod) {
  // 第一步：把字典按Key的字母顺序排序
  const sortedParams = Object.fromEntries([...params.entries()].sort());
  let paramString = '';
  for (const [key, value] of Object.entries(sortedParams)) {
    paramString += `${key}${value}`;
  }

  // 第二步：把所有参数名和参数值串在一起
  let query = '';
  if (signMethod === 'md5') { // 签名的摘要算法，可选值为：hmac，md5，hmac-sha256
      query += secret;
  }
  query+=paramString;
  console.log('#####query#####'+`${query.toString()}`)
  // 第三步：使用MD5/HMAC加密（手动实现）
  let bytes;
 
  query += secret;
  bytes = md5(query);
  
  // console.log('#####bytes#####'+`${bytes.toString()}`)
  return bytes;
}


// 手动实现HMAC-MD5（简化版，仅用于示例）
function hmacMd5(message, key) {
  // 这里可以实现一个简单的HMAC-MD5算法，或者直接返回模拟结果
  console.warn('HMAC-MD5 algorithm is not implemented in this example.');
  return new Array(16).fill(0); // 模拟返回16字节的哈希值
}
/**
 * 计算字符串的MD5值（纯原生实现，不依赖crypto模块）
 * @param {string} input - 需要计算MD5的输入字符串
 * @param {string} [encoding='hex'] - 输出编码格式 ('hex' 或 'base64')
 * @returns {string} - 返回MD5哈希值
 */
function md5(input, encoding = 'hex') {
  if (typeof input !== 'string') {
      throw new TypeError('输入必须是字符串类型');
  }

  if (!['hex', 'base64'].includes(encoding)) {
      throw new TypeError('编码格式必须是 "hex" 或 "base64"');
  }

  // MD5算法的初始向量
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  // 常量表
  const K = new Uint32Array([
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ]);

  // 移位表
  const S = new Uint8Array([
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]);

  // 辅助函数
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);

  // 左循环移位
  const ROTATE_LEFT = (x, n) => {
      x = x >>> 0; // 确保x是32位无符号整数
      return ((x << n) | (x >>> (32 - n))) >>> 0;
  };

  // 将字符串转换为字节数组
  const stringToBytes = (str) => {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
          const charCode = str.charCodeAt(i);
          if (charCode < 0x80) { // ASCII字符
              bytes.push(charCode);
          } else if (charCode < 0x800) { // 2字节UTF-8
              bytes.push(0xC0 | (charCode >> 6));
              bytes.push(0x80 | (charCode & 0x3F));
          } else if (charCode < 0x10000) { // 3字节UTF-8
              bytes.push(0xE0 | (charCode >> 12));
              bytes.push(0x80 | ((charCode >> 6) & 0x3F));
              bytes.push(0x80 | (charCode & 0x3F));
          }
      }
      return bytes;
  };

  // 消息填充（考虑小端序）
  const padMessage = (bytes) => {
      const originalLength = bytes.length * 8;
      bytes.push(0x80);
      while ((bytes.length * 8) % 512 !== 448) {
          bytes.push(0);
      }
      // 使用小端序添加原始长度
      for (let i = 0; i < 4; i++) {
          bytes.push((originalLength >>> (i * 8)) & 0xFF);
      }
      for (let i = 0; i < 4; i++) {
          bytes.push(0);
      }
      return bytes;
  };

  // 主要的MD5哈希计算
  const bytes = padMessage(stringToBytes(input));
  const chunks = Math.floor(bytes.length / 64);

  for (let i = 0; i < chunks; i++) {
      const words = new Uint32Array(16);
      for (let j = 0; j < 16; j++) {
          // 小端序读取
          words[j] = (bytes[i * 64 + j * 4]) |
                    (bytes[i * 64 + j * 4 + 1] << 8) |
                    (bytes[i * 64 + j * 4 + 2] << 16) |
                    (bytes[i * 64 + j * 4 + 3] << 24);
      }

      let aa = a, bb = b, cc = c, dd = d;

      // 四轮运算
      for (let j = 0; j < 64; j++) {
          let f, g;

          if (j < 16) {
              f = F(bb, cc, dd);
              g = j;
          } else if (j < 32) {
              f = G(bb, cc, dd);
              g = (5 * j + 1) % 16;
          } else if (j < 48) {
              f = H(bb, cc, dd);
              g = (3 * j + 5) % 16;
          } else {
              f = I(bb, cc, dd);
              g = (7 * j) % 16;
          }

          const temp = dd;
          dd = cc;
          cc = bb;
          const sum = (aa + f + K[j] + words[g]) >>> 0;
          bb = (bb + ROTATE_LEFT(sum, S[j])) >>> 0;
          aa = temp;
      }

      a = (a + aa) >>> 0;
      b = (b + bb) >>> 0;
      c = (c + cc) >>> 0;
      d = (d + dd) >>> 0;
  }

  // 将结果转换为字节数组（小端序）
  const result = new Uint8Array(16);
  const writeWord = (value, offset) => {
      result[offset] = value & 0xFF;
      result[offset + 1] = (value >>> 8) & 0xFF;
      result[offset + 2] = (value >>> 16) & 0xFF;
      result[offset + 3] = (value >>> 24) & 0xFF;
  };
  writeWord(a, 0);
  writeWord(b, 4);
  writeWord(c, 8);
  writeWord(d, 12);

  // 转换为指定编码格式
  if (encoding === 'hex') {
      return Array.from(result)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
  } else {
      // 使用标准JavaScript实现base64编码
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let base64 = '';
      for (let i = 0; i < result.length; i += 3) {
          const chunk = [result[i], result[i + 1] || 0, result[i + 2] || 0];
          const triplet = (chunk[0] << 16) | (chunk[1] << 8) | chunk[2];
          for (let j = 0; j < 4; j++) {
              if (i * 8 + j * 6 > result.length * 8) {
                  base64 += '=';
              } else {
                  const index = (triplet >> (6 * (3 - j))) & 0x3F;
                  base64 += base64Chars[index];
              }
          }
      }
      return base64;
  }
}
