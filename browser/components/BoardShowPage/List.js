import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import Form from '../Form'
import Link from '../Link'
import Icon from '../Icon'
import Card from './Card'
import NewCardForm from './NewCardForm'
import boardStore from '../../stores/boardStore'
import autosize from 'autosize'
import ToggleComponent from '../ToggleComponent'
import Button from '../Button'
import PopoverMenuButton from '../PopoverMenuButton'
import ListActionsMenu from '../ListActionsMenu'
import commands from '../../commands'

export default class List extends Component {

  static propTypes = {
    board: React.PropTypes.object.isRequired,
    list:  React.PropTypes.object.isRequired,
    cards: React.PropTypes.array.isRequired,
    onDragStart: React.PropTypes.func.isRequired,
    draggingCardId: React.PropTypes.number,
    ghosted: React.PropTypes.bool,
  }

  static defaultProps = {
    ghosted: false,
  }

  constructor(props) {
    super(props)
    this.state = {
      creatingCard: false,
      newCardOrder: 0,
      listActionsMenuTop: '-9999em',
      listActionsMenuLeft: '-9999em',
    }

    this.creatingCard = this.creatingCard.bind(this)
    this.creatingCardTop = this.creatingCardTop.bind(this)
    this.cancelCreatingCard = this.cancelCreatingCard.bind(this)
    this.incNewCardFormOrder = this.incNewCardFormOrder.bind(this)
    this.openListOptionsMenu = this.openListOptionsMenu.bind(this)
    this.closeListOptionsMenu = this.closeListOptionsMenu.bind(this)
    this.moveIfUserClickedOutside = this.moveIfUserClickedOutside.bind(this)
    this.upDateListOptionsMenuPosition = this.upDateListOptionsMenuPosition.bind(this)

    document.body.addEventListener('click', this.moveIfUserClickedOutside, false)
  }

  componentDidUpdate(){
    if (this.state.creatingCard){
      const { cards } = this.refs
      cards.scrollTop = cards.scrollHeight
    }
  }

  componentDidMount() {
    addEventListener('resize', this.upDateListOptionsMenuPosition)
  }

  componentWillUnmount() {
    removeEventListener('resize', this.upDateListOptionsMenuPosition)
  }

  creatingCard() {
    const {cards, list} = this.props
    const newCardOrder = cards.filter(card =>
      card.list_id === list.id && card.archived === false
    ).length
    this.setState({creatingCard: true, newCardOrder: newCardOrder})
  }

  creatingCardTop() {
    this.setState({creatingCard: true, newCardOrder: 0})
  }

  cancelCreatingCard() {
    this.setState({creatingCard: false})
  }

  incNewCardFormOrder() {
    this.setState({newCardOrder: this.state.newCardOrder + 1})
  }

  openListOptionsMenu(event){
    event.preventDefault()
    const button = ReactDOM.findDOMNode(this.refs.openListOptionsMenu)
    const dialog = $(ReactDOM.findDOMNode(this.refs.listActionsMenu)).find('.DialogBox')[0]
    const buttonRect = button.getBoundingClientRect()
    const dialogRect = dialog.getBoundingClientRect()
    let top = buttonRect.top
    let left = buttonRect.left

    let widthOverlap = left + dialogRect.width - window.innerWidth
    if (widthOverlap > 0) left -= widthOverlap

    let heightOverlap = top + dialogRect.height - window.innerHeight
    if (heightOverlap > 0 && window.innerHeight < dialogRect.height) top = 45
    else if (heightOverlap > 0) top -= heightOverlap

    this.setState({
      listActionsMenuTop: top+'px',
      listActionsMenuLeft: left+'px',
    })
  }

  upDateListOptionsMenuPosition(event){
    event.preventDefault()
    const dialog = $(ReactDOM.findDOMNode(this.refs.listActionsMenu)).find('.DialogBox')[0]
    const dialogRect = dialog.getBoundingClientRect()
    let top = dialogRect.top
    let left = dialogRect.left

    let widthOverlap = left + dialogRect.width - window.innerWidth
    if (widthOverlap > 0) left -= widthOverlap

    let heightOverlap = top + dialogRect.height - window.innerHeight
    if (heightOverlap > 0 && window.innerHeight < dialogRect.height) top = 45
    else if (heightOverlap > 0) top -= heightOverlap

    this.setState({
      listActionsMenuTop: top+'px',
      listActionsMenuLeft: left+'px',
    })
  }

  closeListOptionsMenu(event) {
    event.preventDefault()
    this.setState({
      listActionsMenuTop: '-9999em',
      listActionsMenuLeft: '-9999em',
    })
  }

  moveIfUserClickedOutside(event) {
    const container = $(ReactDOM.findDOMNode(this.refs.listActionsMenu)).find('.DialogBox')[0]
    if (!container.contains(event.target) && container !== event.target) {
      this.closeListOptionsMenu(event)
    }
  }

  render(){
    const { board, list } = this.props

    const cards = this.props.cards
      .filter(card => card.list_id === list.id)
      .sort((a, b) => a.order - b.order)

    let newCardForm, newCardFormTop, newCardLink
    if (this.state.creatingCard) {
      newCardForm = <NewCardForm
        key={'new-card'}
        board={board}
        list={list}
        onCancel={this.cancelCreatingCard}
        order={this.state.newCardOrder}
        onSave={this.incNewCardFormOrder}
      />
    } else {
      newCardLink = <Link onClick={this.creatingCard} className="BoardShowPage-create-card-link" >Add a card...</Link>
    }

    const cardNodes = cards.map((card, index) =>
      <Card
        editable
        key={card.id}
        card={card}
        index={index}
        ghosted={card.id == this.props.draggingCardId}
        board={board}
        list={list}
        onDragStart={this.props.onDragStart}
      />
    )

    cardNodes.splice(this.state.newCardOrder, 0, newCardForm)

    let className = "BoardShowPage-List-box"
    if (this.props.ghosted) className += ' BoardShowPage-List-box-ghosted'

    const listActionsMenuStyle = {
      position: 'fixed',
      top: this.state.listActionsMenuTop,
      left: this.state.listActionsMenuLeft,
      zIndex: 200,
    }

    return <div className='BoardShowPage-List' data-list-id={list.id}>
      <div
          className="BoardShowPage-listActionsMenu" style={listActionsMenuStyle}
        >
        <ListActionsMenu
          ref="listActionsMenu"
          board={this.props.board}
          list={this.props.list}
          onCreateCard={this.creatingCardTop}
          onClose={this.closeListOptionsMenu}
          onClick={this.moveIfUserClickedOutside}
          resize={this.upDateListOptionsMenuPosition}
        />
      </div>

      <div className={className}>
        <div className="BoardShowPage-ListHeader"
          className="BoardShowPage-ListHeader"
          draggable
          onDragStart={this.props.onDragStart}
        >
          <ListName list={list}/>
        </div>
        <Button
          ref="openListOptionsMenu"
          className="BoardShowPage-ListOptions"
          type={false}
          onClick={this.openListOptionsMenu}
        >
          <Icon type="ellipsis-h" />
        </Button>
        <div ref="cards"className="BoardShowPage-cards">
          {cardNodes}
        </div>
        {newCardLink}
      </div>
    </div>
  }
}

class ListName extends Component {
  constructor(props) {
    super(props)
    this.state = {
      editing: false,
      value: this.props.list.name
    }
    this.setValue = this.setValue.bind(this)
    this.updateName = this.updateName.bind(this)
    this.selectText = this.selectText.bind(this)
    this.startEditing = this.startEditing.bind(this)
  }

  setValue(event){
    this.setState({value: event.target.value})
  }

  startEditing(event){
    event.preventDefault()
    this.setState({editing: true})
  }

  componentDidUpdate(){
    if (this.state.editing) this.refs.input.focus()
  }

  updateName(){
    const list = this.props.list
    commands.updateListName(list.id, this.state.value)
      .then(() => {
        this.setState({editing: false})
      })
  }

  selectText(){
    this.refs.input.select()
  }

  render() {
    return this.state.editing ?
      <input
        ref="input"
        draggable={false}
        type="text"
        value={this.state.value}
        onChange={this.setValue}
        onBlur={this.updateName}
        onFocus={this.selectText}
      /> :
      <div
        onClick={this.startEditing}
      >
        {this.state.value}
      </div>
  }
}
