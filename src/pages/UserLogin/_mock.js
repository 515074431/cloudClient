const request = require("request")
const util = require('util')
const requestPromise = util.promisify(request)
function getFakeCaptcha(req, res) {
  return res.json('captcha-xxx');
}

export default {
  'POST  /api/login/account': async (req, res) => {
    const { password, username, baseurl, type } = req.body;
    //console.log('REQUEST BODY',req)
    let options = {
      url: baseurl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password, username, type,
      }),
    };
    try {
      let response = await requestPromise(options)
      //console.log("BODY:",response);
      if(response.statusMessage == 'OK'){
        //const json = await response.body;
        //console.log('Success:', JSON.stringify(json));
        if(response.body.status){//登录成功了，将数据记入本地，开始同步
          console.log('Success:', response.body);
        }
        res.send(response.body)
        //console.log('response.body:', response.body);
        return
      }else{
        console.log(response)
      }

    } catch (error) {
      console.error('报错了快点查看Error:', error);
    }


    if (password === 'ant.design' && username === 'admin') {
      res.send({
        status: true,
        type,
        data:{
          currentAuthority: 'admin',
        }

      });
      return;
    }

    if (password === 'ant.design' && username === 'user') {
      res.send({
        status:true,
        type,
        data:{
          currentAuthority: 'user',
        }
      });
      return;
    }

    res.send({
      status: false,
      type,
    data:{
      currentAuthority: 'guest',
    }
    });
  },
  'GET  /api/login/captcha': getFakeCaptcha,
};
