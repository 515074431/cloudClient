import { Alert, Checkbox } from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Component } from 'react';

import { connect } from 'dva';
import LoginComponents from './components/Login';
import styles from './style.less';
const { Tab, UserName, Password,  Submit, BaseUrl } = LoginComponents;

@connect(({ userLogin, loading }) => ({
  userLogin,
  submitting: loading.effects['userLogin/login'],
}))
class UserLogin extends Component {
  loginForm = undefined;
  state = {
    type: 'account',
    autoLogin: true,
  };
  changeAutoLogin = e => {
    this.setState({
      autoLogin: e.target.checked,
    });
  };
  handleSubmit = (err, values) => {
    const { type } = this.state;

    if (!err) {
      const { dispatch } = this.props;
      dispatch({
        type: 'userLogin/login',
        payload: { ...values, type },
      });
    }
  };
  onTabChange = type => {
    this.setState({
      type,
    });
  };
  onGetCaptcha = () =>
    new Promise((resolve, reject) => {
      if (!this.loginForm) {
        return;
      }

      this.loginForm.validateFields(['mobile'], {}, (err, values) => {
        if (err) {
          reject(err);
        } else {
          const { dispatch } = this.props;
          dispatch({
            type: 'userLogin/getCaptcha',
            payload: values.mobile,
          })
            .then(resolve)
            .catch(reject);
        }
      });
    });
  renderMessage = content => (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );

  render() {
    const { userLogin, submitting } = this.props;
    const { status, type: loginType } = userLogin;
    const { type, autoLogin } = this.state;
    return (
      <div className={styles.main}>
        <LoginComponents
          defaultActiveKey={type}
          onTabChange={this.onTabChange}
          onSubmit={this.handleSubmit}
          ref={form => {
            this.loginForm = form;
          }}
        >
          <Tab
            key="account"
            tab={formatMessage({
              id: 'userlogin.login.tab-login-credentials',
            })}
          >
            {status === 'error' &&
              loginType === 'account' &&
              !submitting &&
              this.renderMessage(
                formatMessage({
                  id: 'userlogin.login.message-invalid-credentials',
                }),
              )}
            <BaseUrl
              name="baseurl"
              placeholder={`${formatMessage({ id: 'userlogin.login.baseurl' })}: http://lichengsoft.com`}
              rules={[
                {
                  required: true,
                  message: formatMessage({ id: 'userlogin.baseurl.required' }),
                },
              ]}
            />
            <UserName
              name="username"
              placeholder={`${formatMessage({
                id: 'userlogin.login.username',
              })}: `}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'userlogin.username.required',
                  }),
                },
              ]}
            />
            <Password
              name="password"
              placeholder={`${formatMessage({
                id: 'userlogin.login.password',
              })}: `}
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: 'userlogin.password.required',
                  }),
                },
              ]}
              onPressEnter={e => {
                e.preventDefault();
                this.loginForm.validateFields(this.handleSubmit);
              }}
            />
          </Tab>
          <div>
            <Checkbox checked={autoLogin} onChange={this.changeAutoLogin}>
              <FormattedMessage id="userlogin.login.remember-me" />
            </Checkbox>

          </div>
          <Submit loading={submitting}>
            <FormattedMessage id="userlogin.login.login" />
          </Submit>
        </LoginComponents>
      </div>
    );
  }
}

export default UserLogin;
