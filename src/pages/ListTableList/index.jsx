import {
  Badge,
  Button,
  Card,
  List,
  Collapse,
  Divider,
  Dropdown,
  Form,
  Icon,
  Input,
  InputNumber,
  Menu,
  Avatar,
  Select,
  message,
  Tree,
} from 'antd';
import React, { Component, Fragment } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { connect } from 'dva';
import moment from 'moment';
import CreateForm from './components/CreateForm';
import FolderTree from './components/FolderTree';
import styles from './style.less';


//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;
const FormItem = Form.Item;
const { Panel } = Collapse;



/* eslint react/no-multi-comp:0 */
@connect(({ listTableList, loading }) => ({
  list: listTableList.data,
  loading: loading.models.listTableList,
}))
class TableList extends Component {
  state = {
    modalVisible: false,
    updateModalVisible: false,
    expandForm: false,
    selectedRows: [],
    formValues: {},
    stepFormValues: {},
    list: [],
  };



  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'listTableList/fetch',
    });
  }

  handleMenuClick = (type,item) => {
    console.log(type,item)
    const { dispatch } = this.props;
    switch (type) {
      case 'remove':
        dispatch({
          type: 'listTableList/remove',
          payload: item
        });
        break;
      case 'startSync':
        dispatch({
          type: 'listTableList/update',
          payload: {...item,check:true}
        });
        break;
      case 'stopSync':
        dispatch({
          type: 'listTableList/update',
          payload: {...item,check:false}
        });
        break;
    }
  };
  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
    });
  };
  handleAdd = fields => {
    //ipcRenderer.sendSync('storage_add_check_path',fields)
    const { dispatch } = this.props;
    dispatch({
      type: 'listTableList/add',
      payload: fields,
    });
    message.success('添加成功');
    this.handleModalVisible();
  };

  render() {
    const {
      list,
      loading,
    } = this.props;
    console.log(list);
    const { selectedRows, modalVisible } = this.state;
    const menu = (item)=> (
      <Menu>
        {item.check || <Menu.Item key="startSync"  onClick={()=>this.handleMenuClick('startSync',item)}>开始同步</Menu.Item>}
        {item.check && <Menu.Item key="stopSync"  onClick={()=>this.handleMenuClick('stopSync',item)}>停止同步</Menu.Item>}
        <Menu.Item key="remove"  onClick={()=>this.handleMenuClick('remove',item)}>删除</Menu.Item>
      </Menu>
    );
    const header = (item)=>(
      <Card bordered={false}>
        <Card.Meta
          avatar={<Avatar style={item.check ? { backgroundColor: '#1890FF' }: {}} icon="folder"/>}
          title={item.remotePath}
          description={item.localPath}
        />
      </Card>
    )
    const extra = (item)=>(
      <div onClick={e=>e.stopPropagation()}>
        <Dropdown overlay={menu(item)}><Icon
          type="setting"
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            marginTop: '-11px',
          }}
          onClick={event => {
            // If you don't want click extra trigger collapse, you can prevent this:
            event.stopPropagation();
          }}
        /></Dropdown>
      </div>
    )
    const parentMethods = {
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    return (
      <div>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                添加同步文件夹
              </Button>

            </div>
            <Collapse bordered={false}>
              {list && list.map(item => {
                return (<Panel header={header(item)} key={item.remotePath + item.localPath} extra={extra(item)}>

                  <FolderTree remotePath={item.remotePath} localPath={item.localPath}/>
                </Panel>);
              })}
            </Collapse>
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible}/>

      </div>
    );
  }
}

export default Form.create()(TableList);
