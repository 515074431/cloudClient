import React from 'react';
import {connect} from 'dva'
import { Layout, Menu, Breadcrumb, Icon } from 'antd';
import Link from 'umi/link';
import { getAuthority } from '@/pages/UserLogin/utils/utils';
import lodash from 'lodash'
import router from 'umi/router';
import styles from './index.less';
import logo from '../../assets/logo.png';
const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

@connect(() => ({}))
class SiderDemo extends React.Component {
  state = {
    collapsed: false,
  };
  onCollapse = collapsed => {
    console.log(collapsed);
    this.setState({
      collapsed,
    });
  };
  componentDidMount() {


  }

  render() {
    const { dispatch } = this.props;
    return (
      <Layout
        style={{
          minHeight: '100vh',
        }}
      >

          <Header
            style={{
              background: '#fff',
              padding: 0,
            }}
          >
            <div className="logo" />
            <Menu theme="dark"  mode="horizontal">
              <Menu.Item key="1">
                <Link to="/listtablelist" >
                  <Icon type="pie-chart" />
                  <span>文件</span>
                </Link>
              </Menu.Item>

              <Menu.Item key="9"  >
                <Link to="/userlogout" >
                <Icon type="file" />
                <span>退出</span>
                </Link>
              </Menu.Item>
            </Menu>
          </Header>
          <Content
            style={{
              margin: 16
            }}
          >

            <div
              style={{
               // padding: 24,
                background: '#fff',
                minHeight: 360,
              }}
            >
              {this.props.children}
            </div>
          </Content>
          <Footer
            style={{
              textAlign: 'center',
            }}
          >
            励铖建筑云盘 ©2018 Created by 励铖软件
          </Footer>
      </Layout>
    );
  }
}


export default (props) =>{

  if (props.location.pathname === '/userlogin') {
    return <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.header}>
              <Link to="/">
                <img alt="logo" className={styles.logo} src={logo} />
                <span className={styles.title}>励铖建筑云盘</span>
              </Link>
            </div>
            <div className={styles.desc}>建筑云盘专业解决方案</div>
          </div>
          { props.children }
        </div>
      </div>
  }
  console.log(props.route)
  console.log(props)
  const {location: { pathname },route:{authority=[]}} = props
  let Authorized = getAuthority()
  console.log(Authorized,pathname,authority)
  if(authority.length >0 && lodash.difference(authority,Authorized).toString() == authority.toString()){
    console.log('他没有权限访问')
    //dispatch({type:'userlogin'})
    router.push('/userlogin')
  }
  console.log(lodash.difference(authority,Authorized))
  console.log(authority)
  console.log((lodash.difference(authority,Authorized) === authority))


  return(
    <div id="components-layout-demo-side">
      <SiderDemo {...props} >
        {props.children}
      </SiderDemo>
    </div>
  );
}
