import { Form, Input, Modal, Button, Tree } from 'antd';
import React, { Component } from 'react';

const { dialog } = window.require('electron').remote;
//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;

const FormItem = Form.Item;
const TreeNode = Tree.TreeNode;

class CreateForm extends Component {
  state = {
    localPath: '',
    remotePath: '',
    treeData: [],
  };

  componentDidMount() {
    let data = ipcRenderer.sendSync('propfind_child', '/');
    console.log('返回的信息', data);
    this.setState({ treeData: data });
  }
  /**
   * 选择远程路径
   * @param selectedKeys
   * @param e
   */
  selectRemotePath = (selectedKeys, e) => {
    console.log('selectedKeys', selectedKeys);
    console.log(e);
    console.log(this.state.treeData);
    //this.setState({remotePath: selectedKeys})
    this.props.form.setFieldsValue({ remotePath: selectedKeys[0] });
  };
  onLoadData = (treeNode) => {
    console.log('onLoadData', treeNode.props);
    return new Promise((resolve) => {
      let data = ipcRenderer.sendSync('propfind_child', treeNode.props.eventKey);
      console.log('treeNode.props.eventKey', treeNode.props.eventKey);
      console.log('新的地址：', data);
      treeNode.props.dataRef.children = data;

      this.setState({
        treeData: [...this.state.treeData],
      });
      resolve();
    });
  };
  renderTreeNodes = (data) => {
    return data.map((item) => {
      if (item.type == 'directory') {
        if (item.children) {
          return (
            <TreeNode title={item.basename} key={item.filename} dataRef={item}>
              {this.renderTreeNodes(item.children)}
            </TreeNode>
          );
        }
        return <TreeNode title={item.basename} key={item.filename} dataRef={item}/>;
      }
    });
  };

  render() {
    const { modalVisible, form, handleAdd, handleModalVisible } = this.props;

    const okHandle = () => {
      form.validateFields((err, fieldsValue) => {
        if (err) return;
        form.resetFields();
        handleAdd(fieldsValue);
      });
    };
    const showOpenDialog = () => {
      let log = dialog.showOpenDialogSync({
        properties: ['openFile', 'openDirectory'],
      });
      if (log != undefined) {
        //this.setState({localPath:log[0]})
        this.props.form.setFieldsValue({ localPath: log[0] });
      }
      console.log('dialog:', log);
    };


    return (
      <Modal
        destroyOnClose
        title="添加同步文件夹"
        visible={modalVisible}
        onOk={okHandle}
        onCancel={() => handleModalVisible()}
      >
        <FormItem
          labelCol={{
            span: 5,
          }}
          wrapperCol={{
            span: 15,
          }}
          label="本地文件夹"
        >
          {form.getFieldDecorator('localPath', {
            rules: [
              {
                required: true,
                message: '请选择本地文件夹',
                min: 5,
              },
            ],
          })(<Input placeholder="请选择本地文件夹" disabled={true}/>)}
          <div><Button
            onClick={showOpenDialog}>选择</Button></div>
        </FormItem>
        <FormItem
          labelCol={{
            span: 5,
          }}
          wrapperCol={{
            span: 15,
          }}
          label="网盘文件夹"
        >
          {form.getFieldDecorator('remotePath', {
            rules: [
              {
                required: true,
                message: '请选择网盘文件夹',
                min: 5,
              },
            ],
          })(<Input hidden={true}/>)}
          <div>
            <Tree loadData={this.onLoadData} autoExpandParent={false} onSelect={this.selectRemotePath}>
              {this.renderTreeNodes(this.state.treeData)}
            </Tree></div>
        </FormItem>
      </Modal>
    );
  };
}

export default Form.create()(CreateForm);
