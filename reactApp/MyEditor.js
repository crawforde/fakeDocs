import React from 'react';
import {Editor, EditorState, RichUtils, Modifier} from 'draft-js';
import Toolbar from './Toolbar';
import Save from './Save';
import History from './History';
import { styleMap } from './editorStyles';
import axios from 'axios';

class MyEditor extends React.Component {

  constructor(props) {
    super(props);
    var pathname = props.location.pathname;
    pathname = pathname.split('/');

    this.state = {
      docId: pathname.pop(),
      editorState: EditorState.createEmpty(),
      COLOR: 'mixed',
      SIZE: 'mixed'
    };
    this.onChange = this.onChange.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.blockStyleFn = this.blockStyleFn.bind(this);
    this.handleSelectionEvent = this.handleSelectionEvent.bind(this);
  }

/*
  componentWillMount(){
    axios.get(`${process.env.DOMAIN}/editorView/${this.state.docId}`)
    .then((doc)=>{

    })
  }
*/

  onChange(newState){
    const currentContentState = this.state.editorState.getCurrentContent();
    const newContentState = newState.getCurrentContent();
    if (currentContentState === newContentState) {
      var selectionState = newState.getSelection();
      var anchorKey = selectionState.getAnchorKey();
      var contentBlock = newContentState.getBlockForKey(anchorKey);
      var start = selectionState.getStartOffset();
      var end = selectionState.getEndOffset();
      var chars = contentBlock.getCharacterList()._tail;
      if(chars){
        var charStyles = chars.array.map((metadata)=>{
          return metadata.getStyle() ? metadata.getStyle()._map._list : metadata;
        });
        charStyles = charStyles.slice(start,end);
        charStyles = charStyles.map((list)=>{
          if(list._tail){
            return list._tail.array.map((feature)=>{
              return feature ? feature[0] : feature;
            });
          }
          return false;
        });
        this.handleSelectionEvent(charStyles);
      }
    }
    this.setState({editorState: newState});
  }

  handleSelectionEvent(charStyles){
    var color = false;
    var size = false;
    var colors = charStyles.map((styles)=>this.getStyle(styles,'COLOR'));
    if(colors.length > 0){
      color = this.describeStyle(colors);
    }
    var sizes = charStyles.map((styles)=>this.getStyle(styles,'SIZE'));
    if(sizes.length > 0) {
      size = this.describeStyle(sizes);
    }
    if(!color){
      color = 'mixed';
    }
    if(!size){
      size = 'mixed';
    }
    this.setState({
      COLOR: color,
      SIZE: size
    });
  }

  describeStyle(arr){
    var value = arr.pop();
    try{
      arr.forEach((val)=>{
        if(val !== value){
          throw('Mixed Styles');
        }
      });
    } catch(err) {
      return 'mixed';
    }
    return value;
  }

  getStyle(styles, styleType){
    if(!styles || styles.length === 0){
      return false;
    }
    try {
      styles.forEach((styleName)=>{
        if(styleName){
          var arr = styleName.split('_');
          if(arr[0]===styleType){
            throw(styleName);
          }
        }
      });
    } catch(err){
      if (typeof err === 'string'){
        return err;
      }
      console.log('Error:', err);
    }
    return false;
  }

  toggleStrictInlineStyle(toggledStyle, propertyType){
    if(toggledStyle==='mixed'){
      this.setState({
        propertyType: toggledStyle
      });
    }
    else {
      const { editorState } = this.state;
      const selection = editorState.getSelection();

      // Let's just allow one color,size,etc. at a time. Turn off all styles with same property type.

      const nextContentState = Object.keys(styleMap)
        .filter((value)=>{
          var type = value.split('_')[0];
          return type === propertyType;
        })
        .reduce((contentState, style)=>{
          return Modifier.removeInlineStyle(contentState, selection, style);
        }, editorState.getCurrentContent());

      let nextEditorState = EditorState.push(
        editorState,
        nextContentState,
        "change-inline-style"
      );

      const currentStyle = editorState.getCurrentInlineStyle();

      // Unset style override for current style.
      if(selection.isCollapsed()) {
        nextEditorState = currentStyle.reduce((state,style) => {
          return RichUtils.toggleInlineStyle(state, style);
        }, nextEditorState);
      }

      // If the style is being toggled on, apply it.
      if(!currentStyle.has(toggledStyle)){
        nextEditorState = RichUtils.toggleInlineStyle(
          nextEditorState,
          toggledStyle
        );
      }

      // Above code sometimes has unanticipated consequences for blocks of text
      // with mixed styling. This next block ensures that the desired style is
      // applied.
      const nextStyle = nextEditorState.getCurrentInlineStyle();

      if(!nextStyle.has(toggledStyle)){
        nextEditorState = RichUtils.toggleInlineStyle(
          nextEditorState,
          toggledStyle
        );
      }
      this.setState({
        propertyType: toggledStyle
      },()=>this.onChange(nextEditorState));
    }
  }

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  setInlineStyle(styleName){
    this.onChange(RichUtils.toggleInlineStyle(
      this.state.editorState,
      styleName
    ));
  }

  setBlockStyle(styleName) {
    this.onChange(RichUtils.toggleBlockType(
      this.state.editorState,
      styleName
    ));
  }

  blockStyleFn(contentBlock){
    switch (contentBlock.getType()){
    case 'TEXT_LEFT':
      return 'text-align-left';
    case 'TEXT_CENTER':
      return 'text-align-center';
    case 'TEXT_RIGHT':
      return 'text-align-right';
    default:
      return '';
    }
  }

  onSave(evt){
    console.log('Saved!');
  }

  render() {
    return (
      <div id="editor" className="container">
        <h2>Shareable Document ID: {this.state.docId}</h2>
       <Toolbar
         COLOR={this.state.COLOR}
         SIZE={this.state.SIZE}
         setInlineStyle={(styleName)=>this.setInlineStyle(styleName)}
         setBlockStyle={(styleName)=>this.setBlockStyle(styleName)}
         toggleStrictInlineStyle={(fontSize,propertyType)=>this.toggleStrictInlineStyle(fontSize,propertyType)}
       />
       <Editor
         customStyleMap={styleMap}
         editorState={this.state.editorState}
         handleKeyCommand={this.handleKeyCommand}
         onChange={this.onChange}
         blockStyleFn={this.blockStyleFn}
       />
       <Save onSave={(evt)=>this.onSave(evt)}/>
       <History versions={['yesterday','today']}/>
     </div>
    );
  }
}

module.exports = MyEditor;
