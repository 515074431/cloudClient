import React, { Component } from 'react';

import { connect } from 'dva';
import LoginComponents from './components/Login';
import styles from './style.less';
const { Tab, UserName, Password,  Submit, BaseUrl } = LoginComponents;

@connect(({ userLogin, loading }) => ({
  userLogin
}))
class UserLogout extends Component {

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'userLogin/logout',
    });
  }
  render() {

    return (
      <div className={styles.main}>

      </div>
    );
  }
}

export default UserLogout;
