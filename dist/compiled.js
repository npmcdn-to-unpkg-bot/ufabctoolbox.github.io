(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function createPointCB(object){

    // A persistent object (as opposed to returned object) is used to save memory
    // This is good to prevent layout thrashing, or for games, and such

    // NOTE
    // This uses IE fixes which should be OK to remove some day. :)
    // Some speed will be gained by removal of these.

    // pointCB should be saved in a variable on return
    // This allows the usage of element.removeEventListener

    return function pointCB(event){

        event = event || window.event; // IE-ism
        object.target = event.target || event.srcElement || event.originalTarget;
        object.element = this;
        object.type = event.type;

        // Support touch
        // http://www.creativebloq.com/javascript/make-your-site-work-touch-devices-51411644

        if(event.targetTouches){
            object.x = event.targetTouches[0].clientX;
            object.y = event.targetTouches[0].clientY;
            object.pageX = event.pageX;
            object.pageY = event.pageY;
        }else{

            // If pageX/Y aren't available and clientX/Y are,
            // calculate pageX/Y - logic taken from jQuery.
            // (This is to support old IE)
            // NOTE Hopefully this can be removed soon.

            if (event.pageX === null && event.clientX !== null) {
                var eventDoc = (event.target && event.target.ownerDocument) || document;
                var doc = eventDoc.documentElement;
                var body = eventDoc.body;

                object.pageX = event.clientX +
                  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                  (doc && doc.clientLeft || body && body.clientLeft || 0);
                object.pageY = event.clientY +
                  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                  (doc && doc.clientTop  || body && body.clientTop  || 0 );
            }else{
                object.pageX = event.pageX;
                object.pageY = event.pageY;
            }

            // pageX, and pageY change with page scroll
            // so we're not going to use those for x, and y.
            // NOTE Most browsers also alias clientX/Y with x/y
            // so that's something to consider down the road.

            object.x = event.clientX;
            object.y = event.clientY;
        }

    };

    //NOTE Remember accessibility, Aria roles, and labels.
};

/*
git remote add origin https://github.com/hollowdoor/create_point_cb.git
git push -u origin master
*/

},{}],2:[function(require,module,exports){
var createPointCB = require('create-point-cb');

/*
git remote add origin https://github.com/hollowdoor/dom_autoscroller.git
git push -u origin master
*/



function AutoScroller(elements, options){
    var self = this, pixels = 2;
    options = options || {};

    this.margin = options.margin || -1;
    this.scrolling = false;
    this.scrollWhenOutside = options.scrollWhenOutside || false;

    var point = {}, pointCB = createPointCB(point), down = false;

    window.addEventListener('mousemove', pointCB, false);
    window.addEventListener('touchmove', pointCB, false);

    if(!isNaN(options.pixels)){
        pixels = options.pixels;
    }

    if(typeof options.autoScroll === 'boolean'){
        this.autoScroll = options.autoScroll ? function(){return true;} : function(){return false;};
    }else if(typeof options.autoScroll === 'undefined'){
        this.autoScroll = function(){return false;};
    }else if(typeof options.autoScroll === 'function'){
        this.autoScroll = options.autoScroll;
    }

    this.destroy = function() {
        window.removeEventListener('mousemove', pointCB, false);
        window.removeEventListener('touchmove', pointCB, false);
        window.removeEventListener('mousedown', onDown, false);
        window.removeEventListener('touchstart', onDown, false);
        window.removeEventListener('mouseup', onUp, false);
        window.removeEventListener('touchend', onUp, false);
    };

    var hasWindow = null, temp = [];
    for(var i=0; i<elements.length; i++){
        if(elements[i] === window){
            hasWindow = window;
            break;
        }else{
            temp.push(elements[i])
        }
    }

    elements = temp;
    temp = null;

    Object.defineProperties(this, {
        down: {
            get: function(){ return down; }
        },
        interval: {
            get: function(){ return 1/pixels * 1000; }
        },
        pixels: {
            set: function(i){ pixels = i; },
            get: function(){ return pixels; }
        }
    });

    window.addEventListener('mousedown', onDown, false);
    window.addEventListener('touchstart', onDown, false);
    window.addEventListener('mouseup', onUp, false);
    window.addEventListener('touchend', onUp, false);

    function onDown(){
        down = true;
    }

    function onUp(){
        down = false;
    }

    var n = 0, current;

    window.addEventListener('mousemove', onMove, false);
    window.addEventListener('touchmove', onMove, false);

    function onMove(event){

        if(!self.autoScroll()) return;
        if(!event.target) return;
        var target = event.target, last;

        if(!current || !inside(point, current)){
            if(!current && target){
                current = null;
                while(target = target.parentNode){
                    for(var i=0; i<elements.length; i++){
                        if(elements[i] === target && inside(point, elements[i])){
                            current = elements[i];
                            break;
                        }
                    }
                }
            }else{
                last = current;
                current = null;
                for(var i=0; i<elements.length; i++){
                    if(elements[i] !== last && inside(point, elements[i])){
                        current = elements[i];
                    }
                }
            }
        }

        if(hasWindow){
            autoScroll(hasWindow);
        }

        if(!current) return;

        autoScroll(current);
    }

    function autoScroll(el){
        var rect = getRect(el);

        if(point.y < rect.top + self.margin){
            autoScrollV(el, -1, rect);
        }else if(point.y > rect.bottom - self.margin){
            autoScrollV(el, 1, rect);
        }

        if(point.x < rect.left + self.margin){
            autoScrollH(el, -1, rect);
        }else if(point.x > rect.right - self.margin){
            autoScrollH(el, 1, rect);
        }
    }



    function autoScrollV(el, amount, rect){

        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && !inside(point, el, rect)) return;

        if(el === window){
            window.scrollTo(el.pageXOffset, el.pageYOffset + amount);
        }else{

            el.scrollTop = el.scrollTop + amount;
        }

        setTimeout(function(){
            if(point.y < rect.top + self.margin){
                autoScrollV(el, amount, rect);
            }else if(point.y > rect.bottom - self.margin){
                autoScrollV(el, amount, rect);
            }
        }, self.interval);
    }

    function autoScrollH(el, amount, rect){

        if(!self.autoScroll()) return;
        if(!self.scrollWhenOutside && !inside(point, el, rect)) return;

        if(el === window){
            window.scrollTo(el.pageXOffset + amount, el.pageYOffset);
        }else{
            el.scrollLeft = el.scrollLeft + amount;
        }

        setTimeout(function(){
            if(point.x < rect.left + self.margin){
                autoScrollH(el, amount, rect);
            }else if(point.x > rect.right - self.margin){
                autoScrollH(el, amount, rect);
            }
        }, self.interval);
    }

}

module.exports = function AutoScrollerFactory(element, options){
    return new AutoScroller(element, options);
};

function getRect(el){
    if(el === window){
        return {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight
        };

    }else{
        try{
            return el.getBoundingClientRect();
        }catch(e){
            throw new TypeError("Can't call getBoundingClientRect on "+el);
        }

    }
}

function inside(point, el, rect){
    rect = rect || getRect(el);
    return (point.y > rect.top && point.y < rect.bottom &&
            point.x > rect.left && point.x < rect.right);
}

},{"create-point-cb":1}],3:[function(require,module,exports){
'use strict';
module.exports = selector => {
	return new Promise(resolve => {
		const el = document.querySelector(selector);

		// shortcut if the element already exists
		if (el) {
			resolve(el);
			return;
		}

		// interval to keep checking for it to come into the DOM
		const awaitElement = setInterval(() => {
			const el = document.querySelector(selector);

			if (el) {
				resolve(el);
				clearInterval(awaitElement);
			}
		}, 50);
	});
};

},{}],4:[function(require,module,exports){
/* @license Copyright (c) 2016 Charbel Rami. All rights reserved. */
/* global firebase dragula moment */

const config = {
  apiKey: 'AIzaSyCXgY7KO0_aBe1HvrLRSxEwK4YcRxy01Ig',
  authDomain: 'ufabc-toolbox.firebaseapp.com',
  databaseURL: 'https://ufabc-toolbox.firebaseio.com',
  storageBucket: 'ufabc-toolbox.appspot.com'
}
firebase.initializeApp(config)

const signInButton = document.getElementById('js-button-sign-in')
const signOutButton = document.getElementById('js-button-sign-out')
const deleteUserButton = document.getElementById('js-button-delete-user')
const allTodosList = document.getElementById('js-list-all')
const todoList = document.getElementById('js-list-todo')
const doneList = document.getElementById('js-list-done')
const populateListButton = document.getElementById('js-button-populate-list')
const emptyListButton = document.getElementById('js-button-empty-list')
const saveListButton = document.getElementById('js-button-save-lists')
const forms = document.getElementsByTagName('form')
const inputs = document.getElementsByClassName('js-input')
const newPostForm = document.getElementById('js-form-new-post')
const userPostContainer = document.getElementById('js-section-user-posts')
const courseSelect = document.getElementById('js-select-course')
const userContent = document.getElementsByClassName('js-signedin-user')
const noUserContent = document.getElementsByClassName('js-signedout-user')
const tabs = document.getElementsByClassName('tab')
const panes = document.getElementsByClassName('tab-pane')

const userSignIn = () => {
  const provider = new firebase.auth.GoogleAuthProvider()
  firebase.auth().signInWithRedirect(provider)
}

firebase.auth().getRedirectResult()
  .then(result => {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const token = result.credential.accessToken
      // ...
      console.log(result)
    }
    // The signed-in user info.
    const user = result.user
    const name = user.displayName
    const email = user.email
    // const photoURL = user.photoURL
    const uid = user.uid
    const userRef = firebase.database().ref(`users/${uid}`)
    const todo = []
    const done = []
    userRef.once('value')
      .then(snapshot => {
        if (snapshot.val() === null) {
          userRef.set({
            name,
            email,
            todo,
            done
            // photoURL
          })
            .then(() => {
              console.log('Synchronization succeeded')
            })
            .catch(error => {
              console.log('Synchronization failed')
            })
        }
      })
  })
  .catch(error => {
    // Handle Errors here.
    const errorCode = error.code
    const errorMessage = error.message
    // The email of the user's account used.
    const email = error.email
    // The firebase.auth.AuthCredential type that was used.
    const credential = error.credential
    // ...
  })

const userSignOut = () => {
  firebase.auth().signOut()
    .then(() => {
      // Sign-out successful.
      console.log('sign out')
      document.location.reload(true)
    }, error => {
      // An error happened.
    })
}

const deleteUser = () => {
  const user = firebase.auth().currentUser
  const uid = firebase.auth().currentUser.uid
  firebase.database().ref('users')
    .child(uid)
    .remove()

  user.delete()
    .then(() => {
      // User deleted.
      document.location.reload(true)
    }, error => {
      // An error happened.
    })
}

// const user = firebase.auth().currentUser;

// if (user) {
//   // User is signed in.

// } else {
//   // No user is signed in.
// }

const initTodos = require('./initTodos.js')

for (let i = 0; i < initTodos.length; i++) {
  initTodos[i].id = i
}

const retrieveList = (list, node) => {
  if (list) {
    node.innerHTML = ''
    for (const x of list) {
      for (const {id, name, page} of initTodos) {
        if (x === id) {
          const li = document.createElement('li')
          li.innerHTML = `${name} &middot; <a href="http://prograd.ufabc.edu.br/doc/catalogo_disciplinas_de_graduao_2015_2016.pdf#page=${page}" target="_blank">${page}</a>`
          li.dataset.id = id
          li.classList.add('list-item')
          node.appendChild(li)
        }
      }
    }
  }
}

const deletePost = e => {
  const cnt = e.target.parentNode
  const key = cnt.dataset.key
  const uid = firebase.auth().currentUser.uid
  firebase.database().ref(`users/${uid}/posts`)
    .child(key)
    .remove()
  cnt.parentNode.removeChild(cnt)
}

const getDeletePostButtons = () => {
  const deletePostButtons = document.getElementsByClassName('js-button-delete-post')
  for (const x of deletePostButtons) {
    x.addEventListener('click', e => {
      deletePost(e)
    })
  }
}

const populatePosts = (posts, node) => {
  if (posts) {
    node.innerHTML = ''
    for (const key in posts) {
      if ({}.hasOwnProperty.call(posts, key)) {
        const post = posts[key]
        const course = initTodos[post.course]
        const date = moment(post.date).format('LLLL')
        const timeFromNow = moment(post.date, 'YYYY-MM-DD').fromNow()
        const cls = post.cls
        const period = post.period
        const location = post.location
        const details = post.details

        node.innerHTML += `<article data-key="${key}">${course.name} &middot ${course.page} &middot; ${timeFromNow}: ${date}, na turma ${cls}, ${period}, ${location}. <small>Detalhes: ${details}</small> <button type="button" class="js-button-delete-post">X</button></article>`
      }
    }
    getDeletePostButtons()
  }
}

const populateSelect = (list, node) => {
  if (node.innerHTML) {
    console.log('already populated')
  } else {
    node.innerHTML = '<option value="">Disciplina</option>'
    const fragment = document.createDocumentFragment()
    for (const {id, name} of list) {
      const option = document.createElement('option')
      option.innerHTML = name
      option.value = id
      fragment.appendChild(option)
    }
    node.appendChild(fragment)
  }
}

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // signInButton.hidden = true
    // signOutButton.hidden = false
    // deleteUserButton.hidden = false
    // userContent.hidden = false
    for (const x of userContent) {
      x.hidden = false
    }
    for (const x of noUserContent) {
      x.hidden = true
    }

    const uid = user.uid
    firebase.database().ref(`users/${uid}`)
      .once('value')
      .then(snapshot => {
        const name = snapshot.val().name
        console.log(name)
        // ...
      })

    firebase.database().ref(`users/${uid}/todo`)
      .once('value')
      .then(snapshot => {
        const todoItems = snapshot.val()
        retrieveList(todoItems, todoList)
      })

    firebase.database().ref(`users/${uid}/done`)
      .once('value')
      .then(snapshot => {
        const doneItems = snapshot.val()
        retrieveList(doneItems, doneList)
      })

    firebase.database().ref(`users/${uid}/posts`)
      .once('value')
      .then(snapshot => {
        const userPosts = snapshot.val()
        populatePosts(userPosts, userPostContainer)
      })

    populateSelect(initTodos, courseSelect)
  } else {
    // No user is signed in.
    // signInButton.hidden = false
    // signOutButton.hidden = true
    // deleteUserButton.hidden = true
    // userContent.hidden = true
    for (const x of userContent) {
      x.hidden = true
    }
    for (const x of noUserContent) {
      x.hidden = false
    }
  }
})

// import './forms.js'
// import './tabs.js'
// const dragula = require('dragula')
const autoScroll = require('dom-autoscroller')
// const moment = require('moment')
// require('moment/locale/pt-br')
const elementReady = require('element-ready')
// const initTodosIds = [...Array(initTodos.length).keys()]

const populateList = (list, node) => {
  if (node.innerHTML) {
    console.log('already populated')
  } else {
    node.innerHTML = ''
    node.parentNode.hidden = false
    const lengthTextId = `#${node.id}-length`
    elementReady(lengthTextId)
      .then(element => {
        element.innerHTML = `&middot; ${list.length} courses`
      })

    const fragment = document.createDocumentFragment()
    for (const {id, name, page} of list) {
      const li = document.createElement('li')
      li.innerHTML = `${name} &middot; <a href="http://prograd.ufabc.edu.br/doc/catalogo_disciplinas_de_graduao_2015_2016.pdf#page=${page}" target="_blank">${page}</a>`
      li.dataset.id = id
      li.classList.add('list-item')
      fragment.appendChild(li)
    }
    node.appendChild(fragment)
  }
}

const emptyList = node => {
  if (node.innerHTML) {
    node.innerHTML = ''
    node.parentNode.hidden = true
  } else {
    console.log('already empty')
  }
}

const drake = dragula([allTodosList, todoList, doneList], {
  copy (el, source) {
    return source === allTodosList
  },
  accepts (el, target) {
    return target !== allTodosList
  },
  removeOnSpill: true
})

autoScroll([
  allTodosList,
  todoList,
  doneList
], {
  margin: 40,
  pixels: 40,
  scrollWhenOutside: true,
  autoScroll () {
    return this.down && drake.dragging
  }
})

const saveLists = () => {
  const todoEls = Array.from(todoList.querySelectorAll('li'))
  const doneEls = Array.from(doneList.querySelectorAll('li'))
  console.log(todoEls)
  console.log(doneEls)

  const todo = []
  for (const x of todoEls) {
    todo.push(parseInt(x.dataset.id, 10))
  }

  const done = []
  for (const x of doneEls) {
    done.push(parseInt(x.dataset.id, 10))
  }

  console.log(todo)
  console.log(done)
  const uid = firebase.auth().currentUser.uid
  console.log(uid)
  firebase.database().ref(`users/${uid}`)
    .update({
      todo,
      done
    })
    .then(() => {
      console.log('saved!')
    })
}

const showTab = key => {
  for (const x of panes) {
    if (parseInt(x.dataset.key, 10) === key) {
      x.hidden = false
      x.classList.add('tab--show')
    } else {
      x.classList.remove('tab--show')
      x.hidden = true
    }
  }
}

for (const x of tabs) {
  x.addEventListener('click', () => {
    for (const y of tabs) {
      y.classList.remove('tab--select')
    }
    // e.preventDefault()
    x.classList.add('tab--select')
    showTab(parseInt(x.dataset.key, 10))
  })
}

for (const x of inputs) {
  const firstEl = 0
  const input = x.getElementsByTagName('input')[firstEl] || x.getElementsByTagName('textarea')[firstEl] || x.getElementsByTagName('select')[firstEl]
  const line = x.getElementsByClassName('input-line')[firstEl]
  const inputError = x.getElementsByClassName('input-error')[firstEl]
  const inputErrorMsg = input.dataset.errorMessage

  const removeError = () => {
    line.classList.remove('input-line--invalid')
    inputError.innerHTML = ''
  }

  const showError = () => {
    line.classList.add('input-line--invalid')
    inputError.innerHTML = inputErrorMsg
  }

  const verifyInput = () => {
    if (input.checkValidity() === false) {
      showError()
    } else {
      removeError()
    }
  }
  // line.addEventListener('animationend', e => {
  //   console.log(e)
  // })

  input.addEventListener('focus', () => {
    line.classList.add('input-line--focus')
    verifyInput()
  })

  input.addEventListener('blur', () => {
    line.classList.remove('input-line--focus')
    // removeError()
  })

  input.addEventListener('invalid', () => {
    showError()
  })

  input.addEventListener('valid', () => {
    removeError()
  })

  input.addEventListener('input', () => {
    verifyInput()
  })

  if (input.hasAttribute('maxlength')) {
    const charCounter = x.getElementsByClassName('input-char-counter')[firstEl]
    const charLimit = input.getAttribute('maxlength')
    const chars = input.value.length.toString()
    charCounter.innerHTML = charLimit - chars
    input.addEventListener('input', () => {
      const chars = input.value.length.toString()
      charCounter.innerHTML = charLimit - chars
    })
  }
}

const clearInputs = () => {
  for (const x of inputs) {
    const firstEl = 0
    const input = x.getElementsByTagName('input')[firstEl] || x.getElementsByTagName('textarea')[firstEl] || x.getElementsByTagName('select')[firstEl]
    if (input.tagName === 'SELECT') {
      input.value = ''
    } else {
      input.value = null
    }
    if (x.getElementsByClassName('input-char-counter')[firstEl]) {
      x.getElementsByClassName('input-char-counter')[firstEl].innerHTML = input.getAttribute('maxlength')
    }
  }
}

const writeNewPost = e => {
  e.preventDefault()
  const uid = firebase.auth().currentUser.uid
  console.log(e)
  const course = parseInt(e.target[0].value, 10)
  const date = e.target[1].value
  const cls = e.target[2].value
  const period = e.target[3].value
  const location = e.target[4].value
  const details = e.target[5].value

  const postData = {
    // uid,
    course,
    date,
    cls,
    period,
    location,
    details
  }

  const postsRef = firebase.database().ref(`users/${uid}/posts`)

  const newPostKey = postsRef.push().key

  postsRef.child(newPostKey).update(postData)
    .then(() => {
      console.log('saved!')
      clearInputs()
    })

  // const name = authentication.currentUser.name

  const courseText = initTodos[course]
  const dateText = moment(date).format('LLLL')
  const timeFromNow = moment(date, 'YYYY-MM-DD').fromNow()

  // userPostContainer.innerHTML += `<article data-key="${newPostKey}">${courseText.name} &middot ${courseText.page} &middot; ${timeFromNow}: ${dateText}, na turma ${cls}, ${period}, ${location}. <small>Detalhes: ${details}</small> <button type="button" class="js-button-delete-post">X</button></article>`
  userPostContainer.innerHTML += `<article data-key="${newPostKey}">${courseText.name} &middot ${timeFromNow}: ${dateText}, turma ${cls}, ${period}, ${location}. <small>Detalhes: ${details}</small> <button type="button" class="js-button-delete-post">X</button></article>`

  getDeletePostButtons()
}

signInButton.addEventListener('click', userSignIn)
signOutButton.addEventListener('click', userSignOut)
deleteUserButton.addEventListener('click', deleteUser)

emptyListButton.addEventListener('click', () => {
  emptyList(allTodosList)
})

populateListButton.addEventListener('click', () => {
  populateList(initTodos, allTodosList)
})

saveListButton.addEventListener('click', saveLists)

newPostForm.addEventListener('submit', writeNewPost)

},{"./initTodos.js":5,"dom-autoscroller":2,"element-ready":3}],5:[function(require,module,exports){
module.exports = [{name: 'ESHR022-14 - Abordagens Tradicionais das Relações Internacionais (4-0-4)', page: '33'},
  {name: 'ESTA012-13 - Acionamentos Elétricos (3-2-4)', page: '33'},
  {name: 'ESZE002-13 - Acumuladores de Energia (2-0-5)', page: '34'},
  {name: 'ESZP041-14 - Administração Pública e Reforma do Estado em Perspectiva Comparada (4-0-4)', page: '35'},
  {name: 'ESZS020-13 - Aeroacústica (3-0-5)', page: '35'},
  {name: 'ESTS016-13 - Aerodinâmica I (4-0-5)', page: '36'},
  {name: 'ESZS019-13 - Aerodinâmica II (4-0-5)', page: '37'},
  {name: 'ESTS012-13 - Aeroelasticidade (4-0-5)', page: '37'},
  {name: 'ESTS002-13 - Aeronáutica I-A (4-0-4)', page: '38'},
  {name: 'ESZS001-13 - Aeronáutica I-B (4-0-4)', page: '39'},
  {name: 'ESZS002-13 - Aeronáutica II (5-1-6)', page: '39'},
  {name: 'MCTB001-13 - Álgebra Linear (6-0-5)', page: '39'},
  {name: 'MCTB002-13 - Álgebra Linear Avançada I (4-0-4)', page: '40'},
  {name: 'MCTB003-13 - Álgebra Linear Avançada II (4-0-4)', page: '40'},
  {name: 'MCTA001-13 - Algoritmos e Estruturas de Dados I (2-2-4)', page: '41'},
  {name: 'MCTA002-13 - Algoritmos e Estruturas de Dados II (2-2-4)', page: '41'},
  {name: 'MCZA035-14 - Algoritmos Probabilísticos (4-0-4)', page: '42'},
  {name: 'MCZB001-13 - Análise Complexa (4-0-4)', page: '43'},
  {name: 'ESHR001-13 - Análise da Conjuntura Internacional Contemporânea (4-0-4)', page: '43'},
  {name: 'ESZT001-13 - Análise da Produção do Espaço e Políticas Públicas Urbanas (4-0-4)', page: '44'},
  {name: 'MCTA003-13 - Análise de Algoritmos (4-0-4)', page: '45'},
  {name: 'MCZA036-14 - Análise de Algoritmos II (4-0-4)', page: '45'},
  {name: 'NHT3067-15 - Análise de Fourier e Aplicações (4-0-4)', page: '46'},
  {name: 'MCZA001-13 - Análise de Projetos (2-0-2)', page: '47'},
  {name: 'ESZG001-13 - Análise de Redes de Transporte e Distribuição (4-0-5)', page: '47'},
  {name: 'ESZE004-13 - Análise de Redes de Transporte e Distribuição de Energia (4-0-5)', page: '48'},
  {name: 'MCZB002-13 - Análise de Regressão (3-1-4)', page: '48'},
  {name: 'ESZC001-13 - Análise de Séries Temporais - Tópicos Especiais (4-0-3)', page: '49'},
  {name: 'ESTA005-13 - Análise de Sistemas Dinâmicos Lineares (3-0-4)', page: '49'},
  {name: 'ESTU001-13 - Análise de Sistemas e Modelagem Ambiental (0-2-4)', page: '50'},
  {name: 'ESTB014-13 - Análise e Controle de Sistemas Mecânicos (2-2-4)', page: '51'},
  {name: 'ESHC001-13 - Análise Econômica de Projetos (3-0-3)', page: '51'},
  {name: 'ESTE005-13 - Análise Econômica de Projetos Energéticos (3-1-4)', page: '52'},
  {name: 'ESZE012-13 - Análise Estática em Sistemas Elétricos de Potência (2-2-4)', page: '52'},

  {name: 'ESZS016-13 - Análise Experimental de Estruturas (1-3-3)', page: '53'},
  {name: 'MCZB003-13 - Análise Multivariada (4-0-4)', page: '54'},
  {name: 'MCTB004-13 - Análise no Rn I (4-0-4)', page: '54'},
  {name: 'MCZB004-13 - Análise no Rn II (4-0-4)', page: '55'},
  {name: 'MCZB005-13 - Análise Numérica (4-0-4)', page: '55'},
  {name: 'NHT4001-15 - Análise Química Instrumental (2-4-6)', page: '56'},
  {name: 'MCTB005-13 - Análise Real I (4-0-4)', page: ' 57'},
  {name: 'MCTB006-13 - Análise Real II (4-0-4)', page: '57'},
  {name: 'ESZP045-13 - Análise Social da Família e Implementação de Políticas Públicas (4-0-4)', page: '58'},
  {name: 'MCTB007-13 - Anéis e Corpos (4-0-4)', page: '59'},
  {name: 'NHZ2001-11 - Antropologia Filosófica (4-0-4)', page: '59'},
  {name: 'ESZS012-13 - Aplicações de Elementos Finitos para Engenharia (3-1-4)', page: '60'},
  {name: 'ESZI025-13 - Aplicações de Microcontroladores (0-4-4)', page: '60'},
  {name: 'ESZI021-13 - Aplicações Multimídia em Voz, Áudio e Acústica (3-1-4)', page: '61'},
  {name: 'MCZA002-13 - Aprendizado de Máquina (4-0-4)', page: '62'},
  {name: 'MCTA004-13 - Arquitetura de Computadores (4-0-4)', page: '62'},
  {name: 'MCZA003-13 - Arquitetura de Computadores de Alto Desempenho (4-0-4)', page: '63'},
  {name: 'ESHT001-13 - Arranjos Institucionais e Marco Regulatório do Território (2-0-2)', page: '63'},
  {name: 'ESZP011-13 - Arte, Ciência, Tecnologia e Política (4-0-4)', page: '64'},
  {name: 'NHZ1074-15 - Astrobiologia (4-0-6)', page: '65'},
  {name: 'MCZC010-15 - Atenção e Estados de Consciência (4-0-4)', page: '66'},
  {name: 'ESZP035-14 - Atores e Instituições no Regime Militar: 1964-1985 (4-0-4)', page: '66'},
  {name: 'ESZE010-13 - Automação de Sistemas Elétricos de Potência (3-0-4)', page: '67'},
  {name: 'ESTA011-13 - Automação de Sistemas Industriais (1-3-4)', page: '68'},
  {name: 'ESZG028-13 - Automação em Sistemas de Manufatura (2-2-4)', page: '69'},
  {name: 'MCZA004-13 - Avaliação de Desempenho de Redes (3-1-4)', page: '69'},
  {name: 'ESTU002-13 - Avaliação de Impactos Ambientais (4-0-3)', page: '70'},
  {name: '- Avaliação e Monitoramento de Políticas Públicas (2-2-4)', page: '71'},
  {name: 'NHT4072-15 - Avaliação no Ensino de Química (3-0-4)', page: '71'},
  {name: 'ESZS004-13 - Aviônica (4-0-4)', page: '72'},
  {name: 'MCTA005-13 - Banco de Dados (4-0-4)', page: '72'},
  {name: 'MCZA005-13 - Banco de Dados de Apoio à Tomada de Decisão (3-1-4)', page: '73'},
  {name: 'BCS0001-15 - Base Experimental das Ciências Naturais (0-3-2)', page: '74'},
  {name: 'ESTB002-13 - Bases Biológicas para Engenharia I (3-2-5)', page: '74'},
  {name: 'ESTB004-13 - Bases Biológicas para Engenharia II (3-2-5)', page: '75'},
  {name: 'BIS0005-15 - Bases Computacionais da Ciência (0-2-2)', page: '76'},
  {name: 'BIS0005-15 - Bases Computacionais da Ciência (0-2-2)', page: '76'},

  {name: 'BIJ0207-15 - Bases Conceituais da Energia (2-0-4)', page: '77'},
  {name: 'BIR0004-15 - Bases Epistemológicas da Ciência Moderna (3-0-4)', page: '78'},
  {name: 'BIS0003-15 - Bases Matemáticas (4-0-5)', page: '79'},
  {name: 'MCZC002-15 - Bases Neurais da Motricidade (4-0-4)', page: '80'},
  {name: 'NHZ4060-15 - Biocombustíveis e Biorrefinarias (4-0-4)', page: '80'},
  {name: 'BCL0306-15 - Biodiversidade: Interações entre organismos e ambiente (3-0-4)', page: '81'},
  {name: 'ESZB001-13 - Bioestatística (3-0-4)', page: '82'},
  {name: 'NHT1002-15 - Bioética (2-0-2)', page: '82'},
  {name: 'NHZ1003-15 - Biofísica (4-0-4)', page: '83'},
  {name: 'NHT1053-15 - Biologia Celular (4-2-4)', page: ' 83'},
  {name: 'NHZ1008-15 - Biologia do Desenvolvimento em Vertebrados (2-2-4)', page: '84'},
  {name: 'NHZ1009-15 - Biologia Molecular e Biotecnologia (3-0-3)', page: '85'},
  {name: 'NHZ1076-15 - Biologia Reprodutiva de Plantas (2-2-2)', page: '85'},
  {name: 'NHT1087-15 - Biologia Vegetal (3-3-3)', page: ' 86'},
  {name: 'ESTU023-13 - Biomas Brasileiros (2-1-3)', page: '87'},
  {name: 'ESZM032-13 - Biomateriais (3-1-4)', page: '88'},
  {name: 'NHZ1077-15 - Bioquímica Clínica (4-2-4)', page: '89'},
  {name: 'NHT4002-13 - Bioquímica Experimental (2-4-6)', page: '89'},
  {name: 'NHT1013-15 - Bioquímica Funcional (4-2-4)', page: '90'},
  {name: 'BCL0308-15 - Bioquímica: estrutura, propriedade e funções de biomoléculas (3-2-6)', page: '91'},
  {name: 'ESTB013-13 - Biossegurança (4-0-3)', page: '91'},
  {name: 'NHZ1078-15 - Biotecnologia de Plantas (0-4-2)', page: '92'},
  {name: 'ESZM015-13 - Blendas Poliméricas e Aditivação de Polímeros (4-0-4)', page: '93'},
  {name: 'NHZ1014-15 - Botânica Econômica (2-2-2)', page: '94'},
  {name: 'MCTB008-13 - Cálculo de Probabilidade (4-0-4)', page: '94'},
  {name: 'MCTB009-13 - Cálculo Numérico (4-0-4)', page: '95'},
  {name: 'MCTB010-13 - Cálculo Vetorial e Tensorial (4-0-4)', page: ' 95'},
  {name: 'ESZB002-13 - Caracterização de Biomateriais (2-3-4)', page: '96'},
  {name: 'ESTM014-13 - Caracterização de Materiais (2-2-4)', page: '97'},
  {name: 'ESTU003-13 - Caracterização de Matrizes Ambientais (0-2-4)', page: '97'},
  {name: 'ESTU004-13 - Cartografia e Geoprocessamento (1-3-3)', page: '98'},
  {name: 'ESHT002-13 - Cartografia e Geoprocessamento para o Planejamento Territorial (2-3-3)', page: '99'},
  {name: 'ESZE019-13 - Centrais Termoelétricas (2-0-4)', page: ' 100'},
  {name: 'ESZE023-13 - Centrais Termoelétricas e Cogeração (4-0-4)', page: '100'},
  {name: 'ESZM022-13 - Cerâmicas Especiais e Refratárias (4-0-4)', page: ' 101'},
  {name: 'NHZ2002-11 - Ceticismo (4-0-4)', page: '102'},
  {name: 'ESHP004-13 - Cidadania, Direitos e Desigualdades (4-0-4)', page: '103'},

  {name: 'ESZU001-13 - Cidades, Globalização e Projetos Urbanos (3-0-3)', page: '104'},
  {name: 'ESTM004-13 - Ciência dos Materiais (4-0-4)', page: '104'},
  {name: 'NHZ3001-09 - Ciência na Antiguidade e Período Medieval (4-0-4)', page: '105'},
  {name: 'ESZP012-13 - Ciência, Saúde, Educação e a Formação da Nacionalidade (4-0-4)', page: '107'},
  {name: 'BIR0603-15 - Ciência, Tecnologia e Sociedade (3-0-4)', page: '108'},
  {name: 'ESZU022-13 - Ciências Atmosféricas (4-0-4)', page: '110'},
  {name: 'ESTB005-13 - Ciências dos Materiais Biocompatíveis (3-1-4)', page: '110'},
  {name: 'ESZS009-13 - Cinemática e Dinâmica de Mecanismos (3-0-4)', page: '111'},
  {name: 'MCTA006-13 - Circuitos Digitais (3-1-4)', page: '112'},
  {name: 'ESTO001-13 - Circuitos Elétricos e Fotônica (3-1-5)', page: '112'},
  {name: 'ESTA002-13 - Circuitos Elétricos I (3-2-4)', page: '113'},
  {name: 'ESTA004-13 - Circuitos Elétricos II (3-2-4)', page: '114'},
  {name: 'ESZA008-13 - Circuitos Hidráulicos e Pneumáticos (3-1-4)', page: '115'},
  {name: 'NHZ1015-15 - Citogenética Básica (3-2-2)', page: '115'},
  {name: 'ESZG017-13 - Clima e Cultura Organizacional (2-0-3)', page: '115'},
  {name: 'ESZU024-13 - Clima Urbano (3-1-4)', page: ' 116'},
  {name: 'ESTU005-13 - Climatologia (3-0-4)', page: '117'},
  {name: 'MCZA037-14 - Combinatória Extremal (4-0-4)', page: '117'},
  {name: 'ESTS015-13 - Combustão I (3-1-4)', page: '118'},
  {name: 'ESZS024-13 - Combustão II (2-1-4)', page: '119'},
  {name: 'MCTA007-13 - Compiladores (3-1-4)', page: '119'},
  {name: 'ESZU002-13 - Compostagem (1-1-2)', page: '120'},
  {name: 'MCZA006-13 - Computação Evolutiva e Conexionista (4-0-4)', page: '121'},
  {name: 'MCTA008-13 - Computação Gráfica (3-1-4)', page: '122'},
  {name: 'MCTA009-13 - Computadores, Ética e Sociedade (2-0-4)', page: '122'},
  {name: 'ESTI007-13 - Comunicação Digital (3-1-4)', page: '123'},
  {name: 'BCM0506-15 - Comunicação e Redes (3-0-4)', page: '124'},
  {name: 'ESTI015-13 - Comunicações Móveis (3-1-4)', page: '125'},
  {name: 'ESTI012-13 - Comunicações Multimídia (2-2-4)', page: '126'},
  {name: 'ESTI010-13 - Comunicações Ópticas (3-1-4)', page: ' 127'},
  {name: 'MCZB006-13 - Conexões e Fibrados (4-0-4)', page: '127'},
  {name: 'ESZA007-13 - Confiabilidade de Componentes e Sistemas (3-0-4)', page: '128'},
  {name: 'ESZG002-13 - Confiabilidade Industrial em Sistemas de Gestão (2-2-4)', page: '128'},
  {name: 'ESZR001-13 - Conflitos no Ciberespaço: ativismo e guerra nas redes cibernéticas (4-0-4)', page: '129'},
  {name: 'ESHP005-13 - Conflitos Sociais (4-0-4)', page: '130'},
  {name: 'NHZ3001-15 - Conhecimento e Técnica: Perspectivas da Antiguidade e Período Medieval (4-0-4)', page: '131'},
  {name: 'ESZC002-13 - Conhecimento na Economia: Abordagens e Interfaces com as Atividades de CT&I (4-0-4)', page: '132'},

  {name: 'NHZ1016-15 - Conservação da Biodiversidade (4-0-4)', page: '133'},
  {name: 'ESHC002-13 - Contabilidade Básica (4-0-4)', page: '133'},
  {name: 'ESZG023-13 - Contabilidade para Engenharia (4-0-5)', page: '134'},
  {name: 'ESZU003-13 - Contaminação e Remediação de Solos (3-0-1)', page: '135'},
  {name: 'ESZA021-13 - Controle Avançado de Robôs (3-0-4)', page: '135'},
  {name: 'ESZA004-13 - Controle Discreto (3-1-4)', page: '136'},
  {name: 'ESZA003-13 - Controle Não-Linear (3-1-4)', page: '137'},
  {name: 'ESZA002-13 - Controle Robusto Multivariável (3-1-4)', page: '137'},
  {name: 'NHZ3082-15 - Cristalografia e Difração De Raios X (3-1-4)', page: '138'},
  {name: 'ESHP022-14 - Cultura Política (4-0-4)', page: '139'},
  {name: 'ESZR002-13 - Cultura, identidade e política na América Latina (4-0-4)', page: '139'},
  {name: 'ESTG001-13 - Custos (4-2-9)', page: '140'},
  {name: 'ESZR003-13 - De Mercosul , Unasul à Celac (4-0-4)', page: '140'},
  {name: 'ESHT003-13 - Demografia (4-0-4)', page: '141'},
  {name: 'ESZR004-13 - Desafios do Pré-Sal e a Inserção Internacional do Brasil (4-0-4)', page: '142'},
  {name: 'ESTS004-13 - Desempenho de Aeronaves (4-0-4)', page: '143'},
  {name: 'NHZ4004-15 - Desenho e Projeto em Química (3-0-4)', page: '144'},
  {name: 'ESZU004-13 - Desenho Técnico Aplicado ao Planejamento Urbano-Ambiental (0-2-2)', page: '145'},
  {name: 'NHI5001-15 - Desenvolvimento e Aprendizagem (4-0-4)', page: '146'},
  {name: 'MCZC003-15 - Desenvolvimento e Degeneração do Sistema Nervoso (4-0-4)', page: '147'},
  {name: 'BHO0102-15 - Desenvolvimento e Sustentabilidade (4-0-4)', page: '148'},
  {name: 'ESHT004-13 - Desenvolvimento Econômico e Social no Brasil (4-0-4)', page: '149'},
  {name: 'ESZT002-13 - Desenvolvimento Humano e Pobreza Urbana (4-0-4)', page: '149'},
  {name: 'ESTG002-13 - Desenvolvimento Integrado do Produto (2-2-5)', page: '150'},
  {name: 'ESHC003-13 - Desenvolvimento Sócio-Econômico (4-0-3)', page: '151'},
  {name: 'ESZM006-13 - Design de Dispositivos (3-1-4)', page: '151'},
  {name: 'ESZP001-13 - Desigualdades Regionais e Formação Socioespacial do Brasil (4-0-4)', page: '152'},
  {name: 'ESZM009-13 - Diagramas de Fase (4-0-4)', page: '153'},
  {name: 'NHI5002-15 - Didática (4-0-4)', page: '154'},
  {name: 'ESZS027-13 - Dinâmica de Fluidos Computacional (3-0-4)', page: '154'},
  {name: 'ESZR005-13 - Dinâmica dos Investimentos Produtivos Internacionais (4-0-4)', page: '155'},
  {name: 'ESTS005-13 - Dinâmica e Controle de Veículos Espaciais (4-0-4)', page: '156'},
  {name: 'ESZR006-13 - Dinâmica e desafios dos processos migratórios (4-0-4)', page: ' 157'},
  {name: 'ESTS001-13 - Dinâmica I (4-0-5)', page: '157'},
  {name: 'ESZS006-13 - Dinâmica II (4-0-4)', page: '158'},
  {name: 'ESZM008-13 - Dinâmica Molecular e Monte Carlo (3-1-4)', page: '159'},
  {name: 'NHZ3002-15 - Dinâmica Não Linear e Caos (4-0-4)', page: '159'},

  {name: 'ESZS007-13 - Dinâmica Orbital (3-0-4)', page: '160'},
  {name: 'ESZP013-13 - Dinâmicas Socioespaciais do ABC Paulista (4-0-4)', page: '161'},
  {name: 'ESHR002-13 - Direito Internacional Público (4-0-4)', page: '161'},
  {name: 'ESTA001-13 - Dispositivos Eletrônicos (3-2-4)', page: '162'},
  {name: 'ESZP014-13 - Diversidade Cultural, Conhecimento Local e Políticas Públicas (4-0-4)', page: '163'},
  {name: 'NHT1072-15 - Ecologia Comportamental (2-2-4)', page: '164'},
  {name: 'ESZU005-13 - Ecologia do Ambiente Antropizado (2-0-4)', page: '165'},
  {name: 'NHT1073-15 - Ecologia Vegetal (2-2-4)', page: '165'},
  {name: 'ESHC004-13 - Econometria I (4-0-4)', page: '166'},
  {name: 'ESHC005-13 - Econometria II (4-0-3)', page: '167'},
  {name: 'ESHC006-13 - Econometria III (4-0-3)', page: '167'},
  {name: 'ESZX001-13 - Economia Brasileira (3-0-3)', page: '168'},
  {name: 'ESHC007-13 - Economia Brasileira Contemporânea I (4-0-3)', page: '169'},
  {name: 'ESHC008-13 - Economia Brasileira Contemporânea II (4-0-3)', page: '169'},
  {name: 'ESHC009-13 - Economia Brasileira Contemporânea III (3-0-4)', page: '170'},
  {name: 'ESTE003-13 - Economia da Energia (2-0-4)', page: '171'},
  {name: 'ESZP015-13 - Economia da Inovação Tecnológica (4-0-4)', page: '171'},
  {name: 'ESTG003-13 - Economia de Empresas (2-0-3)', page: '172'},
  {name: 'ESZE046-13 - Economia de Reatores Nucleares (3-0-3)', page: '173'},
  {name: 'ESZE057-13 - Economia do Petróleo e do Gás Natural (4-0-4)', page: '173'},
  {name: 'ESZC003-13 - Economia do Setor Público (4-0-4)', page: '174'},
  {name: 'ESHT005-13 - Economia do Território (4-0-3)', page: '175'},
  {name: 'ESZC004-13 - Economia do Trabalho (4-0-3)', page: '175'},
  {name: 'ESZC005-13 - Economia e Instituições no Brasil Contemporâneo (4-0-3)', page: '176'},
  {name: 'ESHC010-13 - Economia e Meio Ambiente (3-0-3)', page: '176'},
  {name: 'ESHC011-13 - Economia Industrial (4-0-3)', page: '177'},
  {name: 'ESHC012-13 - Economia Institucional I (4-0-3)', page: '178'},
  {name: 'ESZC006-13 - Economia Institucional II (4-0-3)', page: '178'},
  {name: 'ESHC013-13 - Economia Internacional I (4-0-4)', page: '179'},
  {name: 'ESHC014-13 - Economia Internacional II (4-0-3)', page: '180'},
  {name: 'ESHC015-13 - Economia Monetária (3-0-3)', page: '180'},
  {name: 'ESHR003-13 - Economia Política da Segurança Alimentar Global (4-0-4)', page: '181'},
  {name: 'ESHR004-13 - Economia Política Internacional da Energia (4-0-4)', page: '182'},
  {name: 'ESZC007-13 - Economia Regional e Sociedade (4-0-4)', page: '183'},
  {name: 'ESZP046-14 - Economia Solidária, Associativismo e Cooperativismo (4-0-4)', page: '183'},
  {name: 'ESHT006-13 - Economia Urbana (4-0-4)', page: '185'},
  {name: 'ESZU006-13 - Economia, Sociedade e Meio Ambiente (3-0-4)', page: '186'},

  {name: 'ESZU025-13 - Educação Ambiental (2-2-4)', page: '186'},
  {name: 'NHT5004-15 - Educação Científica, Sociedade e Cultura (4-0-4)', page: '187'},
  {name: 'NHZ5021-15 - Educação em Saúde e Sexualidade (3-0-3)', page: '188'},
  {name: 'NHZ5020-15 - Educação Inclusiva (2-0-2)', page: '189'},
  {name: 'NHZ3003-15 - Efeitos Biológicos das Radiações (4-0-4)', page: '190'},
  {name: 'ESTG004-13 - Elaboração, Análise e Avaliação de Projetos (3-1-5)', page: '190'},
  {name: 'MCZB007-13 - Elementos Finitos (4-0-4)', page: '191'},
  {name: 'ESZM007-13 - Elementos Finitos Aplicados em Materiais (3-1-4)', page: '191'},
  {name: 'ESZE049-13 - Eletrificação Rural com Recursos Energéticos Renováveis (2-0-4)', page: '193'},
  {name: 'NHT4005-15 - Eletroanalítica e Técnicas de Separação (2-4-8)', page: ' 193'},
  {name: 'NHT3070-15 - Eletromagnetismo I (4-0-4)', page: '194'},
  {name: 'NHT3071-15 - Eletromagnetismo II (4-0-4)', page: '195'},
  {name: 'NHZ3076-15 - Eletromagnetismo III (4-0-4)', page: '196'},
  {name: 'ESTA007-13 - Eletrônica Analógica Aplicada (3-2-4)', page: '197'},
  {name: 'ESZA011-13 - Eletrônica de Potência I (3-2-4)', page: '197'},
  {name: 'ESZA012-13 - Eletrônica de Potência II (3-2-4)', page: '198'},
  {name: 'ESTI002-13 - Eletrônica Digital (4-2-4)', page: '198'},
  {name: 'NHT4006-15 - Eletroquímica e Cinética Química (6-0-6)', page: '199'},
  {name: 'ESZG013-13 - Empreendedorismo (2-2-2)', page: ' 200'},
  {name: 'MCZA007-13 - Empreendedorismo e Desenvolvimento de Negócios (4-0-4)', page: '200'},
  {name: 'ESZE053-13 - Energia de Sistemas Solares Térmicos (2-0-4)', page: '201'},
  {name: 'ESZE0105-15 - Energia dos Oceanos (2-0-2)', page: '202'},
  {name: 'ESZT003-13 - Energia e Abastecimento (4-0-4)', page: '202'},
  {name: 'NHZ5005-09 - Energia e Meio Ambiente (2-1-3)', page: '203'},
  {name: 'ESZR007-13 - Energia nuclear e Relações Internacionais (4-0-4)', page: '204'},
  {name: 'ESTE004-13 - Energia, Meio Ambiente e Sociedade (4-0-5)', page: '204'},
  {name: 'ESZE001-13 - Energia: Fontes e Tecnologias de Conversão (3-1-4)', page: '205'},
  {name: 'ESZB018-13 - Engenharia Clínica I (3-2-4)', page: '206'},
  {name: 'ESZB019-13 - Engenharia Clínica II (3-2-4)', page: '206'},
  {name: 'ESZE033-13 - Engenharia de Biocombustíveis I (4-0-4)', page: '207'},
  {name: 'ESZE034-13 - Engenharia de Biocombustíveis II (4-0-4)', page: '208'},
  {name: 'ESZM019-13 - Engenharia de Cerâmicas (3-1-4)', page: '209'},
  {name: 'ESZE111-15 - Engenharia de Combustíveis Fósseis (4-0-4)', page: '209'},
  {name: 'ESZE058-13 - Engenharia de Completação (4-0-4)', page: ' 210'},
  {name: 'ESZM029-13 - Engenharia de Filmes Finos (3-1-4)', page: ' 210'},
  {name: 'ESZM024-13 - Engenharia de Metais (3-1-4)', page: '211'},
  {name: 'ESZE059-13 - Engenharia de Perfuração (4-0-4)', page: '212'},

  {name: 'ESZM014-13 - Engenharia de Polímeros (4-0-4)', page: '213'},
  {name: 'ESTB011-13 - Engenharia de Reabilitação e Biofeedback (3-1-4)', page: '213'},
  {name: 'ESZE112-15 - Engenharia de Recursos Hídricos (4-0-4)', page: '214'},
  {name: 'ESZE060-13 - Engenharia de Reservatórios I (4-0-4)', page: ' 214'},
  {name: 'ESZE061-13 - Engenharia de Reservatórios II (4-0-4)', page: '215'},
  {name: 'ESZI026-13 - Engenharia de Sistemas de Comunicação e Missão Crítica (2-2-4)', page: '216'},
  {name: 'ESZE051-13 - Engenharia de Sistemas Eólicos (2-2-4)', page: '217'},
  {name: 'ESZE050-13 - Engenharia de Sistemas Fotovoltaicos (2-2-4)', page: '217'},
  {name: 'MCTA010-13 - Engenharia de Software (4-0-4)', page: '218'},
  {name: 'ESZB006-13 - Engenharia de Tecidos (3-2-4)', page: '219'},
  {name: 'ESTO002-13 - Engenharia Econômica (2-1-3)', page: '220'},
  {name: 'ESTG005-13 - Engenharia Econômica Aplicada a Sistemas de Gestão (4-0-5)', page: '220'},
  {name: 'ESZG031-13 - Engenharia Humana (4-0-5)', page: '221'},
  {name: 'ESTG006-13 - Engenharia Laboral (4-0-4)', page: '221'},
  {name: 'ESTG007-13 - Engenharia Logística (2-2-4)', page: '222'},
  {name: 'ESZA018-13 - Engenharia Óptica e Imagens (3-1-4)', page: '222'},
  {name: 'ESZE113-15 - Engenharia Solar Térmica (4-0-4)', page: '223'},
  {name: 'ESZE047-13 - Engenharia Unificada (Engenharia Nuclear) (1-2-5)', page: '224'},
  {name: 'ESTO900-13 - Engenharia Unificada I (0-3-5)', page: '225'},
  {name: 'ESTO901-13 - Engenharia Unificada II (0-3-5)', page: '225'},
  {name: 'NHT1088-15 - Ensino de Morfofisiologia Humana (4-0-4)', page: '226'},
  {name: 'ESZP018-13 - Ensino Superior no Brasil: Trajetórias e Modelos Institucionais (4-0-4)', page: '227'},
  {name: 'MCTB011-13 - Equações Diferenciais Ordinárias (4-0-4)', page: '228'},
  {name: 'MCTB012-13 - Equações Diferenciais Parciais (4-0-4)', page: '228'},
  {name: 'NHZ3078-15 - Equações Diferenciais Parciais Aplicadas (4-0-4)', page: '229'},
  {name: 'ESTB012-13 - Equipamentos Médico-Hospitalares (3-2-4)', page: '230'},
  {name: 'ESZB013-13 - Ergonomia (4-0-4)', page: '230'},
  {name: 'MCZC007-15 - Ergonomia Cognitiva (4-0-4)', page: '231'},
  {name: 'ESZE062-13 - Escoamento Multifásico de Petróleo (4-0-4)', page: '232'},
  {name: 'NHT4007-15 - Espectroscopia (4-2-6)', page: '232'},
  {name: 'ESTS007-13 - Estabilidade e Controle de Aeronaves (4-0-4)', page: '233'},
  {name: 'ESHR005-13 - Estado e Desenvolvimento Econômico no Brasil Contemporâneo (4-0-4)', page: '234'},
  {name: 'BHO0101-15 - Estado e Relações De Poder (4-0-4)', page: '235'},
  {name: 'ESTM001-13 - Estado Sólido (4-0-4)', page: '235'},
  {name: 'ESTS900-13 - Estágio Curricular I em Engenharia Aeroespacial (0-7-0)', page: '236'},
  {name: 'ESTU900-13 - Estágio Curricular I em Engenharia Ambiental e Urbana (0-7-0)', page: '236'},
  {name: 'ESTB900-13 - Estágio Curricular I em Engenharia Biomédica (0-7-0)', page: '237'},

  {name: 'ESTE900-13 - Estágio Curricular I em Engenharia de Energia (0-7-0)', page: '237'},
  {name: 'ESTG900-13 - Estágio Curricular I em Engenharia de Gestão (0-7-0)', page: '238'},
  {name: 'ESTI900-13 - Estágio Curricular I em Engenharia de Informação (0-7-0)', page: '238'},
  {name: 'ESTA900-13 - Estágio Curricular I em Engenharia de Instrumentação, Automação e Robótica (0-7-0)', page: '238'},
  {name: 'ESTM900-13 - Estágio Curricular I em Engenharia de Materiais (0-7-0)', page: '239'},
  {name: 'ESTS901-13 - Estágio Curricular II em Engenharia Aeroespacial (0-7-0)', page: '239'},
  {name: 'ESTU901-13 - Estágio Curricular II em Engenharia Ambiental e Urbana (0-7-0)', page: '240'},
  {name: 'ESTB901-13 - Estágio Curricular II em Engenharia Biomédica (0-7-0)', page: ' 240'},
  {name: 'ESTE901-13 - Estágio Curricular II em Engenharia de Energia (0-7-0)', page: '240'},
  {name: 'ESTG901-13 - Estágio Curricular II em Engenharia de Gestão (0-7-0)', page: '241'},
  {name: 'ESTI901-13 - Estágio Curricular II em Engenharia de Informação (0-7-0)', page: '241'},
  {name: 'ESTA901-13 - Estágio Curricular II em Engenharia de Instrumentação, Automação e Robótica (0-7-0)', page: '242'},
  {name: 'ESTM901-13 - Estágio Curricular II em Engenharia de Materiais (0-7-0)', page: '242'},
  {name: 'MCTAO11-13 - Estágio Supervisionado em Computação I (8-0-8)', page: '242'},
  {name: 'MCTAO12-13 - Estágio Supervisionado em Computação II (8-0-8)', page: '243'},
  {name: 'MCTAO13-13 - Estágio Supervisionado em Computação III (8-0-8)', page: '243'},
  {name: 'NHH2003-13 - Estágio Supervisionado em Filosofia I (2-6-4)', page: '244'},
  {name: 'NHH2004-13 - Estágio Supervisionado em Filosofia II (2-6-4)', page: ' 244'},
  {name: 'NHH2081-13 - Estágio Supervisionado em Filosofia III (2-4-4)', page: '244'},
  {name: 'NHH2005-13 - Estágio Supervisionado em Filosofia IV (2-4-4)', page: '245'},
  {name: 'NHH2006-13 - Estágio Supervisionado em Filosofia V (2-4-4)', page: '245'},
  {name: 'MCTD001-13 - Estágio Supervisionado em Matemática I (Nível Médio) (0-7-0)', page: '245'},
  {name: 'MCTD002-13 - Estágio Supervisionado em Matemática II (Nível Médio) (0-7-0)', page: '246'},
  {name: 'MCTD003-13 - Estágio Supervisionado em Matemática III (Nível Médio) (0-7-0)', page: '246'},
  {name: 'MCTC015-13 - Estágio Supervisionado em Neurociência I (0-10-2)', page: '247'},
  {name: 'MCTC016-13 - Estágio Supervisionado em Neurociência II (0-10-2)', page: '247'},
  {name: 'MCTC017-13 - Estágio Supervisionado em Neurociência III (0-10-2)', page: '247'},
  {name: 'ESTG011-13 - Estatística Aplicada a Sistemas de Gestão (2-2-4)', page: '247'},
  {name: 'NHH2007-13 - Estética (4-0-4)', page: '248'},
  {name: 'NHH2008-13 - Estética: Perspectivas Contemporâneas (4-0-4)', page: '250'},
  {name: 'ESZG018-13 - Estratégias de Comunicação Organizacional (4-0-5)', page: ' 252'},
  {name: 'NHZ3007-15 - Estrutura Atômica e Molecular (4-0-4)', page: '252'},
  {name: 'BIK0102-15 - Estrutura da Matéria (3-0-4)', page: '253'},
  {name: 'NHT4049-15 - Estrutura da Matéria Avançada (2-4-8)', page: '254'},
  {name: 'BIQ0602-15 - Estrutura e Dinâmica Social (3-0-4)', page: '255'},
  {name: 'ESHT007-13 - Estudos do Meio Físico (4-0-4)', page: '255'},
  {name: 'BHQ0002-15 - Estudos Étnico-Raciais (3-0-4)', page: '256'},

  {name: 'NHH2009-13 - Ética (4-0-4)', page: '257'},
  {name: 'BHP0001-15 - Ética e Justiça (4-0-4)', page: '258'},
  {name: 'NHH2010-13 - Ética: Perspectivas Contemporâneas (4-0-4)', page: '259'},
  {name: 'NHZ1024-15 - Etnofarmacologia (2-1-2)', page: '261'},
  {name: 'NHT1062-15 - Evolução (4-0-4)', page: '261'},
  {name: 'NHZ3008-15 - Evolução da Física (4-0-4)', page: '262'},
  {name: 'MCTB013-13 - Evolução dos Conceitos Matemáticos (4-0-4)', page: '263'},
  {name: 'NHT1067-15 - Evolução e Diversidade de Plantas I (2-2-2)', page: '263'},
  {name: 'NHT1068-15 - Evolução e Diversidade de Plantas II (2-4-4)', page: '264'},
  {name: 'BIL0304-15 - Evolução e Diversificação da Vida na Terra (3-0-4)', page: '265'},
  {name: 'NHZ1026-15 - Evolução Molecular (3-0-3)', page: '266'},
  {name: 'NHZ2011-11 - Existencialismo (4-0-4)', page: '266'},
  {name: 'NHT4015-15 - Experimentação e Ensino de Química (0-3-4)', page: '267'},
  {name: 'MCTB014-13 - Extensões Algébricas (4-0-4)', page: '267'},
  {name: 'NHZ1027-15 - Farmacologia (4-2-4)', page: '268'},
  {name: 'ESHP007-13 - Federalismo e Políticas Públicas (4-0-4)', page: '268'},
  {name: 'NHH2012-13 - Fenomenologia e Filosofia Hermenêutica (4-0-4)', page: '269'},
  {name: 'ESZO001-15 - Fenômenos de Transporte (4-0-4)', page: '270'},
  {name: 'BCJ0203-15 - Fenômenos Eletromagnéticos (4-1-6)', page: '271'},
  {name: 'BCJ0204-15 - Fenômenos Mecânicos (4-1-6)', page: '271'},
  {name: 'BCJ0205-15 - Fenômenos Térmicos (3-1-4)', page: '272'},
  {name: 'NHZ4068-15 - Fermentação Industrial (2-2-2)', page: '273'},
  {name: 'NHZ2013-11 - Filosofia Brasileira: História e Problemas (4-0-4)', page: '273'},
  {name: 'NHZ2014-11 - Filosofia da Ciência Pós-kuhniana (4-0-4)', page: '274'},
  {name: 'NHH2015-13 - Filosofia da Ciência: em torno à concepção ortodoxa (4-0-4)', page: '275'},
  {name: 'NHH2016-13 - Filosofia da Ciência: o debate Popper-Kuhn e seus desdobramentos (4-0-4)', page: '276'},
  {name: 'NHH2017-13 - Filosofia da Educação (4-0-4)', page: '277'},
  {name: 'NHZ2018-11 - Filosofia da Educação: perspectivas contemporâneas (4-0-4)', page: '278'},
  {name: 'NHH2019-13 - Filosofia da Linguagem (4-0-4)', page: '278'},
  {name: 'NHH2020-13 - Filosofia da Lógica (4-0-4)', page: '280'},
  {name: 'NHZ2021-11 - Filosofia da Mente (4-0-4)', page: '281'},
  {name: 'NHZ2022-11 - Filosofia da Natureza, Mecanicismo e Cosmologia (4-0-4)', page: '282'},
  {name: 'NHH2023-13 - Filosofia do Ensino de Filosofia (4-0-4)', page: '283'},
  {name: 'NHZ2024-11 - Filosofia Experimental e Mecanicismo (4-0-4)', page: '284'},
  {name: 'NHZ2025-11 - Filosofia Latino-Americana: História e Problemas (4-0-4)', page: '284'},
  {name: 'NHH2026-13 - Filosofia no Brasil e na América Latina (4-0-4)', page: '285'},
  {name: 'NHZ2027-11 - Filosofia no Ensino Fundamental (4-0-4)', page: '286'},

  {name: 'NHH2028-13 - Filosofia Política (4-0-4)', page: '287'},
  {name: 'NHH2029-13 - Filosofia Política: perspectivas contemporâneas (4-0-4)', page: '289'},
  {name: 'ESZI002-13 - Filtragem Adaptativa (3-1-4)', page: '291'},
  {name: 'ESHC016-13 - Finanças Corporativas (4-0-4)', page: '292'},
  {name: 'ESZC008-13 - Finanças I (Apreçamento de Ativos) (4-0-3)', page: '293'},
  {name: 'ESZC009-13 - Finanças II (Apreçamento de Ativos) (4-0-3)', page: '293'},
  {name: 'ESHC017-13 - Finanças Públicas (4-0-4)', page: '294'},
  {name: 'ESZG025-13 - Finanças, Gestão e Administração Financeira (4-0-5)', page: ' 295'},
  {name: 'NHZ3010-15 - Física Computacional (3-1-4)', page: '295'},
  {name: 'ESZE040-13 - Física de Reatores Nucleares I (3-0-5)', page: '296'},
  {name: 'ESZE041-13 - Física de Reatores Nucleares II (3-0-5)', page: '297'},
  {name: 'NHZ3011-15 - Física de Semicondutores (3-1-4)', page: '297'},
  {name: 'NHT3012-15 - Física do Contínuo (3-1-4)', page: '298'},
  {name: 'NHZ3084-15 - Física do Meio Ambiente (4-0-4)', page: '299'},
  {name: 'NHT3064-15 - Física Ondulatória (3-1-4)', page: '299'},
  {name: 'BCK0103-15 - Física Quântica (3-0-4)', page: '300'},
  {name: 'NHT3013-13 - Física Térmica (4-0-4)', page: '301'},
  {name: 'NHT4075-15 - Físico-Química Experimental (0-4-6)', page: '301'},
  {name: 'NHT1069-15 - Fisiologia Vegetal I (4-2-3)', page: '302'},
  {name: 'NHT1070-15 - Fisiologia Vegetal II (2-2-2)', page: '303'},
  {name: 'NHZ3014-15 - Fluidos Quânticos (4-0-4)', page: '303'},
  {name: 'ESTE002-13 - Fontes Não-Renováveis de Energia (4-0-4)', page: '304'},
  {name: 'ESTE001-13 - Fontes Renováveis de Energia (4-0-4)', page: '305'},
  {name: 'BHO1335-15 - Formação do Sistema Internacional (4-0-4)', page: '305'},
  {name: 'ESHC018-13 - Formação Econômica do Brasil (4-0-4)', page: '306'},
  {name: 'ESHR006-13 - Formação Histórica da America Latina (4-0-4)', page: '307'},
  {name: 'ESHP023-14 - Formação Histórica do Brasil Contemporâneo (4-0-4)', page: '308'},
  {name: 'MCZB008-13 - Formas Diferenciais (4-0-4)', page: '308'},
  {name: 'ESTA006-13 - Fotônica (3-1-4)', page: '309'},
  {name: 'BCN0402-15 - Funções de uma Variável (4-0-6)', page: '309'},
  {name: 'BCN0407-15 - Funções de Várias Variáveis (4-0-4)', page: '310'},
  {name: 'MCTB015-13 - Funções de Variáveis Complexas (6-0-5)', page: '311'},
  {name: 'NHT4017-15 - Funções e Reações Orgânicas (4-0-6)', page: '311'},
  {name: 'NHZ2030-11 - Fundamentos da Lógica Modal (4-0-4)', page: '312'},
  {name: 'NHZ3019-15 - Fundamentos da Mecânica dos Fluidos (4-0-4)', page: '313'},
  {name: 'NHZ3020-15 - Fundamentos da Relatividade Geral (4-0-4)', page: '313'},
  {name: 'MCTD005-13 - Fundamentos de Álgebra (4-0-4)', page: '314'},

  {name: 'MCTD006-13 - Fundamentos de Análise (4-0-4)', page: '314'},
  {name: 'ESZE067-14 - Fundamentos de Conversão de Energia Elétrica (4-0-4)', page: '315'},
  {name: 'ESTO003-13 - Fundamentos de Desenho e Projeto (1-3-4)', page: '316'},
  {name: 'ESZU007-13 - Fundamentos de Economia e Sociologia Urbana (3-0-3)', page: ' 316'},
  {name: 'ESTU022-13 - Fundamentos de Geologia para Engenharia (3-1-3)', page: '317'},
  {name: 'MCTD007-13 - Fundamentos de Geometria (4-0-4)', page: '318'},
  {name: 'NHT1055-15 - Fundamentos de Imunologia (2-2-4)', page: '319'},
  {name: 'ESTE006-13 - Fundamentos de Máquinas Elétricas (2-2-5)', page: '320'},
  {name: 'ESZE071-14 - Fundamentos de Máquinas Térmicas (2-0-4)', page: '320'},
  {name: 'ESZI017-13 - Fundamentos de Processamento Gráfico (3-1-4)', page: '321'},
  {name: 'ESTA013-13 - Fundamentos de Robótica (3-1-4)', page: '322'},
  {name: 'ESZE068-14 - Fundamentos de Sistemas Dinâmicos (4-0-4)', page: '322'},
  {name: 'NHT1061-15 - Genética I (4-2-4)', page: '323'},
  {name: 'NHT1057-15 - Genética II (2-2-4)', page: '323'},
  {name: 'ESHR007-14 - Geografia Política (4-0-4)', page: '324'},
  {name: 'NHT1030-15 - Geologia e Paleontologia (2-2-4)', page: '325'},
  {name: 'BCN0404-15 - Geometria Analítica (3-0-6)', page: '325'},
  {name: 'MCTB016-13 - Geometria Diferencial I (4-0-4)', page: '326'},
  {name: 'MCTB017-13 - Geometria Diferencial II (4-0-4)', page: '326'},
  {name: 'MCZB009-13 - Geometria não Euclidiana (4-0-4)', page: '327'},
  {name: 'MCTD009-13 - Geometria Plana e Construções Geométricas (4-0-4)', page: '328'},
  {name: 'ESZU008-13 - Geomorfologia Descritiva (2-2-3)', page: '328'},
  {name: 'ESTU006-13 - Geotecnia (2-2-4)', page: '329'},
  {name: 'ESZU009-13 - Geotecnia Aplicada ao Planejamento Urbano-Ambiental (3-0-3)', page: '330'},
  {name: 'ESZE052-13 - Geração Distribuída (2-0-3)', page: '330'},
  {name: 'ESZE021-13 - Geração e Distribuição de Vapor (3-1-4)', page: '331'},
  {name: 'ESTG008-13 - Gerência de Ativos (2-0-3)', page: '332'},
  {name: 'ESZI007-13 - Gerenciamento e Interoperabilidade de Redes (3-1-4)', page: '332'},
  {name: 'ESZU010-13 - Gestão Ambiental na Indústria (3-0-3)', page: '333'},
  {name: 'ESZG014-13 - Gestão da Inovação (4-0-4)', page: '334'},
  {name: 'ESZG009-13 - Gestão da Qualidade, Segurança, Saúde e Ambiental Aplicada em Projetos (2-0-4)', page: '334'},
  {name: 'ESZG024-13 - Gestão de Custos Avançada (4-0-5)', page: '335'},
  {name: 'ESTG009-13 - Gestão de Operações (4-0-5)', page: '336'},
  {name: 'ESZP022-13 - Gestão de Projetos Culturais (4-0-4)', page: '336'},
  {name: 'MCZA016-15 - Gestão de Projetos de Software (4-0-4)', page: '337'},
  {name: 'ESZG026-13 - Gestão de Riscos em Sistemas de Gestão (4-0-5)', page: '338'},
  {name: 'ESZG019-13 - Gestão Estratégica e Organizacional (2-0-2)', page: '339'},

  {name: 'ESZU011-13 - Gestão Urbano-Ambiental (3-1-4)', page: '339'},
  {name: 'ESHR008-13 - Globalização e os processos de Integração Regional (4-0-4)', page: '340'},
  {name: 'ESHT008-13 - Governança Pública, Democracia e Políticas no Território (4-0-4)', page: '341'},
  {name: 'ESHP009-13 - Governo, Burocracia e Administração Pública (4-0-4)', page: '342'},
  {name: 'MCZB010-13 - Grupo Fundamental e Espaço de Recobrimento (4-0-4)', page: '343'},
  {name: 'MCTB018-13 - Grupos (4-0-4)', page: '343'},
  {name: 'MCZB011-13 - Grupos de Lie e Simetrias (4-0-4)', page: '344'},
  {name: 'ESTU007-13 - Habitação e Assentamentos Humanos (3-1-5)', page: '344'},
  {name: 'ESZT004-13 - Habitação e Assentamentos Precários (4-0-4)', page: '345'},
  {name: 'ESTU008-13 - Hidráulica (2-2-4)', page: '346'},
  {name: 'ESZE048-13 - Hidrogênio e Células a Combustível (4-0-4)', page: ' 347'},
  {name: 'ESTU009-13 - Hidrologia (3-1-3)', page: '347'},
  {name: 'NHT1054-15 - Histologia e Embriologia (4-2-4)', page: '348'},
  {name: 'NHZ2031-11 - História da Astronomia (4-0-4)', page: '349'},
  {name: 'ESHT009-13 - História da Cidade e do Urbanismo (4-0-4)', page: '349'},
  {name: 'NHZ5016-15 - História da Educação (4-0-4)', page: '350'},
  {name: 'NHH2032-13 - História da Filosofia Antiga: Aristóteles e o Aristotelismo (4-0-4)', page: '351'},
  {name: 'NHH2033-13 - História da Filosofia Antiga: Platão e o Platonismo (4-0-4)', page: '352'},
  {name: 'NHH2034-13 - História da Filosofia Contemporânea: o século XIX (4-0-4)', page: '353'},
  {name: 'NHH2035-13 - História da Filosofia Contemporânea: o Século XX (4-0-4)', page: '355'},
  {name: 'NHZ2036-11 - História da Filosofia da Antiguidade Tardia (4-0-4)', page: '356'},
  {name: 'NHZ2037-11 - História da Filosofia Medieval: Escolas Franciscanas e Nominalismo (4-0-4)', page: '357'},
  {name: 'NHH2038-13 - História da Filosofia Medieval: Patrística e Escolástica (4-0-4)', page: ' 358'},
  {name: 'NHZ2039-11 - História da Filosofia Moderna: o Idealismo alemão (4-0-4)', page: '360'},
  {name: 'NHH2040-13 - História da Filosofia Moderna: o Iluminismo e seus desdobramentos (4-0-4)', page: '361'},
  {name: 'NHH2041-13 - História da Filosofia Moderna: perspectivas racionalistas (4-0-4)', page: '362'},
  {name: 'NHZ2042-11 - História da Linguagem (4-0-4)', page: '364'},
  {name: 'MCTD010-13 - História da Matemática (4-0-4)', page: '365'},
  {name: 'ESHR024-14 - História da Política Externa Brasileira (4-0-4)', page: '365'},
  {name: 'NHZ2043-11 - História da Sociedade Contemporânea (4-0-4)', page: '366'},
  {name: 'NHZ2044-11 - História das Ciências no Brasil (4-0-4)', page: '366'},
  {name: 'NHZ1031-15 - História das Idéias Biológicas (2-0-4)', page: '367'},
  {name: 'ESZR008-13 - História de atuação do Brasil nos processos de integração sul-americana (4-0-4)', page: '368'},
  {name: 'ESHC019-13 - História do Pensamento Econômico (4-0-4)', page: '369'},
  {name: 'ESHR026-14 - História do Terceiro Mundo (4-0-4)', page: '370'},
  {name: 'ESZU012-13 - História do Urbanismo (2-0-4)', page: '370'},
  {name: 'NHZ2045-11 - História e Filosofia da Ciência (4-0-4)', page: '371'},

  {name: 'NHZ5017-15 - História e Filosofia das Ciências e o Ensino de Ciências (4-0-2)', page: '372'},
  {name: 'ESHC020-13 - História Econômica Geral (4-0-4)', page: '373'},
  {name: 'NHZ2046-11 - História Social da Tecnologia na América Latina (4-0-4)', page: '374'},
  {name: 'NHH2047-13 - Historiografia e História das Ciências (4-0-4)', page: '375'},
  {name: 'BHQ0001-15 - Identidade e Cultura (3-0-4)', page: '375'},
  {name: 'ESZE063-13 - Impacto Ambiental e Social na Cadeia de Produção de Petróleo (4-0-4)', page: '376'},
  {name: 'NHZ1090-15 - Imunologia Aplicada (4-0-5)', page: '377'},
  {name: 'ESZP042-14 - Indicadores de Políticas Públicas (0-4-6)', page: '378'},
  {name: 'NHZ4059-15 - Indústria de Polímeros (4-0-4)', page: '378'},
  {name: 'MCZB012-13 - Inferência Estatística (4-0-4)', page: '379'},
  {name: 'ESZI001-13 - Informação e Sociedade (2-0-3)', page: '380'},
  {name: 'ESZT005-13 - Informática Aplicada ao Planejamento Territorial (1-3-4)', page: '380'},
  {name: 'ESZI013-13 - Informática Industrial (0-4-4)', page: '381'},
  {name: 'ESZP023-13 - Inovação e Desenvolvimento Agroindustrial (4-0-4)', page: '381'},
  {name: 'ESZP043-14 - Inovação nos Serviços Públicos (4-0-4)', page: '382'},
  {name: 'ESTG010-13 - Inovação Tecnológica (2-2-2)', page: '383'},
  {name: 'ESTE008-13 - Instalações Elétricas I (2-2-4)', page: '384'},
  {name: 'ESZE011-13 - Instalações Elétricas II (2-2-4)', page: '384'},
  {name: 'ESZB020-13 - Instalações Hospitalares (2-2-4)', page: '385'},
  {name: 'ESZC010-13 - Instituições e Governança Global (4-0-3)', page: '385'},
  {name: 'ESZP002-13 - Instituições Judiciais e Políticas Públicas (4-0-4)', page: '386'},
  {name: 'ESTB003-13 - Instrumentação Biomédica (3-2-5)', page: '387'},
  {name: 'ESTB006-13 - Instrumentação Biomédica Avançada (3-2-4)', page: '387'},
  {name: 'ESTO004-13 - Instrumentação e Controle (3-1-5)', page: '388'},
  {name: 'ESZA013-13 - Instrumentação e Metrologia Óptica (3-1-4)', page: '389'},
  {name: 'ESZS003-13 - Instrumentação e Sensores em Veículos Aeroespaciais (3-1-4)', page: '390'},
  {name: 'NHT1086-15 - Instrumentação para o Ensino de Ciências e Biologia (0-4-4)', page: '390'},
  {name: 'ESZE025-13 - Integração e Otimização Energética de Processos (2-0-4)', page: '391'},
  {name: 'MCTAO14-13 - Inteligência Artificial (3-1-4)', page: '392'},
  {name: 'ESZA022-13 - Inteligência Artificial em Robótica (3-1-4)', page: '392'},
  {name: 'ESZS017-13 - Interação Fluido-Estrutura (3-0-4)', page: '393'},
  {name: 'MCZA008-13 - Interação Humano-Computador (4-0-4)', page: '394'},
  {name: 'BCK0104-15 - Interações Atômicas e Moleculares (3-0-4)', page: '394'},
  {name: 'NHZ3021-15 - Interações da Radiação com a Matéria (4-0-4)', page: '395'},
  {name: 'NHZ2048-11 - Interposições da Linguagem à Filosofia Contemporânea (4-0-4)', page: '395'},
  {name: 'BHQ0003-15 - Interpretações do Brasil (4-0-4)', page: '396'},
  {name: 'MCZB013-13 - Introdução à Análise Estocástica em Finanças (3-1-4)', page: '397'},

  {name: 'MCZB014-13 - Introdução à Análise Funcional (4-0-4)', page: '398'},
  {name: 'ESTS003-13 - Introdução à Astronáutica (2-0-3)', page: '398'},
  {name: 'MCZC014-15 - Introdução à Bioestatística (3-1-4)', page: '399'},
  {name: 'ESZB007-13 - Introdução à Biofotônica e Óptica Biomédica (3-1-4)', page: '399'},
  {name: 'ESZB022-13 - Introdução à Bioinformática (3-1-4)', page: '400'},
  {name: 'ESZB005-13 - Introdução à Biotecnologia (4-0-4)', page: '401'},
  {name: 'NHZ3023-15 - Introdução à Cosmologia (4-0-4)', page: '401'},
  {name: 'MCZB015-13 - Introdução à Criptografia (4-0-4)', page: '402'},
  {name: 'ESHC021-13 - Introdução à Economia (4-0-4)', page: '403'},
  {name: 'BHO1101-15 - Introdução à Economia (4-0-4)', page: '403'},
  {name: 'ESZB021-13 - Introdução à Engenharia Biomédica (2-0-4)', page: '404'},
  {name: 'ESZE032-13 - Introdução à Engenharia de Biocombustíveis (2-0-4)', page: '405'},
  {name: 'ESZE054-13 - Introdução à Engenharia do Petróleo I (4-0-4)', page: '406'},
  {name: 'ESZE055-13 - Introdução à Engenharia do Petróleo II (4-0-4)', page: '406'},
  {name: 'ESZE037-13 - Introdução à Engenharia Nuclear (4-0-4)', page: ' 407'},
  {name: 'MCZB016-13 - Introdução à Estatística Bayesiana (3-1-4)', page: '408'},
  {name: 'MCTC001-15 - Introdução à Filosofia da Mente (2-0-2)', page: '409'},
  {name: 'NHZ3024-15 - Introdução à Física de Partículas Elementares (4-0-4)', page: '409'},
  {name: 'NHZ3083-15 - Introdução à Física Estelar (4-0-4)', page: '410'},
  {name: 'NHZ3025-15 - Introdução à Física Médica (3-0-5)', page: '411'},
  {name: 'ESTB017-13 - Introdução à Física Médica (3-1-4)', page: '412'},
  {name: 'NHZ3026-15 - Introdução à Física Nuclear (4-0-4)', page: '412'},
  {name: 'MCTC014-13 - Introdução à Inferência Estatística (3-1-4)', page: '413'},
  {name: 'NHZ2079-08 - Introdução à Lógica (3-0-4)', page: '414'},
  {name: 'MCZB018-13 - Introdução à Modelagem e Processos Estocásticos (3-1-4)', page: '414'},
  {name: 'MCTC002-15 - Introdução à Neurociência (4-0-5)', page: '415'},
  {name: 'MCTC021-15 - Introdução à Neurociência Computacional (2-2-4)', page: '415'},
  {name: 'BIN0406-15 - Introdução à Probabilidade e à Estatística (3-0-4)', page: '416'},
  {name: 'MCZA032-14 - Introdução à Programação de Jogos (2-2-4)', page: '417'},
  {name: 'ESZP025-13 - Introdução à Prospecção Tecnológica (4-0-4)', page: '417'},
  {name: 'MCZC004-15 - Introdução à Psicolinguística e Neurociência da Linguagem (4-0-4)', page: '418'},
  {name: 'ESZB014-13 - Introdução à Robótica (2-2-4)', page: '419'},
  {name: 'NHZ4061-15 - Introdução a Troca de Calor, Massa e Movimentação de Fluidos (4-0-4)', page: '420'},
  {name: 'ESHP012-13 - Introdução ao Direito Administrativo (4-0-4)', page: '421'},
  {name: 'ESHP013-13 - Introdução ao Direito Constitucional (4-0-4)', page: '421'},
  {name: 'ESHR011-13 - Introdução ao Estudo do Direito (4-0-4)', page: '422'},
  {name: 'ESZI015-13 - Introdução ao Processamento de Sinais de Voz, Áudio e Acústicos (3-1-4)', page: ' 423'},

  {name: 'ESTA015-13 - Introdução aos Processos de Fabricação (3-1-4)', page: '423'},
  {name: 'ESTG017-13 - Introdução aos Processos de Fabricação Metal - Mecânico (4-2-4)', page: '424'},
  {name: 'MCZB019-13 - Introdução aos Processos Pontuais (4-0-4)', page: '425'},
  {name: 'MCZB020-13 - Introdução aos Sistemas Dinâmicos (4-0-4)', page: '426'},
  {name: 'ESTE007-13 - Introdução aos Sistemas Elétricos de Potência (3-1-5)', page: '426'},
  {name: 'MCZB021-13 - Introdução às Curvas Algébricas (4-0-4)', page: '427'},
  {name: 'ESTO005-13 - Introdução às Engenharias (2-0-4)', page: '428'},
  {name: 'BCN0405-15 - Introdução às Equações Diferenciais Ordinárias (4-0-4)', page: '428'},
  {name: 'BHO0001-15 - Introdução às Humanidades e Ciências Sociais (2-0-4)', page: '429'},
  {name: 'ESHP014-13 - Introdução às Políticas Públicas (4-0-4)', page: '429'},
  {name: 'ESZS014-13 - Introdução às Vibrações Não Lineares (4-0-4)', page: '430'},
  {name: 'ESZI012-13 - Jogos Digitais: Aspectos Técnicos e Aplicações (2-2-4)', page: '431'},
  {name: 'ESZB015-13 - Laboratório de Bioinformática (0-4-5)', page: '432'},
  {name: 'ESZE069-14 - Laboratório de Calor e Fluidos (0-2-4)', page: '432'},
  {name: 'MCZA010-13 - Laboratório de Engenharia de Software (0-4-4)', page: '433'},
  {name: 'NHT3027-15 - Laboratório de Física I (0-3-5)', page: '434'},
  {name: 'NHT3028-15 - Laboratório de Física II (0-3-5)', page: '434'},
  {name: 'NHT3065-15 - Laboratório de Física III (0-3-5)', page: '435'},
  {name: 'ESZB023-13 - Laboratório de Física Médica (1-3-4)', page: '436'},
  {name: 'NHZ3080-15 - Laboratório de Física Médica (0-3-5)', page: '436'},
  {name: 'ESTS006-13 - Laboratório de Guiagem, Navegação e Controle (0-4-4)', page: ' 437'},
  {name: 'ESZE039-13 - Laboratório de Instrumentação Nuclear e Radioproteção (2-2-6)', page: '438'},
  {name: 'ESZE070-14 - Laboratório de Máquinas Térmicas e Hidráulicas (0-2-4)', page: '438'},
  {name: 'NHZ3031-15 - Laboratório de Propriedades Físicas de Materiais (2-2-4)', page: '439'},
  {name: 'MCZA011-13 - Laboratório de Redes (0-4-4)', page: '440'},
  {name: 'MCZA012-13 - Laboratório de Sistemas Operacionais (0-4-4)', page: '440'},
  {name: 'NHZ3081-15 - Lasers e Óptica Moderna (3-1-4)', page: '441'},
  {name: 'ESTB010-13 - Legislação Relacionada à Saúde (2-0-4)', page: '441'},
  {name: 'NHI5015-15 - LIBRAS (4-0-2)', page: '442'},
  {name: 'NHT4023-15 - Ligações Químicas (4-0-6)', page: '443'},
  {name: 'MCTA015-13 - Linguagens Formais e Autômata (3-1-4)', page: ' 444'},
  {name: 'NHT4073-15 - Livros Didáticos no Ensino de Química (4-0-4)', page: '444'},
  {name: 'NHI2049-13 - Lógica Básica (4-0-4)', page: '445'},
  {name: 'NHZ2050-11 - Lógica e os Fundamentos da Matemática (4-0-4)', page: '446'},
  {name: 'ESZG003-13 - Lógica em Sistemas de Gestão (0-2-4)', page: '446'},
  {name: 'ESZA017-13 - Lógica Programável (3-1-4)', page: '447'},
  {name: 'MCZA013-13 - Lógicas Não Clássicas (4-0-4)', page: '448'},

  {name: 'ESZU013-13 - Logística e Meio Ambiente (2-0-2)', page: '448'},
  {name: 'ESHC022-13 - Macroeconomia I (4-0-4)', page: '449'},
  {name: 'ESHC023-13 - Macroeconomia II (3-0-4)', page: '450'},
  {name: 'ESHC024-13 - Macroeconomia III (4-0-3)', page: '451'},
  {name: 'ESZG029-13 - Manufatura Integrada por Computador (0-4-6)', page: '451'},
  {name: 'ESZS025-13 - Máquinas de Fluxo (4-0-4)', page: '452'},
  {name: 'ESTA009-13 - Máquinas Elétricas (3-2-4)', page: '453'},
  {name: 'ESZE022-13 - Máquinas Térmicas (3-1-4)', page: '453'},
  {name: 'MCTB019-13 - Matemática Discreta (4-0-4)', page: '454'},
  {name: 'ESTM007-13 - Materiais Cerâmicos (3-1-4)', page: '455'},
  {name: 'ESTM008-13 - Materiais Compósitos (3-1-4)', page: '455'},
  {name: 'ESTS009-13 - Materiais Compósitos e Aplicações Estruturais (4-0-4)', page: '456'},
  {name: 'ESTO006-13 - Materiais e Suas Propriedades (3-1-5)', page: '457'},
  {name: 'ESTM005-13 - Materiais Metálicos (3-1-4)', page: '458'},
  {name: 'ESZM030-13 - Materiais Nanoestruturados (4-0-4)', page: '458'},
  {name: 'ESZM027-13 - Materiais para Energia e Ambiente (4-0-4)', page: '459'},
  {name: 'ESZM028-13 - Materiais para Tecnologia da Informação (4-0-4)', page: '460'},
  {name: 'ESTM006-13 - Materiais Poliméricos (3-1-4)', page: '461'},
  {name: 'ESZM021-13 - Matérias Primas Cerâmicas (4-0-4)', page: '462'},
  {name: 'NHT3068-15 - Mecânica Clássica I (4-0-4)', page: '463'},
  {name: 'NHT3069-15 - Mecânica Clássica II (4-0-4)', page: '463'},
  {name: 'NHZ3075-15 - Mecânica Clássica III (4-0-4)', page: '464'},
  {name: 'ESTS014-13 - Mecânica dos Fluidos Avançada (4-2-4)', page: '464'},
  {name: 'ESTO007-13 - Mecânica dos Fluidos I (3-1-5)', page: '465'},
  {name: 'ESTE011-13 - Mecânica dos Fluidos II (3-1-5)', page: '466'},
  {name: 'ESTO008-13 - Mecânica dos Sólidos I (3-1-5)', page: '466'},
  {name: 'ESZS018-13 - Mecânica dos Sólidos II (4-0-5)', page: '467'},
  {name: 'NHT3036-15 - Mecânica Estatística (6-0-6)', page: '467'},
  {name: 'NHT3037-13 - Mecânica Geral (4-0-4)', page: '468'},
  {name: 'NHT3072-15 - Mecânica Quântica I (6-0-10)', page: '469'},
  {name: 'NHT3073-15 - Mecânica Quântica II (4-0-4)', page: ' 469'},
  {name: 'NHZ3077-15 - Mecânica Quântica III (4-0-4)', page: '470'},
  {name: 'NHT4024-15 - Mecanismos de Reações Orgânicas (4-0-6)', page: '470'},
  {name: 'NHZ4062-15 - Meio Ambiente e Indústria (2-0-2)', page: '471'},
  {name: 'ESZP044-14 - Meio Ambiente e Políticas Públicas (4-0-4)', page: '472'},
  {name: 'MCZC013-15 - Memória e Aprendizagem (4-0-4)', page: '472'},
  {name: 'ESZP026-13 - Memória, Identidades Sociais e Cidadania nas Sociedades Complexas Contemporâneas (4-0-4)', page: '473'},

  {name: 'ESZT006-13 - Mercado Imobiliário (4-0-4)', page: '474'},
  {name: 'ESZM023-13 - Metalurgia Física (4-0-4)', page: '475'},
  {name: 'MCZB022-13 - Metateoremas da Lógica Clássica (4-0-4)', page: '475'},
  {name: 'ESHC900-13 - Metodologia (4-0-3)', page: '476'},
  {name: 'ESHR900-13 - Metodologia de pesquisa em RI (4-0-4)', page: '477'},
  {name: 'ESTS011-13 - Métodos Computacionais para Análise Estrutural (3-1-4)', page: '478'},
  {name: 'ESZM010-13 - Métodos Computacionais para o Estudo de Biomoléculas (3-1-4)', page: '479'},
  {name: 'NHT4025-15 - Métodos de Análise em Química Orgânica (4-0-4)', page: '479'},
  {name: 'ESTB016-13 - Métodos de Elementos Finitos Aplicados a Sistemas Biomédicos (0-3-4)', page: '480'},
  {name: 'NHZ3041-15 - Métodos de Formação de Imagem e de Inspeção Nuclear (2-2-5)', page: ' 480'},
  {name: 'MCZA014-13 - Métodos de Otimização (4-0-4)', page: '481'},
  {name: 'ESHP024-14 - Métodos de Pesquisa em Políticas Públicas (4-0-4)', page: '481'},
  {name: 'ESHT010-15 - Métodos de Planejamento (3-1-4)', page: '482'},
  {name: 'ESZU014-13 - Métodos de Tomada de Decisão Aplicados ao Planejamento Urbano-Ambiental (1-1-4)', page: '483'},
  {name: 'ESZP027-13 - Métodos e Técnicas Aplicadas às Políticas Públicas Ambientais (2-2-4)', page: '484'},
  {name: 'ESZP028-13 - Métodos e Técnicas Aplicadas às Políticas Públicas Urbanas (2-2-4)', page: '485'},
  {name: 'ESHT011-13 - Métodos e Técnicas de Análise de Informação para o Planejamento (3-1-4)', page: '486'},
  {name: 'ESTO009-13 - Métodos Experimentais em Engenharia (0-3-2)', page: '486'},
  {name: 'ESTB001-13 - Métodos Matemáticos Aplicados a Sistemas Biomédicos (6-0-4)', page: ' 487'},
  {name: 'MCZB017-13 - Métodos Numéricos de EDP’s (2-2-4)', page: '488'},
  {name: 'MCZB023-13 - Métodos Numéricos em EDO’s (2-2-4)', page: '489'},
  {name: 'ESHP016-13 - Métodos Quantitativos para Ciências Sociais (2-2-4)', page: '489'},
  {name: 'ESZU015-13 - Métodos Quantitativos para Planejamento Estratégico (1-1-4)', page: '490'},
  {name: 'MCZB024-13 - Métodos Variacionais (4-0-4)', page: '491'},
  {name: 'ESZG030-13 - Metrologia (2-2-4)', page: '492'},
  {name: 'NHT1056-15 - Microbiologia (4-2-4)', page: '492'},
  {name: 'ESTU010-13 - Microbiologia Ambiental (3-1-4)', page: '493'},
  {name: 'ESHC025-13 - Microeconomia I (4-0-4)', page: '493'},
  {name: 'ESHC026-13 - Microeconomia II (4-0-3)', page: '494'},
  {name: 'NHZ3042-15 - Microscopia Eletrônica (2-2-4)', page: '495'},
  {name: 'MCZA015-13 - Mineração de Dados (3-1-4)', page: '496'},
  {name: 'ESHT012-13 - Mobilização Produtiva dos Territórios e Desenvolvimento Local (4-0-4)', page: '496'},
  {name: 'ESTB008-13 - Modelagem e Simulação de Sistemas Biomédicos (2-2-4)', page: '497'},
  {name: 'NHZ1079-15 - Modelagem Molecular de Sistemas Biológicos (3-1-4)', page: '498'},
  {name: 'ESZG020-13 - Modelos de Comunicação nas Organizações (2-0-4)', page: '499'},
  {name: 'ESZG032-13 - Modelos e Ferramentas de Gestão Ambiental (3-0-3)', page: '499'},
  {name: 'ESZP004-13 - Modelos e Práticas Colaborativas em CT&I (4-0-4)', page: '500'},

  {name: 'ESZC012-13 - Modelos Econômicos e Análise das Dinâmicas Territoriais (4-0-4)', page: '501'},
  {name: 'MCZB025-13 - Módulos (4-0-4)', page: '501'},
  {name: 'ESHC902-13 - Monografia I (0-8-0)', page: '502'},
  {name: 'ESHC903-13 - Monografia II (0-9-0)', page: '502'},
  {name: 'NHT1066-15 - Morfofisiologia Animal Comparada (4-0-4)', page: '502'},
  {name: 'NHT1058-15 - Morfofisiologia Humana I (4-2-4)', page: '503'},
  {name: 'NHT1059-15 - Morfofisiologia Humana II (4-2-4)', page: '504'},
  {name: 'NHT1060-15 - Morfofisiologia Humana III (4-2-4)', page: '504'},
  {name: 'ESZE018-13 - Motores de Combustão Interna (2-1-4)', page: '505'},
  {name: 'ESZP029-13 - Movimentos Sindicais, Sociais e Culturais (4-0-4)', page: '506'},
  {name: 'ESZC013-13 - Mudança Tecnológica e Dinâmica Capitalista na Economia Contemporânea (4-0-4)', page: '506'},
  {name: 'ESZM002-13 - Nanociência e Nanotecnologia (2-0-2)', page: '507'},
  {name: 'ESZM031-13 - Nanocompósitos (4-0-4)', page: '508'},
  {name: 'NHZ3060-09 - Nascimento e Desenvolvimento da Ciência Moderna (4-0-4)', page: '509'},
  {name: 'BCM0504-15 - Natureza da Informação (3-0-4)', page: '510'},
  {name: 'ESZS008-13 - Navegação Inercial e GPS (3-1-4)', page: '510'},
  {name: 'ESZG021-13 - Negociação e Solução de Conflitos Organizacionais (4-0-2)', page: '511'},
  {name: 'ESZR009-13 - Negociações internacionais, propriedade intelectual e transferência tecnológica (4-0-4)', page: '512'},
  {name: 'MCTC023-15 - Neuroanatomia (3-1-4)', page: '513'},
  {name: 'MCZC008-13 - Neuroarte (2-0-2)', page: '514'},
  {name: 'MCZC015-15 - Neuroarte Prática e Estética Experimental (1-3-2)', page: '514'},
  {name: 'MCTC019-15 - Neurobiologia Molecular e Celular (4-2-4)', page: '515'},
  {name: 'MCZC016-15 - Neurociência da Cognição Musical (2-0-2)', page: '516'},
  {name: 'MCTC024-15 - Neuroetologia (4-0-4)', page: '517'},
  {name: 'ESZB012-13 - Neuromecânica do Movimento Humano (2-2-4)', page: '517'},
  {name: 'MCTC018-15 - Neuropsicofarmacologia (3-1-4)', page: '518'},
  {name: 'NHZ3043-15 - Noções de Astronomia e Cosmologia (4-0-4)', page: '519'},
  {name: 'ESZE003-13 - Normas de Segurança para Sistemas Energéticos (2-0-4)', page: '519'},
  {name: 'ESHP025-14 - Observatório de Políticas Públicas (0-4-4)', page: '521'},
  {name: 'ESHT014-13 - Oficina de Planejamento de Áreas Periurbanas, Interioranas e Rurais (0-4-4)', page: '522'},
  {name: 'ESHT016-13 - Oficina de Planejamento e Governança Metropolitana (0-4-4)', page: '522'},
  {name: 'ESHT013-13 - Oficina de Planejamento Macro e Meso Regional (0-4-4)', page: '522'},
  {name: 'ESHT015-13 - Oficina de Planejamento Urbano (0-4-4)', page: '523'},
  {name: 'ESZT007-13 - Oficina de Projeto Urbano (0-4-4)', page: '523'},
  {name: 'ESTI009-13 - Ondas Eletromagnéticas Aplicadas (3-1-4)', page: '524'},
  {name: 'ESTE009-13 - Operação de Sistemas Elétricos de Potência (3-1-4)', page: '525'},
  {name: 'ESZE035-13 - Operações e Equipamentos Industriais I (3-1-4)', page: '525'},

  {name: 'ESZE036-13 - Operações e Equipamentos Industriais II (3-1-4)', page: '526'},
  {name: 'NHZ4028-15 - Operações Unitárias I (4-0-4)', page: '526'},
  {name: 'NHZ4029-15 - Operações Unitárias II (4-0-4)', page: '527'},
  {name: 'NHT3044-15 - Óptica (3-1-4)', page: ' 527'},
  {name: 'ESZA016-13 - Optoeletrônica (3-1-4)', page: '528'},
  {name: 'ESTG012-13 - Organização do Trabalho (3-1-5)', page: '529'},
  {name: 'ESZS010-13 - Otimização em Projetos de Estruturas (4-0-4)', page: '530'},
  {name: 'MCTA016-13 - Paradigmas de Programação (2-2-4)', page: '530'},
  {name: 'NHZ1037-15 - Parasitologia (3-0-3)', page: '531'},
  {name: 'ESHP026-14 - Participação, Movimentos Sociais e Políticas Públicas (4-0-4)', page: '532'},
  {name: 'MCZC005-15 - Patologias do Sistema Nervoso Central (4-0-4)', page: '532'},
  {name: 'ESZT008-13 - Patrimônio Cultural e Paisagem (4-0-4)', page: '534'},
  {name: 'BHP0202-15 - Pensamento Crítico (4-0-4)', page: '534'},
  {name: 'ESHR023-14 - Pensamento crítico das Relações Internacionais (4-0-4)', page: '535'},
  {name: 'BHO0002-15 - Pensamento Econômico (3-0-4)', page: '536'},
  {name: 'NHZ2051-11 - Pensamento Hegeliano e seus Desdobramentos Contemporâneos (4-0-4)', page: '536'},
  {name: 'NHZ2052-11 - Pensamento Kantiano e seus Desdobramentos Contemporâneos (4-0-4)', page: '538'},
  {name: 'ESZP006-13 - Pensamento Latino-Americano e Políticas de CT&I (4-0-4)', page: '539'},
  {name: 'NHZ2053-11 - Pensamento Marxista e seus Desdobramentos Contemporâneos (4-0-4)', page: '540'},
  {name: 'NHZ2054-11 - Pensamento Nietzcheano e seus Desdobramentos Contemporâneos (4-0-4)', page: '540'},
  {name: 'MCZB026-13 - Percolação (4-0-4)', page: '542'},
  {name: 'ESZP030-13 - Perspectiva de Análise do Estado e das Políticas Públicas (4-0-4)', page: '542'},
  {name: 'ESZP040-14 - Perspectivas Analíticas Sobre a Burocracia (4-0-4)', page: '543'},
  {name: 'NHZ2055-11 - Perspectivas Críticas da Filosofia Contemporânea (4-0-4)', page: '544'},
  {name: 'MCTC007-15 - Pesquisa e Comunicação Científica (2-0-2)', page: '544'},
  {name: 'NHZ2056-11 - Pesquisa em Filosofia (4-0-4)', page: '545'},
  {name: 'ESTG013-13 - Pesquisa Operacional (4-2-9)', page: '545'},
  {name: 'ESZG006-13 - Pesquisa Operacional Aplicada (4-0-5)', page: ' 546'},
  {name: 'ESZE064-13 - Petrofísica (4-0-4)', page: '547'},
  {name: 'ESZS013-13 - Placas e Cascas (3-0-4)', page: '548'},
  {name: 'ESZI022-13 - Planejamento de Redes de Informação', page: ' 548'},
  {name: '(2-2-4)', page: '548'},
  {name: 'ESTG014-13 - Planejamento e Controle da Produção (4-2-9)', page: '549'},
  {name: 'ESZG010-13 - Planejamento e Controle de Projetos (2-2-4)', page: '550'},
  {name: 'ESZT009-13 - Planejamento e Gestão de Redes Técnicas e Sistemas Territoriais (4-0-4)', page: '550'},
  {name: 'ESHT017-13 - Planejamento e Política Ambiental (4-0-4)', page: '551'},
  {name: 'ESHT018-13 - Planejamento e Política Regional (4-0-4)', page: '552'},

  {name: 'ESHT019-13 - Planejamento e Política Rural (4-0-4)', page: '553'},
  {name: 'ESZG011-13 - Planejamento Estratégico em Gestão de Projetos (2-2-6)', page: '554'},
  {name: 'ESHP030-14 - Planejamento Orçamentário (4-0-4)', page: '554'},
  {name: 'ESTU011-13 - Planejamento Urbano e Metropolitano (3-1-4)', page: ' 555'},
  {name: 'NHZ2057-11 - Poder e Cultura na Sociedade da Informação (4-0-4)', page: '556'},
  {name: 'ESHP027-14 - Poder Local (4-0-4)', page: '557'},
  {name: 'NHZ4063-15 - Polímeros: Síntese, Caracterização e Processos (4-2-4)', page: '558'},
  {name: 'ESHR025-14 - Política Externa Brasileira Contemporânea (4-0-4)', page: '559'},
  {name: 'ESZT011-13 - Política Habitacional (4-0-4)', page: '560'},
  {name: 'ESHR012-13 - Política Internacional dos EUA e da União Europeia (4-0-4)', page: '561'},
  {name: 'ESHT020-13 - Política Metropolitana (4-0-4)', page: '562'},
  {name: 'ESHT021-13 - Política Urbana (4-0-4)', page: '562'},
  {name: 'ESZP047-14 - Política Urbana (4-0-4)', page: '563'},
  {name: 'ESZP007-13 - Políticas Culturais (4-0-4)', page: '564'},
  {name: 'ESZP039-14 - Políticas de Educação (4-0-4)', page: '565'},
  {name: 'ESZT010-13 - Políticas de Infra-Estrutura (4-0-4)', page: '567'},
  {name: 'ESZP038-14 - Políticas de Saúde (4-0-4)', page: '568'},
  {name: 'NHI5011-13 - Políticas Educacionais (3-0-3)', page: '569'},
  {name: 'ESZP034-14 - Políticas Públicas de Esporte e Lazer (2-0-4)', page: '569'},
  {name: 'ESZP008-13 - Políticas Públicas de Gênero, Etnia e Geração (4-0-4)', page: '570'},
  {name: 'ESZP009-13 - Políticas Públicas de Intervenção Territorial no Brasil (4-0-4)', page: '572'},
  {name: 'ESHP028-14 - Políticas Públicas para A Sociedade da Informação (4-0-4)', page: '573'},
  {name: 'ESZR016-14 - Políticas Públicas Sul-Americanas (4-0-4)', page: '574'},
  {name: 'ESHP018-14 - Políticas Sociais (4-0-4)', page: '574'},
  {name: 'ESTU012-13 - Poluição Atmosférica (3-0-4)', page: '575'},
  {name: 'NHZ2058-11 - Pragmatismo (4-0-4)', page: '576'},
  {name: 'MCZA038-14 - Prática Avançada de Programação A (0-4-4)', page: '577'},
  {name: 'MCZA039-14 - Prática Avançada de Programação B (0-4-4)', page: '577'},
  {name: 'MCZA040-14 - Prática Avançada de Programação C (0-4-4)', page: '578'},
  {name: 'NHH2059-13 - Prática de Ensino de Filosofia I (3-0-4)', page: '578'},
  {name: 'NHH2060-13 - Prática de Ensino de Filosofia II (3-0-4)', page: '579'},
  {name: 'NHH2061-13 - Prática de Ensino de Filosofia III (3-0-4)', page: ' 580'},
  {name: 'NHH2062-13 - Prática de Ensino de Filosofia IV (3-0-4)', page: '581'},
  {name: 'NHH2063-13 - Prática de Ensino de Filosofia V (3-0-4)', page: '581'},
  {name: 'NHT5012-15 - Práticas de Ciências no Ensino Fundamental (4-0-4)', page: '582'},
  {name: 'NHT1071-15 - Práticas de Ecologia (1-3-4)', page: '583'},
  {name: 'NHT1083-15 - Práticas de Ensino de Biologia I (2-1-4)', page: '584'},

  {name: 'NHT1084-15 - Práticas de Ensino de Biologia II (2-1-4)', page: '584'},
  {name: 'NHT1085-15 - Práticas de Ensino de Biologia III (2-1-4)', page: '585'},
  {name: 'NHT5013-15 - Práticas de Ensino de Ciências e Matemática no Ensino Fundamental (4-0-4)', page: '586'},
  {name: 'NHT3095-15 - Práticas de Ensino de Física I (2-2-4)', page: '587'},
  {name: 'NHT3090-15 - Práticas de Ensino de Física II (2-2-4)', page: '589'},
  {name: 'NHT3091-15 - Práticas de Ensino de Física III (2-2-4)', page: '590'},
  {name: 'MCTD014-13 - Práticas de Ensino de Matemática I (3-0-4)', page: '591'},
  {name: 'MCTD012-13 - Práticas de Ensino de Matemática II (3-0-4)', page: '593'},
  {name: 'MCTD013-13 - Práticas de Ensino de Matemática III (3-0-4)', page: '594'},
  {name: 'MCTD011-13 - Práticas de Ensino de Matemática no Ensino Fundamental (4-0-4)', page: '595'},
  {name: 'NHT4030-15 - Práticas de Ensino de Química I (3-0-4)', page: '596'},
  {name: 'NHT4071-15 - Práticas de Ensino de Química II (0-3-4)', page: '597'},
  {name: 'NHT4032-15 - Práticas de Ensino de Química III (3-0-4)', page: '597'},
  {name: 'BHS0001-15 - Práticas em Ciências e Humanidades (2-2-4)', page: '598'},
  {name: 'NHT4033-15 - Práticas em Química Verde (0-4-4)', page: '598'},
  {name: 'ESTI004-13 - Princípios de Comunicação (3-1-4)', page: '599'},
  {name: 'ESTB015-13 - Princípios de Ética em Serviços de Saúde (2-0-3)', page: '600'},
  {name: 'ESTB009-13 - Princípios de Imagens Médicas (4-0-4)', page: '601'},
  {name: 'NHT3048-15 - Princípios de Mecânica Quântica (4-0-4)', page: '602'},
  {name: 'MCZB027-13 - Princípios de Simulação Matemática (2-2-4)', page: '602'},
  {name: 'NHT3049-15 - Princípios de Termodinâmica (4-0-6)', page: '603'},
  {name: 'ESTB007-13 - Princípios e Aplicações de Biomecânica (2-2-4)', page: '603'},
  {name: 'ESZM011-13 - Princípios Moleculares em Biomateriais (4-0-4)', page: '604'},
  {name: 'MCTB021-13 - Probabilidade (4-0-4)', page: ' 604'},
  {name: 'NHH2064-13 - Problemas Metafísicos: Perspectivas Contemporâneas (4-0-4)', page: '605'},
  {name: 'NHH2065-13 - Problemas Metafísicos: Perspectivas Modernas (4-0-4)', page: '606'},
  {name: 'ESZA005-13 - Processadores Digitais em Controle e Automação (3-1-4)', page: '607'},
  {name: 'BCM0505-15 - Processamento da Informação (3-2-5)', page: '608'},
  {name: 'ESZM020-13 - Processamento de Cerâmicas (3-1-4)', page: '609'},
  {name: 'ESZB010-13 - Processamento de Imagens Médicas (2-2-5)', page: '609'},
  {name: 'MCZA041-14 - Processamento de Imagens Utilizando GPU (4-0-4)', page: '610'},
  {name: 'ESZI003-13 - Processamento de Informação em Línguas Naturais (3-1-4)', page: '611'},
  {name: 'MCZA017-13 - Processamento de Linguagem Natural (4-0-4)', page: '612'},
  {name: 'MCTC022-15 - Processamento de Sinais Neurais (1-3-4)', page: '613'},
  {name: 'ESZI009-13 - Processamento de Vídeo (3-1-4)', page: '614'},
  {name: 'MCZA018-13 - Processamento Digital de Imagens (3-1-4)', page: '614'},
  {name: 'ESTI006-13 - Processamento Digital de Sinais (4-0-4)', page: '615'},

  {name: 'ESZB004-13 - Processamento e Análise de Falhas em Biomateriais (2-3-4)', page: '615'},
  {name: 'ESZB003-13 - Processamento e Análise de Sinais Biomédicos (2-2-4)', page: '616'},
  {name: 'ESZM026-13 - Processamento e Conformação de Metais (3-1-4)', page: '617'},
  {name: 'MCZA042-14 - Processo e Desenvolvimento de Softwares Educacionais (0-4-4)', page: '617'},
  {name: 'MCZB028-13 - Processos Estocásticos (4-0-4)', page: ' 618'},
  {name: 'NHZ4064-15 - Processos Industriais Cerâmicos (4-0-4)', page: '619'},
  {name: 'NHZ4035-15 - Processos Industriais Orgânicos e Inorgânicos (4-0-4)', page: '620'},
  {name: 'ESZE031-13 - Processos Termoquímicos de Conversão Energética (2-0-4)', page: '620'},
  {name: 'MCZA033-14 - Programação Avançada para Dispositivos Móveis (0-4-4)', page: '621'},
  {name: 'ESZI011-13 - Programação de Dispositivos Móveis (0-2-4)', page: '622'},
  {name: 'ESTI001-13 - Programação de Software Embarcado (2-2-4)', page: '622'},
  {name: 'MCTA028-15 - Programação Estruturada (2-2-4)', page: '623'},
  {name: 'MCTA017-13 - Programação Matemática (3-1-4)', page: '624'},
  {name: 'MCTA018-13 - Programação Orientada a Objetos (2-2-4)', page: '624'},
  {name: 'MCZA019-13 - Programação para Web (2-2-4)', page: '625'},
  {name: 'MCZA020-13 - Programação Paralela (4-0-4)', page: '626'},
  {name: 'MCZA034-14 - Programação Segura (2-2-4)', page: '626'},
  {name: 'MCTC009-15 - Progressos e Métodos em Neurociência (3-1-4)', page: '627'},
  {name: 'ESZI020-13 - Projeto de Alta Frequência (2-2-4)', page: '627'},
  {name: 'ESTS013-13 - Projeto de Elementos Estruturais de Aeronaves I (3-1-5)', page: '628'},
  {name: 'ESZS015-13 - Projeto de Elementos Estruturais de Aeronaves II (3-1-5)', page: '628'},
  {name: 'ESZI016-13 - Projeto de Filtros Digitais (2-2-4)', page: '629'},
  {name: 'MCTA019-13 - Projeto de Graduação em Computação I (8-0-8)', page: '630'},
  {name: 'MCTA020-13 - Projeto de Graduação em Computação II (8-0-8)', page: '630'},
  {name: 'MCTA021-13 - Projeto de Graduação em Computação III (8-0-8)', page: '630'},
  {name: 'ESZA014-13 - Projeto de Microdispositivos para Instrumentação (3-1-4)', page: '631'},
  {name: 'MCZA021-13 - Projeto de Redes (4-0-4)', page: '631'},
  {name: 'ESZI023-13 - Projeto de Sistemas de Comunicação (0-3-3)', page: '632'},
  {name: 'ESZI024-13 - Projeto de Sistemas Multimídia (0-3-3)', page: '632'},
  {name: 'BCS0002-15 - Projeto Dirigido (0-2-10)', page: '633'},
  {name: 'ESZB017-13 - Projeto e Desenvolvimento de Sistemas para Análise de Dados Médicos (3-2-4)', page: '634'},
  {name: 'MCZA022-13 - Projeto Interdisciplinar (0-4-4)', page: '635'},
  {name: 'ESZS026-13 - Projeto Térmico de Veículos Espaciais (4-0-4)', page: '635'},
  {name: 'ESZG012-13 - Projetos Industriais (2-2-6)', page: '636'},
  {name: 'ESTI011-13 - Propagação e Antenas (3-1-4)', page: '636'},
  {name: 'ESTM011-13 - Propriedades Elétricas, Magnéticas e Ópticas (3-1-4)', page: '637'},
  {name: 'NHZ3085-15 - Propriedades Magnéticas e Eletrônicas (2-2-4)', page: '638'},

  {name: 'ESTM010-13 - Propriedades Mecânicas e Térmicas (3-1-4)', page: '638'},
  {name: 'ESZS023-13 - Propulsão Aeroespacial Não-Convencional (3-0-4)', page: '639'},
  {name: 'ESZG015-13 - Prospecção Tecnológica Aplicada à Engenharia (0-2-2)', page: '640'},
  {name: 'ESZE013-13 - Proteção de Sistemas Elétricos de Potência (3-1-4)', page: '641'},
  {name: 'MCTC011-15 - Psicologia Cognitiva (4-0-4)', page: '641'},
  {name: 'MCTC020-15 - Psicologia Experimental (2-4-4)', page: '642'},
  {name: 'ESZE007-13 - Qualidade da Energia Elétrica (2-2-4)', page: '643'},
  {name: 'ESZB011-13 - Qualidade de Imagens Médicas (2-2-4)', page: '643'},
  {name: 'ESTG016-13 - Qualidade em Sistemas (4-0-5)', page: '644'},
  {name: 'ESZU016-13 - Questões Ambientais Globais (2-0-4)', page: '645'},
  {name: 'NHZ5014-15 - Questões Atuais no Ensino de Ciências (2-0-2)', page: '645'},
  {name: 'NHT4051-15 - Química Analítica Clássica I (3-3-6)', page: ' 646'},
  {name: 'NHT4050-15 - Química Analítica Clássica II (3-3-6)', page: '647'},
  {name: 'NHT4058-15 - Química Analítica e Bioanalítica Avançada (4-2-8)', page: '648'},
  {name: 'NHZ4069-15 - Química de Alimentos (2-2-2)', page: '649'},
  {name: 'NHT4052-15 - Química de Coordenação (4-4-8)', page: '649'},
  {name: 'ESZE066-13 - Química do Petróleo (4-0-4)', page: '650'},
  {name: 'NHT4053-15 - Química dos Elementos (4-4-6)', page: ' 651'},
  {name: 'NHZ4038-15 - Química dos Materiais (4-2-4)', page: '651'},
  {name: 'NHZ4066-15 - Química Inorgânica Avançada (4-0-4)', page: '652'},
  {name: 'ESZM004-13 - Química Inorgânica de Materiais (4-2-4)', page: ' 653'},
  {name: 'NHT4056-15 - Química Inorgânica Experimental (0-4-4)', page: '653'},
  {name: 'NHT4040-15 - Química Orgânica Aplicada (0-4-6)', page: '654'},
  {name: 'ESZM003-13 - Química Orgânica de Materiais e Biomateriais (4-2-4)', page: ' 654'},
  {name: 'NHT4041-15 - Química Orgânica Experimental (0-4-6)', page: '655'},
  {name: 'ESZE038-13 - Reações Nucleares (3-0-5)', page: '656'},
  {name: 'ESZM005-13 - Reciclagem e Ambiente (4-0-4)', page: '656'},
  {name: 'NHZ4074-15 - Recursos Didáticos para o Ensino de Química (4-0-4)', page: '657'},
  {name: 'ESZU023-13 - Recursos Hídricos (3-0-4)', page: '658'},
  {name: 'MCZA023-13 - Redes Convergentes (4-0-4)', page: '658'},
  {name: 'ESZI005-13 - Redes de Alta Velocidade (3-1-4)', page: '659'},
  {name: 'ESZA009-13 - Redes de Barramento de Campo (2-1-4)', page: '659'},
  {name: 'MCTA022-13 - Redes de Computadores (3-1-4)', page: '660'},
  {name: 'ESZE014-13 - Redes de Distribuição de Energia Elétrica (3-1-4)', page: '661'},
  {name: 'MCZA024-13 - Redes sem Fio (3-1-4)', page: '661'},
  {name: 'ESZE027-13 - Refrigeração e Condicionamento de Ar (3-1-4)', page: '662'},
  {name: 'ESHR028-14 - Regime Internacional dos Direitos Humanos e a Atuação Brasileira (4-0-4)', page: '662'},

  {name: 'ESZR017-14 - Regimes de Negociação Ambiental Internacional e a Atuação Brasileira (4-0-4)', page: '663'},
  {name: 'ESZR018-14 - Regimes de Negociação Comercial Internacional e a Atuação Brasileira (4-0-4)', page: '664'},
  {name: 'ESZR019-14 - Regimes de Negociação Financeira Internacional e a Atuação Brasileira (4-0-4)', page: '665'},
  {name: 'ESHP019-13 - Regimes e Formas De Governo (4-0-4)', page: '666'},
  {name: 'ESTU013-13 - Regulação Ambiental e Urbana (2-0-4)', page: '666'},
  {name: 'ESZP010-13 - Regulação e Agências Reguladoras no Contexto Brasileiro (4-0-4)', page: '667'},
  {name: 'ESZE015-13 - Regulação e Mercado de Energia Elétrica (2-0-2)', page: '668'},
  {name: 'ESHT022-13 - Regulação Urbanística e Ambiental (2-0-2)', page: '668'},
  {name: 'ESHR014-13 - Relações Internacionais e Globalização (4-0-4)', page: '669'},
  {name: 'ESTM012-13 - Reologia I (2-0-3)', page: '670'},
  {name: 'ESZM018-13 - Reologia II (2-0-3)', page: '670'},
  {name: 'NHZ1080-15 - Reprodução Assistida em Mamíferos (2-2-2)', page: '671'},
  {name: 'ESZE045-13 - Resíduos Nucleares (3-0-3)', page: '672'},
  {name: 'ESTU014-13 - Resíduos Sólidos (3-0-4)', page: '672'},
  {name: 'ESZA020-13 - Robôs Móveis Autônomos (3-1-4)', page: '673'},
  {name: 'MCZA044-14 - Robótica e Sistemas Inteligentes (2-2-4)', page: '674'},
  {name: 'MCZA045-14 - Robótica Educacional (2-2-4)', page: '674'},
  {name: 'ESZT012-13 - Saneamento Ambiental (4-0-4)', page: '675'},
  {name: 'ESTU015-13 - Saúde Ambiental (2-0-3)', page: '676'},
  {name: 'MCTA023-13 - Segurança de Dados (3-1-4)', page: '676'},
  {name: 'ESZE044-13 - Segurança de Instalações Nucleares (3-0-4)', page: '677'},
  {name: 'ESZI008-13 - Segurança de Redes (3-1-4)', page: '678'},
  {name: 'ESZT013-13 - Segurança dos Territórios (4-0-4)', page: '679'},
  {name: 'MCZA025-13 - Segurança em Redes (2-2-4)', page: '679'},
  {name: 'ESHR015-13 - Segurança Internacional in perspectiva histórica e desafios contemporâneos (4-0-4)', page: '680'},
  {name: 'ESTM013-13 - Seleção de Materiais (4-0-4)', page: '681'},
  {name: 'MCZA046-14 - Semântica de Linguagem de Programação (4-0-4)', page: ' 682'},
  {name: 'NHZ1042-15 - Seminários em Biologia I (1-0-2)', page: '683'},
  {name: 'NHZ1043-15 - Seminários em Biologia II (1-0-2)', page: '683'},
  {name: 'ESZM001-13 - Seminários em Materiais Avançados (2-0-2)', page: '684'},
  {name: 'NHZ4042-09 - Seminários em Química I (2-0-2)', page: '684'},
  {name: 'NHZ4043-15 - Seminários em Química II (2-0-2)', page: '685'},
  {name: 'MCZC012-15 - Sensação e Percepção (4-0-4)', page: ' 686'},
  {name: 'ESTA010-13 - Sensores e Transdutores (3-1-4)', page: '686'},
  {name: 'ESZU017-13 - Sensoriamento Remoto (1-3-4)', page: '687'},
  {name: 'MCTB022-13 - Sequências e Séries (4-0-4)', page: '688'},
  {name: 'ESZA010-13 - Servo-Sistema para Robôs e Acionamento para Sistemas Mecatrônicos (3-1-4)', page: '688'},

  {name: 'ESZM025-13 - Siderurgia e Engenharia dos Aços (4-0-4)', page: '689'},
  {name: 'ESZG007-13 - Simulação de Modelos de Gestão (2-2-4)', page: '690'},
  {name: 'ESZI010-13 - Simulação de Sistemas de Comunicação (2-2-4)', page: '690'},
  {name: 'ESZS005-13 - Simulação de Vôo e Ambientes Virtuais (3-0-4)', page: '691'},
  {name: 'ESZM017-13 - Simulação e Processamento de Polímeros (3-1-4)', page: '692'},
  {name: 'ESTI005-13 - Sinais Aleatórios (4-0-4)', page: '693'},
  {name: 'ESZM016-13 - Síntese de Polímeros (3-1-4)', page: '694'},
  {name: 'MCZA026-13 - Sistema de Gerenciamento de Banco de Dados (2-2-4)', page: '695'},
  {name: 'ESHR016-13 - Sistema Financeiro Internacional: de Bretton Woods ao non-sistema (4-0-4)', page: '695'},
  {name: 'ESHR017-13 - Sistema ONU e os desafios do multilateralismo (4-0-4)', page: '696'},
  {name: 'ESTA014-13 - Sistemas CAD/CAM (3-1-4)', page: '697'},
  {name: 'ESTA003-13 - Sistemas de Controle I (3-2-4)', page: '697'},
  {name: 'ESTA008-13 - Sistemas de Controle II (3-2-4)', page: '698'},
  {name: 'ESZA001-13 - Sistemas de Controle III (3-2-4)', page: '699'},
  {name: 'ESTU017-13 - Sistemas de Esgotos e Drenagem Urbana (2-2-5)', page: '700'},
  {name: 'MCZA027-13 - Sistemas de Informação (4-0-4)', page: '701'},
  {name: 'ESZI019-13 - Sistemas de Micro-ondas (3-1-4)', page: '701'},
  {name: 'ESZE008-13 - Sistemas de Potência I (2-2-4)', page: '702'},
  {name: 'ESZE009-13 - Sistemas de Potência II (2-2-4)', page: '702'},
  {name: 'ESTS017-13 - Sistemas de Propulsão I (3-1-5)', page: '703'},
  {name: 'ESZS021-13 - Sistemas de Propulsão II (3-1-5)', page: '704'},
  {name: 'ESTU018-13 - Sistemas de Tratamento de Águas e Efluentes (2-2-4)', page: '704'},
  {name: 'MCTA024-13 - Sistemas Digitais (2-2-4)', page: '705'},
  {name: 'MCTA025-13 - Sistemas Distribuídos (3-1-4)', page: '706'},
  {name: 'ESTG020-13 - Sistemas e Processos de Produção (2-2-4)', page: '707'},
  {name: 'ESZE024-13 - Sistemas Fluidomecânicos (4-0-4)', page: '707'},
  {name: 'ESZE107-15 - Sistemas Fotovoltaicos Isolados (4-0-4)', page: ' 708'},
  {name: 'ESZI014-13 - Sistemas Inteligentes (3-1-4)', page: '709'},
  {name: 'ESTI013-13 - Sistemas Microprocessados (2-2-4)', page: '710'},
  {name: 'MCZA028-13 - Sistemas Multiagentes (3-1-4)', page: '711'},
  {name: 'MCZA029-13 - Sistemas Multimídia (2-2-4)', page: '711'},
  {name: 'MCZA047-14 - Sistemas Multi-Robôs Sociais (2-2-4)', page: '712'},
  {name: 'MCTA026-13 - Sistemas Operacionais (3-1-4)', page: '712'},
  {name: 'ESTE014-13 - Sistemas Térmicos (2-2-4)', page: '713'},
  {name: 'NHT1048-15 - Sistemática e Biogeografia (2-2-4)', page: '714'},
  {name: 'ESHR018-13 - Sociedade Civil Organizada Global (4-0-4)', page: '714'},
  {name: 'ESHT023-13 - Sociologia dos Territórios (4-0-4)', page: '715'},

  {name: 'ESZE006-13 - Subestação e Equipamentos (2-0-4)', page: '716'},
  {name: 'ESZE005-13 - Supervisão e Confiabilidade de Sistemas Energéticos (3-1-4)', page: '717'},
  {name: 'ESZA015-13 - Supervisão e Monitoramento de Processos Energéticos (1-3-4)', page: ' 717'},
  {name: 'ESHR019-13 - Surgimento da China como potência mundial (4-0-4)', page: ' 718'},
  {name: 'ESZT014-13 - Sustentabilidade e Indicadores (4-0-4)', page: '719'},
  {name: 'ESHR901-13 - TCC de Relações Internacionais I (0-2-6)', page: '720'},
  {name: 'ESHR902-13 - TCC de Relações Internacionais II (0-2-6)', page: '720'},
  {name: 'NHZ1081-13 - Técnicas Aplicadas a Processos Biotecnológicos (4-2-4)', page: '721'},
  {name: 'MCZA050-15 - Técnicas Avançada de Programação (4-0-4)', page: '721'},
  {name: 'ESTS010-13 - Técnicas de Análise Estrutural e Projeto (3-1-4)', page: '722'},
  {name: 'ESZG004-13 - Técnicas de Tomadas de Decisão Aplicáveis em Modelos de Dependência (2-2-4)', page: '723'},
  {name: 'ESZG005-13 - Técnicas de Tomadas de Decisão Aplicáveis em Modelos de Interdependência (2-2-4)', page: '723'},
  {name: 'ESHC901-13 - Técnicas em Pesquisa (2-3-0)', page: '724'},
  {name: 'ESZS022-13 - Técnicas Experimentais em Propulsão (3-2-6)', page: '725'},
  {name: 'ESZB009-13 - Técnicas Modernas em Fotodiagnóstico (3-1-4)', page: '726'},
  {name: 'ESZB008-13 - Técnicas Modernas em Fototerapia (3-1-4)', page: '726'},
  {name: 'ESZE017-13 - Tecnologia da Combustão (1-2-4)', page: '727'},
  {name: 'ESTG018-13 - Tecnologia da Informação (2-0-3)', page: '727'},
  {name: 'NHZ4065-15 - Tecnologia de Alimentos (2-2-2)', page: '728'},
  {name: 'NHZ4070-15 - Tecnologia de Biomateriais (3-1-4)', page: '729'},
  {name: 'ESZM013-13 - Tecnologia de Elastômeros (4-0-4)', page: '730'},
  {name: 'ESZI018-13 - Tecnologia de Redes Ópticas (4-0-4)', page: ' 730'},
  {name: 'NHZ3052-15 - Tecnologia do Vácuo e Criogenia (2-2-4)', page: '731'},
  {name: 'NHZ5019-15 - Tecnologias da Informação e Comunicação na Educação (3-0-3)', page: '732'},
  {name: 'ESZP031-13 - Tecnologias Sociais (4-0-4)', page: '732'},
  {name: 'ESTI014-13 - Telefonia Fixa Moderna (3-1-4)', page: '734'},
  {name: 'ESZB016-13 - Telemedicina e Sistemas de Apoio a Decisão (2-2-5)', page: '735'},
  {name: 'ESHP020-13 - Temas Contemporâneos (2-2-4)', page: '735'},
  {name: 'ESZG027-13 - Temas Contemporâneos de Custos em Sistemas de Gestão (4-0-5)', page: '736'},
  {name: 'NHZ2066-11 - Temas da Filosofia Antiga (4-0-4)', page: '737'},
  {name: 'NHZ2067-11 - Temas da Filosofia Contemporânea (4-0-4)', page: '737'},
  {name: 'NHZ2068-11 - Temas da Filosofia Medieval (4-0-4)', page: ' 738'},
  {name: 'NHZ2069-11 - Temas da Filosofia Moderna (4-0-4)', page: '738'},
  {name: 'NHZ2070-11 - Temas de Lógica (4-0-4)', page: '739'},
  {name: 'BHP0201-15 - Temas e Problemas em Filosofia (4-0-4)', page: '739'},
  {name: 'ESTG019-13 - Tempos, Métodos e Arranjos Físicos (2-2-5)', page: '740'},
  {name: 'MCTD015-13 - Tendências em Educação Matemática (4-0-4)', page: '740'},

  {name: 'MCTB023-13 - Teoria Aritmética dos Números (4-0-4)', page: '741'},
  {name: 'MCZB029-13 - Teoria Aritmética dos Números II (4-0-4)', page: '742'},
  {name: 'MCZB030-13 - Teoria Axiomática dos Conjuntos (4-0-4)', page: '743'},
  {name: 'NHZ3053-15 - Teoria Clássica dos Campos (4-0-4)', page: '744'},
  {name: 'NHZ2071-11 - Teoria Crítica e Escola de Frankfurt (4-0-4)', page: '744'},
  {name: 'NHT2081-09 - Teoria da Ciência (4-0-4)', page: '745'},
  {name: 'ESZS011-13 - Teoria da Elasticidade (4-0-5)', page: '747'},
  {name: 'ESTI008-13 - Teoria da Informação e Códigos (4-0-4)', page: '747'},
  {name: 'MCTB020-13 - Teoria da Medida e Integração (4-0-4)', page: '748'},
  {name: 'MCZB033-13 - Teoria da Recursão e Computabilidade (4-0-4)', page: '749'},
  {name: 'NHT3054-15 - Teoria da Relatividade (4-0-4)', page: '750'},
  {name: 'ESZG008-13 - Teoria das Decisões (2-0-3)', page: '751'},
  {name: 'MCZB032-13 - Teoria das Filas (4-0-4)', page: '751'},
  {name: 'ESZA006-13 - Teoria de Controle Ótimo (3-0-4)', page: '752'},
  {name: 'ESZI006-13 - Teoria de Filas e Análise de Desempenho (3-1-4)', page: '753'},
  {name: 'NHZ3056-15 - Teoria de Grupos em Física (4-0-4)', page: '753'},
  {name: 'NHZ4067-15 - Teoria de Grupos: Moléculas e Sólidos (2-0-2)', page: '754'},
  {name: 'NHZ5015-09 - Teoria do Conhecimento Científico (4-0-4)', page: '755'},
  {name: 'NHH2072-13 - Teoria do conhecimento: a epistemologia contemporânea (4-0-4)', page: '755'},
  {name: 'NHH2073-13 - Teoria do Conhecimento: Empirismo versus Racionalismo (4-0-4)', page: '756'},
  {name: 'ESTU019-13 - Teoria do Planejamento Urbano e Ambiental (3-0-4)', page: '757'},
  {name: 'MCTA027-15 - Teoria dos Grafos (3-1-4)', page: '758'},
  {name: 'MCZB031-13 - Teoria dos Jogos (4-0-4)', page: '759'},
  {name: 'ESHP029-14 - Teoria e Gestão de Organizações Públicas (4-0-4)', page: '759'},
  {name: 'NHT3055-13 - Teoria Eletromagnética (4-2-6)', page: '760'},
  {name: 'MCZA048-14 - Teoria Espectral de Grafos (4-0-4)', page: '760'},
  {name: 'ESTO010-13 - Termodinâmica Aplicada (3-1-5)', page: '761'},
  {name: 'ESTE010-13 - Termodinâmica Aplicada II (3-1-5)', page: '761'},
  {name: 'ESTM009-13 - Termodinâmica Estatística de Materiais (4-0-4)', page: '762'},
  {name: 'NHT4057-15 - Termodinâmica Química (4-0-6)', page: '763'},
  {name: 'ESZE042-13 - Termo-Hidráulica de Reatores Nucleares I (4-0-6)', page: '763'},
  {name: 'ESZE043-13 - Termo-Hidráulica de Reatores Nucleares II (3-0-5)', page: '764'},
  {name: 'ESZT015-13 - Território e Logística (4-0-4)', page: '764'},
  {name: 'BHQ0301-15 - Território e Sociedade (4-0-4)', page: '765'},
  {name: 'MCZC011-15 - Tomada de Decisões e Neuroeconomia (4-0-4)', page: ' 766'},
  {name: 'ESZC018-13 - Tópicos Avançados em Macroeconomia (4-0-3)', page: '767'},
  {name: 'NHZ2074-11 - Tópicos Avançados em Modalidades: Lógica Deôntica e Lógica Epistêmica (2-0-2)', page: '767'},

  {name: 'NHT4055-15 - Tópicos Avançados em Química Orgânica (2-0-2)', page: ' 768'},
  {name: 'ESTM003-13 - Tópicos Computacionais em Materiais (2-2-5)', page: '769'},
  {name: 'NHZ2075-11 - Tópicos de História da Ciência (4-0-4)', page: '769'},
  {name: 'NHZ2076-11 - Tópicos de Lógicas Não-Clássicas (4-0-4)', page: '770'},
  {name: 'NHZ2078-08 - Tópicos de Metodologia da Ciência (3-0-4)', page: '771'},
  {name: 'ESZE016-13 - Tópicos de Otimização em Sistemas Elétricos de Potência e Aplicações (1-1-4)', page: '771'},
  {name: 'NHZ3058-15 - Tópicos em Física Experimental (1-3-4)', page: '772'},
  {name: 'NHZ3057-15 - Tópicos em Física Teórica (4-0-4)', page: '772'},
  {name: 'NHZ2077-11 - Tópicos em Teoria do Conhecimento (4-0-4)', page: '772'},
  {name: 'MCZA049-14 - Tópicos Emergentes em Banco de Dados (4-0-4)', page: '773'},
  {name: 'ESZU018-13 - Tópicos Especiais em Engenharia Ambiental e Urbana (3-1-4)', page: '774'},
  {name: 'ESZG022-13 - Tópicos Especiais em Engenharia Organizacional (2-0-2)', page: '774'},
  {name: 'ESTM002-13 - Tópicos Experimentais em Materiais I (0-4-4)', page: '774'},
  {name: 'ESZM012-13 - Tópicos Experimentais em Materiais II (0-4-4)', page: '775'},
  {name: 'MCTB026-13 - Topologia (4-0-4)', page: '776'},
  {name: 'NHZ1050-15 - Toxicologia (4-2-4)', page: '777'},
  {name: 'ESHP902-14 - Trabalho de Conclusão de Curso de Políticas Públicas I (0-3-6)', page: '777'},
  {name: 'ESHP903-14 - Trabalho de Conclusão de Curso de Políticas Públicas II (0-3-6)', page: '778'},
  {name: 'NHT3089-15 - Trabalho de Conclusão de Curso em Física (2-0-10)', page: '778'},
  {name: 'MCTB024-13 - Trabalho de Conclusão de Curso em Matemática I (0-2-4)', page: '779'},
  {name: 'MCTB025-13 - Trabalho de Conclusão de Curso em Matemática II (0-2-4)', page: '779'},
  {name: 'MCTB027-13 - Trabalho de Conclusão de Curso em Matemática III (0-2-4)', page: '780'},
  {name: 'NHT4046-15 - Trabalho de Conclusão de Curso em Química (2-0-2)', page: '780'},
  {name: 'ESTS902-13 - Trabalho de Graduação I em Engenharia Aeroespacial (0-2-4)', page: '780'},
  {name: 'ESTU902-13 - Trabalho de Graduação I em Engenharia Ambiental e Urbana (0-2-4)', page: '781'},
  {name: 'ESTB902-13 - Trabalho de Graduação I em Engenharia Biomédica (0-2-4)', page: '781'},
  {name: 'ESTE902-13 - Trabalho de Graduação I em Engenharia de Energia (0-2-4)', page: '781'},
  {name: 'ESTG902-13 - Trabalho de Graduação I em Engenharia de Gestão (0-2-4)', page: '782'},
  {name: 'ESTI902-13 - Trabalho de Graduação I em Engenharia de Informação (0-2-4)', page: '782'},
  {name: 'ESTA902-13 - Trabalho de Graduação I em Engenharia de Instrumentação, Automação e Robótica (0-2-4)', page: '782'},
  {name: 'ESTM902-13 - Trabalho de Graduação I em Engenharia de Materiais (0-2-4)', page: '783'},
  {name: 'ESTS903-13 - Trabalho de Graduação II em Engenharia Aeroespacial (0-2-4)', page: '783'},
  {name: 'ESTU903-13 - Trabalho de Graduação II em Engenharia Ambiental e Urbana (0-2-4)', page: '783'},
  {name: 'ESTB903-13 - Trabalho de Graduação II em Engenharia Biomédica (0-2-4)', page: '784'},
  {name: 'ESTE903-13 - Trabalho de Graduação II em Engenharia de Energia (0-2-4)', page: '784'},
  {name: 'ESTG903-13 - Trabalho de Graduação II em Engenharia de Gestão (0-2-4)', page: '784'},
  {name: 'ESTI903-13 - Trabalho de Graduação II em Engenharia de Informação (0-2-4)', page: '785'},

  {name: 'ESTA903-13 - Trabalho de Graduação II em Engenharia de Instrumentação, Automação e Robótica (0-2-4)', page: '785'},
  {name: 'ESTM903-13 - Trabalho de Graduação II em Engenharia de Materiais (0-2-4)', page: '785'},
  {name: 'ESTS904-13 - Trabalho de Graduação III em Engenharia Aeroespacial (0-2-4)', page: '786'},
  {name: 'ESTU904-13 - Trabalho de Graduação III em Engenharia Ambiental e Urbana (0-2-4)', page: '786'},
  {name: 'ESTB904-13 - Trabalho de Graduação III em Engenharia Biomédica (0-2-4)', page: '786'},
  {name: 'ESTE904-13 - Trabalho de Graduação III em Engenharia de Energia (0-2-4)', page: '787'},
  {name: 'ESTG904-13 - Trabalho de Graduação III em Engenharia de Gestão (0-2-4)', page: '787'},
  {name: 'ESTI904-13 - Trabalho de Graduação III em Engenharia de Informação (0-2-4)', page: '788'},
  {name: 'ESTA904-13 - Trabalho de Graduação III em Engenharia de Instrumentação, Automação e Robótica (0-2-4)', page: '788'},
  {name: 'ESTM904-13 - Trabalho de Graduação III em Engenharia de Materiais (0-2-4)', page: '788'},
  {name: 'NHZ1082-15 - Trabalhos de Campo, Coleta e Preservação de Organismos (0-4-2)', page: '789'},
  {name: 'ESZR013-13 - Trajetória da OPEP e da Agência Internacional de Energia (IEA) (4-0-4)', page: '789'},
  {name: 'ESZR014-13 - Trajetória de desenvolvimento de países exportadores de petróleo (4-0-4)', page: '791'},
  {name: 'ESZR015-13 - Trajetória dos investimentos produtivos no Brasil e do Brasil (4-0-4)', page: '792'},
  {name: 'ESHP021-13 - Trajetórias das Políticas de CT&I no Brasil (4-0-4)', page: '792'},
  {name: 'ESHR027-14 - Trajetórias Internacionais do Continente Africano (4-0-4)', page: '793'},
  {name: 'ESZE030-13 - Tranferência de Calor e Mecânica dos Fluidos Computacional II (2-2-4)', page: '794'},
  {name: 'ESTS018-13 - Transferência de Calor Aplicada a Sistemas Aeroespaciais (3-1-4)', page: '794'},
  {name: 'ESZE029-13 - Transferência de Calor e Mecânica dos Fluidos Computacional I (2-2-4)', page: '795'},
  {name: 'ESTE012-13 - Transferência de Calor I (3-1-4)', page: '796'},
  {name: 'ESTE013-13 - Transferência de Calor II (3-1-4)', page: '797'},
  {name: 'ESZE020-13 - Transferência de Calor Industrial (2-2-4)', page: '797'},
  {name: 'ESTU020-13 - Transferência de Massa (3-1-5)', page: '798'},
  {name: 'ESZG016-13 - Transferência de Tecnologia (3-1-4)', page: '799'},
  {name: 'BCL0307-15 - Transformações Químicas (3-2-6)', page: '800'},
  {name: 'ESTI003-13 - Transformadas em Sinais e Sistemas Lineares (4-0-4)', page: '800'},
  {name: 'ESZE065-13 - Transporte de Petróleo e Gás Natural (4-0-4)', page: '801'},
  {name: 'ESZU019-13 - Transportes e Meio Ambiente (0-2-4)', page: '802'},
  {name: 'ESTU021-13 - Transportes e Mobilidade Urbana (2-0-4)', page: '803'},
  {name: 'ESZU020-13 - Transportes, Uso e Ocupação do Solo (1-1-4)', page: '804'},
  {name: 'ESZE028-13 - Tubulações Industriais (2-0-4)', page: '804'},
  {name: 'ESZI004-13 - TV Digital (3-1-4)', page: '805'},
  {name: 'ESZU021-13 - Unidades de Conservação da Natureza (3-1-2)', page: '805'},
  {name: 'ESZT016-13 - Urbanização Brasileira (4-0-4)', page: '806'},
  {name: 'ESHT024-13 - Uso do Solo Urbano (4-0-4)', page: '807'},
  {name: 'ESZE056-13 - Uso Final de Energia e Eficiência Energética (3-1-5)', page: '808'},
  {name: 'NHT3066-15 - Variáveis Complexas e Aplicações (4-0-4)', page: '809'},

  {name: 'ESZE026-13 - Ventilação Industrial e Ar Comprimido (2-0-4)', page: '810'},
  {name: 'ESTS008-13 - Vibrações (4-0-4)', page: '810'},
  {name: 'MCZA030-13 - Vida Artificial na Computação (2-0-4)', page: '811'},
  {name: 'ESZP037-14 - Violência e Segurança Pública (4-0-4)', page: '811'},
  {name: 'NHZ1051-13 - Virologia (4-0-4)', page: ' 812'},
  {name: 'ESZA019-13 - Visão Computacional (3-1-4)', page: '812'},
  {name: 'MCZA031-13 - WebSemântica (4-0-4)', page: '813'},
  {name: 'NHT1063-15 - Zoologia de Invertebrados I (2-4-3)', page: '814'},
  {name: 'NHT1064-15 - Zoologia de Invertebrados II (2-4-3)', page: '814'},
  {name: 'NHT1065-15 - Zoologia de Vertebrados (4-2-3)', page: '815'},
  {name: 'NHT1089-15 - Zoologia Geral dos Invertebrados (4-2-3)', page: '815'}]

},{}]},{},[4]);
