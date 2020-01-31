const Axios = require('axios');

const instance = Axios.create({ timeout: 1000 * 12 });

// instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';  (可以不在这里封装）

// 拦截器
instance.interceptors.request.use(
  config => {
    return config;
  },
  error => Promise.error(error)
);
// 响应拦截器

instance.interceptors.response.use(
  // 请求成功
  res => { 
    return res.status === 200 ? Promise.resolve(res.data) : Promise.reject(res);
  },
  // 请求失败
  error => {
    const { response } = error;
    if (response) {
      return Promise.reject(response);
    }
  }
);

module.exports = instance;
