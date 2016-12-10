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

    /**
     * initialising AWS and setting bucket name
     */
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

    /**
     * getNodeName - sets the name of the node in the tree view
     * removes "/" that comes from the S3 API
     */
    getNodeName(name, isFolder){
        let pathStrings = name.split('/');
        return pathStrings[pathStrings.length - ( (isFolder) ? 2 : 1 )];
    }

    /**
     * getNodes - separates the response from the getAsyncNodes into files and folders
     * decorates the response for use in the Tree view
     */
    getNodes(parent) {
        // isolates the files from the response. All folders have a size = 0
        // the if conditions only allows files if any folders are in the response.
        let contents = [];
        forEach(parent.Contents, val => {
            if( val.Size > 0 )
                contents.push({name: this.getNodeName(val.Key, false), key: val.Key, level: parent.level + 1, isFolder: false});
        });

        // isolates the folders from the response and generates a list.
        return [
            ...map(parent.CommonPrefixes, val => {
                return {name: this.getNodeName(val.Prefix, true), prefix: val.Prefix,  level: parent.level + 1, isFolder: true}
            }),
            ...contents
        ];
    }

    /**
     * getAsyncNodes - gets the list of objects on the S3 bucket
     * with the help of the Delimiter and Prefix, the response is sorted
     * into respective files and folders
     */
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

    /**
     * getObject - generates a url that can be used to view the object
     * opens the url thus generated into a new tab.
     * All files not supported by the browser are downloaded.
     */
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
