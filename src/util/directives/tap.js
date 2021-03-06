'use strict';

import Vue from 'vue';
import { dom } from 'util'

const _ = Vue.util
const input_error = 8
const ontouch = {
  start: ('ontouchstart' in window) ? 'touchstart' : 'mousedown',
  move: ('ontouchmove' in window) ? 'touchmove' : 'mousemove',
  end: ('ontouchend' in window) ? 'touchend' : 'mouseup'
};


let getInputPoint = function(event) {
  let touches = (event.changedTouches && event.changedTouches[0]) || event

  if (touches) {
    return {
      x: touches.clientX,
      y: touches.clientY
    }
  } else {
    return {
      x: event.offsetX,
      y: event.offsetY
    }
  }
}

export default {
  acceptStatement: true,
  priority: 700,

  bind() {},

  update(handler) {
    let start = {x: 0, y: 0},
      end = {x: 0, y: 0}

    if (typeof handler !== 'function') {
      _.warn(
        'Directive "v-on:' + this.expression + '" ' +
        'expects a function value.'
      )
      return
    }

    this.reset()

    this.handler = function(e) {
      e.targetVM = this.vm
      this.vm.$event = e

      let res = handler(e)
      if (this.vm) this.vm.$event = null

      return res
    }.bind(this)

    this.hoverTimer = null

    this.clearHover = function() {
      this.el && this.el.classList.remove('hover')
      clearTimeout(this.hoverTimer)
      clearTimeout(this.removHoverTimer)
    }.bind(this);

    this.startHandler = function(e) {
      if (this.el) {
        this.hoverTimer = setTimeout(() => {
          this.el && this.el.classList.add('hover')
          // this.removHoverTimer = setTimeout(() => {
          //     this.clearHover();
          // }, 140);
        }, 80)
      }

      if (this.arg === 'start') {
        this.handler(e)
      } else if (this.arg === 'tap') {
        start = getInputPoint(e)
      }
    }.bind(this)

    this.moveHandler = function(e) {
      clearTimeout(this.hoverTimer)
      this.clearHover()

      if (this.arg === 'move') {
        this.handler(e)
      }
    }.bind(this)

    this.endHandler = function(e) {
      let fn = function() {
        this.clearHover();

        if (this.arg === 'end') {
          this.handler(e);
        } else if (this.arg === 'tap') {
          end = getInputPoint(e);

          if (Math.abs(start.x - end.x) <= input_error &&
            Math.abs(start.y - end.y) <= input_error) {
            let el = document.elementFromPoint(end.x, end.y);

            if (dom(el).matchNode(this.el)) {
              this.handler(e);
            }
          }
        }
      }.bind(this)

      if (this.el) {
        this.endTimer = setTimeout(() => {
          fn()
          clearTimeout(this.endTimer)
        }, 150)
      } else {
        fn()
      }
    }.bind(this)

    if (this.arg === 'start' || this.arg === 'tap') {
      dom(this.el).on(ontouch.start, this.startHandler)
    }

    if (this.arg === 'move' || this.arg === 'tap') {
      dom(this.el).on(ontouch.move, this.moveHandler)
    }

    if (this.arg === 'end' || this.arg === 'tap') {
      dom(this.el).on(ontouch.end, this.endHandler)
    }
  },

  reset() {
    if (this.startHandler) dom(this.el).off(ontouch.start, this.startHandler)
    if (this.moveHandler) dom(this.el).off(ontouch.move, this.moveHandler)
    if (this.endHandler) dom(this.el).off(ontouch.end, this.endHandler)
  },

  unbind() {
    this.reset()
  }
}
