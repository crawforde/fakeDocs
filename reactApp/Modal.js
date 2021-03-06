import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { modalStyles } from '../public/styles/styles.js';

class AddDocument extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      modalOpen: false
    };
  }
  modalClose(){
    this.setState({modalOpen: false});
  }
  newDocument(e){
    e.preventDefault();
    this.modalClose();
    axios.post('http://localhost:3000/docPortal/new', {
      title: this.refs.title.value,
      password: this.refs.password.value,
      username: this.props.username
    })
    .then((resp) => {
      this.refs.title.value = '';
      this.props.newDocList(resp.data);
    })
    .catch((err) => {alert('New Document Post request failed. Make sure to have both title and password.');});
  }
  newCollab(e){
    e.preventDefault();
    this.modalClose();
    axios.post('http://localhost:3000/docPortal/collab', {
      id: this.refs.title.value,
      password: this.refs.password.value,
      username: this.props.username
    })
    .then((resp) => {
      this.refs.title.value = '';
      this.props.newDocList(resp.data);
    })
    .catch((err) => {console.log('new Document Post request failed', err);});
  }
  prompt(){
    this.setState({modalOpen: true});
  }
  render() {
    return (
      <div>
        <input type='text'
          ref="title"
          placeholder={(this.props.newDoc) ? "New Document Title" : "New Collaboration Title"} />
        <button onClick={() => this.prompt()}>{(this.props.newDoc) ? 'Create New Document' : 'Add Collaboration'}</button>
        <Modal
          isOpen={this.state.modalOpen}
          style={modalStyles}
          contentLabel={(this.props.newDoc) ? "New Document" : "New Collaboration"}
          >
            <h2>Type in password to collaborate.</h2>
            <input type='password' ref="password" placeholder="Password" />
            <button onClick={(this.props.newDoc) ? (e) => this.newDocument(e) : (e) => this.newCollab(e)}>{(this.props.newDoc) ? 'Set password' : 'Verify password'}</button>
            <button onClick={() => this.modalClose()}>Cancel</button>
          </Modal>
        </div>
    );
  }
}

module.exports = { AddDocument };
