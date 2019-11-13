import React from 'react';
import {connect} from 'dva'
import { Layout, Menu, Breadcrumb, Icon } from 'antd';
import Link from 'umi/link';
import { getAuthority } from '@/pages/UserLogin/utils/utils';
import lodash from 'lodash'
import router from 'umi/router';
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
                  <span>列表 1</span>
                </Link>
              </Menu.Item>
              <Menu.Item key="2">
                <Link to="/accountsettings">
                  <Icon type="desktop" />
                  <span>设置 2</span>
                </Link>
              </Menu.Item>
              <SubMenu
                key="sub1"
                title={
                  <span>
                  <Icon type="user" />
                  <span>User</span>
                </span>
                }
              >
                <Menu.Item key="3">Tom</Menu.Item>
                <Menu.Item key="4">Bill</Menu.Item>
                <Menu.Item key="5">Alex</Menu.Item>
              </SubMenu>
              <SubMenu
                key="sub2"
                title={
                  <span>
                  <Icon type="team" />
                  <span>Team</span>
                </span>
                }
              >
                <Menu.Item key="6">Team 1</Menu.Item>
                <Menu.Item key="8">Team 2</Menu.Item>
              </SubMenu>
              <Menu.Item key="9" onClick={()=>dispatch({type:'userLogin/logout'})} >
                <Icon type="file" />
                <span>退出</span>
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
            Ant Design ©2018 Created by Ant UED
          </Footer>
      </Layout>
    );
  }
}


export default (props) =>{

  if (props.location.pathname === '/userlogin') {
    return <div>{ props.children }</div>
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
