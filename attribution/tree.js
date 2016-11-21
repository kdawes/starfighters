var fs = require('fs')
module.exports = function () {
  var t = {}
  var ins = function (head, value) {
    // console.log('ins ' + value.order.id)
    if (undefined === head.value || null === head.value) {
      console.log('set initial')
      head.value = value
      return
    }

    if (value.order.id < head.value.order.id) {
      if (undefined !== head.left) {
        ins(head.left, value)
      } else {
        head.left = {}
        head.left.value = value
        return
      }
    } else if (value.order.id > head.value.order.id) {
      if (undefined !== head.right) {
        ins(head.right, value)
      } else {
        head.right = {}
        head.right.value = value
        return
      }
    }
  }

  var inorder = function (head) {
    if (undefined !== head.left) {
      inorder(head.left)
    }
    if (head && head.value && head.value.order) {
      var counterPartyId = (head.value.order.id == head.value.standingId) ? head.value.incomingId : head.value.standingId
      var counterOrder = getPostorder(head, counterPartyId) || {}
      console.log('COUNTERORDER ', JSON.stringify(counterOrder))
      if (counterOrder.order) {
        console.log([
          head.value.order.id,
          ':',
          head.value.order.account ,
          head.value.order.direction,
          counterOrder.filled,
          (head.value.order.direction == 'sell') ? 'to' : 'from',
          //  counterPartyId
          counterOrder.account,
          '@',
          counterOrder.order.price
        ].join(' '))
      }
    }
    if (undefined !== head.right) {
      inorder(head.right)
    }
  }

  function getPostorder (head, value) {
    // console.log('GETPREORDER : ', value, ' checking : ', (head && head.value) ? head.value.order.id : 'na') // JSON.stringify(head.value, null, 2))
    var ret = null

    if (undefined !== head.left) {
      return getPostorder(head.left, value)
    }
    if (undefined !== head.right) {
      return getPostorder(head.right, value)
    }
    if (head && head.value && head.value.order.id == value) {
      // console.log('FOUND IT! : ', head.value.order.id)
      return head.value
    }
  }
  var preorder = function (head) {
    console.log(JSON.stringify(head.value, null, 2))
    if (undefined !== head.left) {
      preorder(head.left)
    }
    if (undefined !== head.right) {
      preorder(head.right)
    }
  }

  var postorder = function (head) {
    if (undefined !== head.left) {
      postorder(head.left)
    }
    if (undefined !== head.right) {
      postorder(head.right)
    }
    if (head && head.value && head.value.order) {
      var counterPartyId = (head.value.order.id == head.value.standingId) ? head.value.incomingId : head.value.standingId
      var counterOrder = getPostorder(head, counterPartyId) || {}
      console.log('Order : ', head.value.order.id, ' COUNTERORDER ', JSON.stringify(counterPartyId),
        ' incomingId : ', head.value.incomingId, ' standingId ', head.value.standingId)
    // if (counterOrder.order) {
    //   console.log([
    //     head.value.order.id,
    //     ':',
    //     head.value.order.account ,
    //     head.value.order.direction,
    //     counterOrder.filled,
    //     (head.value.order.direction == 'sell') ? 'to' : 'from',
    //     //  counterPartyId
    //     counterOrder.account,
    //     '@',
    //     counterOrder.order.price
    //   ].join(' '))
    // }
    }
  // console.log(JSON.stringify(head.value, null, 2))
  }

  return {
    attribution: function (value) {
      return getPostorder(t, value)
    },
    insert: function (value) {
      ins(t, value)
    },
    traverse_inorder: function () {
      inorder(t)
    },
    traverse_preorder: function () {
      preorder(t)
    },
    traverse_postorder: function () {
      postorder(t)
    }
  }
}

// var s = new Tree()

// s.insert( 1 )
// s.insert( 2 )
// s.insert('abcdefg')
// s.insert( 5 )
// s.insert( 0 )

// console.log('inorder')
// s.traverse_inorder()
// console.log('preorder')
// s.traverse_preorder()
// console.log('postorder')
// s.traverse_postorder()

// var getRand = function () {
//   var b = new Buffer(4)
//   var mode = '0666'
//   var fd = fs.openSync('/dev/urandom', 'r', mode)
//   fs.readSync(fd, b, 0, 4, null)
//   fs.close(fd)
//
//   return b
// }
//
// var i = 0
// for (i = 0; i < 10; i++) {
//   var tmp = Math.floor(Math.random() * 4196)
//   s.insert(tmp)
// }

// s.traverse_inorder()
// s.traverse_preorder()
// s.traverse_postorder()
