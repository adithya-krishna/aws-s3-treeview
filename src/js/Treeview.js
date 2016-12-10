import React, { Component } from 'react';
import map from 'lodash/map';
import forEach from 'lodash/forEach';

class TreeView extends Component {
    constructor(props) {
        super(props);

        this.nodeClick = this.nodeClick.bind(this);
    }

    /**
     * loadNodes - used to decorate the response from the S3 API for the tree view
     * attaches state and children variables for a node
     * state - indicates the state of the current node (expanded, collapsed or expanding). initialized to collapsed
     * children - holds the children of a node. initialized to null.
     */
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

    /**
     * resolveIcon - generates appropriate icons that are displayed along with node
     * displays file icon for files and folder icons for the folders
     */
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

    /**
     * createNodeRow - generates the current node being rendered
     */
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

    /**
     * createNodesView - used to generate the tree view shown in the render method
     * the function mountList is recursive and generates all the nodes including children for a node
     * nodeList - is the list that is currently rendered
     * level - is the current level of the node
     * parentKey - is used to track the key of the node used to describe the current node
     */
    createNodesView(){
        // recursive function to create the expanded tree in a list
        const mountList = (nodeList, level, parentKey) => {
            let count = 0;
            const displayedList = [];

            // is the root being rendered
            if (!parentKey && this.props.title) {
                displayedList.push(this.props.title);
            }

            forEach(nodeList, node => {
                const key = (parentKey ? parentKey + '.' : '') + count;
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

    /**
     * nodeClick - checks the node that is being clicked and expands or collapses accordingly
     * the state variable in a node determines the expanded or collapsed state
     * if a file is clicked it opens the file in a new tab
     */
    nodeClick(evt) {
        const key = evt.currentTarget.getAttribute('data-item');
        let currentActiveNodes = this.state.root;
        let node = null;

        forEach(key.split('.'), index => {
            node = currentActiveNodes[Number(index)];
            currentActiveNodes = node.children;
        });

        // if a file is clicked, calls the getObject method to open the file
        if( !node.item.isFolder ){
            this.props.getObject(node.item.key);
        }

        if (node.state === 'collapsed') {
            this.expandNode(node);
        } else {
            this.collapseNode(node);
        }
    }

    /**
     * expandNode - expands the current node
     * for asynchronous calls, attaches an expanding state which is used for displaying a loading spinner
     */
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

    /**
     * collapseNode - collapses the current node
     * it resets the children within a node
     * this is done so that subsequent calls to the same node will refresh with new data from the API
     * If this is not done, the previous children can be displayed
     */
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
