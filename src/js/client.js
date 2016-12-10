import React, { Component } from "react";
import ReactDOM from "react-dom";
import TreeView from './Treeview';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import 'aws-sdk/dist/aws-sdk';
const AWS = window.AWS;

class MainPage extends Component {
    constructor(props) {
        super(props);

        this.getAsyncNodes = this.getAsyncNodes.bind(this);
        this.getNodeName = this.getNodeName.bind(this);
        this.getObject = this.getObject.bind(this);
    }

    componentWillMount(){
        AWS.config.update({
            accessKeyId: "AKIAIH56X6S77ETER5OA",
            secretAccessKey: "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",
            region: "ap-south-1"
        });
        this.s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {
                Bucket: 'sample-adithya-krishna',
            }
        });
    }

    getNodeName(name, isFolder){
        let pathStrings = name.split('/');
        return pathStrings[pathStrings.length - ( (isFolder) ? 2 : 1 )];
    }

    getNodes(parent) {
        /// for all files
        let contents = [];
        forEach(parent.Contents, val => {
            if( val.Size > 0 )
                contents.push({name: this.getNodeName(val.Key, false), key: val.Key, level: parent.level + 1, isFolder: false});
        });

        // for all folders
        return [
            ...map(parent.CommonPrefixes, val => {
                return {name: this.getNodeName(val.Prefix, true), prefix: val.Prefix,  level: parent.level + 1, isFolder: true}
            }),
            ...contents
        ];
    }

    getAsyncNodes(parent){
        if( !parent ) parent = {level: 0};
        let prefix = ( parent.level === 0 ) ? "" : parent.prefix;

        return new Promise((resolve, reject) => {
            this.s3.listObjectsV2({
                Delimiter: '/',
                Prefix: prefix
            }, (err, data) => {
                if (err){
                    reject(err);
                } else {
                    resolve(this.getNodes(Object.assign({}, parent, data)));
                }
            });
        });
    }

    getObject(key){
        let url = this.s3.getSignedUrl('getObject', {Key: key});
        window.open(url, '_blank');
    }

    render() {
        return <div className="container">
            <nav className="navbar navbar-default navbar-fixed-top">
                <div className="container-fluid">
                    <a className="navbar-brand" href="javascript: void(0);">AWS S3 Browser</a>
                </div>
            </nav>
            <TreeView getAsyncNodes={this.getAsyncNodes} getObject={this.getObject}/>
        </div>
    }
}

ReactDOM.render(<MainPage />, document.getElementById('root'));
