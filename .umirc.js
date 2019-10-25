// ref: https://umijs.org/config/
export default {
  treeShaking: true,
  routes: [
    {
      path: '/',
      component: '../layouts/LayoutSide/index',
      routes: [
        {
          name: '查询表格',
          path: '/listtablelist',
          component: './ListTableList',
        },
        {
          name: '登录页',
          path: '/userlogin',
          component: './UserLogin',
        },
        {
          name: '个人设置',
          path: '/accountsettings',
          component: './AccountSettings',
        },
        {
          path: '/',
          component: '../pages/index',
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
};
