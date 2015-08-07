function transitionEnd() {
  var el = document.createElement('bootstrap')

  var transEndEventNames = {
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'transitionend',
    OTransition: 'oTransitionEnd otransitionend',
    transition: 'transitionend'
  }

  for (var name in transEndEventNames) {
    if (el.style[name] !== undefined) {
      return {
        end: transEndEventNames[name]
      }
    }
  }

  return false // explicit for ie8 (  ._.)
}

// http://blog.alexmaccaw.com/css-transitions
$.fn.emulateTransitionEnd = function(duration) {
    var called = false
    var $el = this
    $(this).one('bsTransitionEnd', function() {
      called = true
    })
    var callback = function() {
      if (!called) $($el).trigger($.support.transition.end)
    }
    setTimeout(callback, duration)
    return this
}
//获取浏览器窗口大小
function getWinSize() {
    var re = {};
    if (document.documentElement && document.documentElement.clientHeight) {
      var doc = document.documentElement;
      re.width = (doc.clientWidth > doc.scrollWidth) ? doc.clientWidth - 1 : doc.scrollWidth;
      re.height = (doc.clientHeight > doc.scrollHeight) ? doc.clientHeight : doc.scrollHeight;
    } else {
      var doc = document.body;
      re.width = (window.innerWidth > doc.scrollWidth) ? window.innerWidth : doc.scrollWidth;
      re.height = (window.innerHeight > doc.scrollHeight) ? window.innerHeight : doc.scrollHeight;
    }
    return re;
}
$(function() {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function(e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
})
