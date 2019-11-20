// ref: https://umijs.org/config/
export default {
  treeShaking: true,
  routes: [
    // user
    {
      name: '登录页',
      path: '/userlogin',
      component: '../layouts/LayoutSide/index',
      routes: [
        { path: '/userlogin', component: './UserLogin' },
      ],
    },
    {
      name: '退出页',
      path: '/userlogout',
      component: './UserLogin/logout'
    },
    // app
    {
      path: '/',
      component: '../layouts/LayoutSide/index',
      authority: ['admin', 'user'],
      routes: [
        {
          name: '查询表格',
          path: '/listtablelist',
          component: './ListTableList',
        },
        {
          name: '个人设置',
          path: '/accountsettings',
          component: './AccountSettings',
        },
        {
          path: '/',
          component: './ListTableList',
        },
      ],
    },
  ],
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: true,
        dva: true,
        dynamicImport: {
          webpackChunkName: true,
        },
        title: 'licheng-cloud-client',
        dll: false,
        routes: {
          exclude: [
            /models\//,
            /services\//,
            /model\.(t|j)sx?$/,
            /service\.(t|j)sx?$/,
            /components\//,
          ],
        },
        locale: {
          default: 'zh-CN',
        },
      },
    ],
  ],
  publicPath: './',
  base: '/',
  history: 'hash',
};

