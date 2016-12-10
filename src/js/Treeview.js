import React, { Component } from 'react';
import map from 'lodash/map';
import forEach from 'lodash/forEach';

class TreeView extends Component {
    constructor(props) {
        super(props);

        this.nodeClick = this.nodeClick.bind(this);
    }

    loadNodes(parent){
        const {getAsyncNodes} = this.props;
        if( !getAsyncNodes ) return false;
        let res = getAsyncNodes(parent ? parent.item : undefined);

        return res.then(listItem => {
            return map(listItem, val => {
                return { item: val, state: 'collapsed', children: null }
            })
        })
    }

    resolveIcon(node) {
        let iconNode;

        if (!node.item.isFolder) {
            iconNode = <i className={"fa fa-file-o fa-fw"} />;
        } else {
            iconNode = node.state === 'collapsed'
                ? <span style={{paddingRight: 10}}><i className={"fa fa-chevron-right fa-fw"} /><i className={"fa fa-folder-o fa-fw"} /></span>
                : <span style={{paddingRight: 10}}><i className={"fa fa-chevron-down fa-fw"} /><i className={"fa fa-folder-open-o fa-fw"} /></span>;
        }

        return iconNode;
    }

    createNodeRow(node, level, key) {
        const { indent } = this.props;

        const waitIcon = node.state === 'expanding' ?
            <div className="fa fa-refresh fa-fw fa-spin" /> : null;

        return (
            <a key={key} className="node list-group-item node-link" onClick={this.nodeClick} data-item={key} style={{ paddingLeft: (15 + level * indent) }}>
                {waitIcon}
                {this.resolveIcon(node)}
                {node.item.name}
            </a>
        );
    }

    createNodesView(){
        // recursive function to create the expanded tree in a list
        const mountList = (nodeList, level, parentkey) => {
            let count = 0;
            const displayedList = [];

            // is the root being rendered
            if (!parentkey && this.props.title) {
                displayedList.push(this.props.title);
            }

            forEach(nodeList, node => {
                const key = (parentkey ? parentkey + '.' : '') + count;
                const row = this.createNodeRow(node, level, key);

                displayedList.push(row);
                if (node.state !== 'collapsed' && node.item.isFolder && node.children) {
                    displayedList.push(mountList(node.children, level + 1, key));
                }
                count++;
            });
            return displayedList;
        };

        return mountList(this.state.root, 0, false);
    }

    nodeClick(evt) {
        const key = evt.currentTarget.getAttribute('data-item');
        let currentActiveNodes = this.state.root;
        let node = null;

        forEach(key.split('.'), index => {
            node = currentActiveNodes[Number(index)];
            currentActiveNodes = node.children;
        });

        if( !node.item.isFolder ){
            this.props.getObject(node.item.key);
        }

        if (node.state === 'collapsed') {
            this.expandNode(node);
        } else {
            this.collapseNode(node);
        }
    }

    expandNode(node) {
        // children are not loaded ?
        if (!node.children) {
            node.state = 'expanding';
            this.forceUpdate();

            // load the children
            this.loadNodes(node)
                .then(res => {
                    node.state = 'expanded';
                    node.children = res;
                    // force tree to show the new expanded node
                    this.forceUpdate();
                });
        }
        else {
            node.state = 'expanded';
            // force tree to show the new expanded node
            this.forceUpdate();
        }
    }

    collapseNode(node) {
        node.state = 'collapsed';
        //this is done to to check if data changes in folders. If this is not done, any update on the server will not reflect till the page is refreshed.
        node.children = null;

        this.forceUpdate();
    }


    render() {
        const root = this.state ? this.state.root : null;

        if( !root ){
            this.loadNodes()
                .then(res => this.setState({ root: res }));

            return <i className="fa fa-refresh fa-fw fa-spin" />;
        }

        return <div className="row tree-view">
            <div className="col-xs-12 col-lg-6 col-lg-offset-3">
                {this.createNodesView()}
            </div>
        </div>;
    }
}

TreeView.propTypes = {
    iconSize: React.PropTypes.number,
    indent: React.PropTypes.number
};


TreeView.defaultProps = {
    iconSize: 1,
    indent: 16
};

export default TreeView;
