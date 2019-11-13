import React, { Component } from 'react';
import { Tree } from 'antd';
const TreeNode = Tree.TreeNode;
//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;

class FolderTree extends React.Component {
  state = {
    treeData: [],
  }
  componentDidMount() {
    let {remotePath,localPath} = this.props
    let data = ipcRenderer.sendSync('propfind_child', remotePath);
    console.log('返回的信息', data);
    this.setState({ treeData: data });
  }

  onLoadData = (treeNode) => {
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
  }
  renderTreeNodes = (data) => {
    return data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={item.basename} key={item.filename} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode  title={item.basename} key={item.filename}  dataRef={item} isLeaf={item.type !='directory'} />;
    });
  }
  render() {
    return (
      <Tree loadData={this.onLoadData}>
        {this.renderTreeNodes(this.state.treeData)}
      </Tree>
    );
  }
}
export default FolderTree
